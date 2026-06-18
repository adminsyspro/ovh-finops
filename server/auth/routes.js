/**
 * OIDC Authentication Routes (openid-client v6.x)
 */
const express = require('express');
const { randomState, randomNonce } = require('openid-client');
const oidcClient = require('./oidc-client');
const sessionStore = require('./session-store');
const localUsers = require('./local-users');

const router = express.Router();

// Temporary state storage (in-memory, cleaned up after 10 min)
// Max 1000 pending auth requests to prevent memory exhaustion
const pendingAuth = new Map();
const PENDING_AUTH_MAX_SIZE = 1000;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeReturnTo(value) {
  const returnTo = typeof value === 'string' ? value : '/';
  return returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
}

function renderLocalLogin({ error, returnTo }) {
  const errorBlock = error
    ? `<div class="error">${escapeHtml(error)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Connexion - OVH FinOps</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f6f8fb; color: #111827; }
    .panel { width: min(400px, calc(100vw - 32px)); border: 1px solid #d9dee8; border-radius: 12px; background: #fff; padding: 32px; box-shadow: 0 18px 60px rgb(15 23 42 / 12%); }
    .brand { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .logo { display: block; width: 82px; height: auto; margin-bottom: 18px; color: #000e9c; }
    h1 { margin: 0; font-size: 24px; line-height: 1.2; letter-spacing: 0; }
    p { margin: 8px 0 28px; color: #667085; font-size: 14px; }
    label { display: block; margin: 14px 0 6px; color: #344054; font-size: 13px; font-weight: 600; }
    input { box-sizing: border-box; width: 100%; height: 40px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 12px; font: inherit; background: #fff; color: #111827; }
    button { width: 100%; height: 40px; margin-top: 20px; border: 0; border-radius: 8px; background: #000e9c; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    button:hover { background: #0718bd; }
    .error { margin: 0 0 16px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; color: #b42318; padding: 10px 12px; font-size: 13px; }
  </style>
</head>
<body>
  <main class="panel">
    <div class="brand">
      <svg class="logo" viewBox="0 0 1505 909" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="OVH">
        <path fill="currentColor" fill-rule="evenodd" d="m1407.08 52.27-160.24 283.35h-168.16L880.85 684.34h168.16l-126.62 223.9h413.47c193.88-243.71 223.55-582.53 71.22-855.97M592.01 908.24 1116.27.76H673.13L372.42 523.85 99.41 50.29C-54.9 323.73-27.2 664.53 172.61 908.24z" />
      </svg>
      <h1>OVH FinOps</h1>
      <p>Maitrisez la consommation de vôtre infrastructure.</p>
    </div>
    ${errorBlock}
    <form method="post" action="/auth/login">
      <input type="hidden" name="returnTo" value="${escapeHtml(safeReturnTo(returnTo))}" />
      <label for="username">Utilisateur</label>
      <input id="username" name="username" autocomplete="username" required autofocus />
      <label for="password">Mot de passe</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required />
      <button type="submit">Connexion</button>
    </form>
  </main>
</body>
</html>`;
}

function setupLocalRoutes(authConfig) {
  router.get('/login', (req, res) => {
    res.type('html').send(renderLocalLogin({ returnTo: req.query.returnTo || '/' }));
  });

  router.post('/login', express.urlencoded({ extended: false }), (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const user = localUsers.authenticate(username, password);

    if (!user) {
      return res.status(401).type('html').send(renderLocalLogin({
        error: 'Identifiants invalides',
        returnTo: req.body?.returnTo || '/'
      }));
    }

    const userInfo = {
      sub: user.username,
      preferred_username: user.username,
      name: user.name || user.username,
      email: user.email || null
    };
    const sid = sessionStore.create(user.username, userInfo, {}, null, authConfig.session.maxAge);

    res.cookie(authConfig.session.name, sid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: authConfig.session.maxAge
    });

    res.redirect(safeReturnTo(req.body?.returnTo));
  });

  router.get('/logout', (req, res) => {
    const sid = req.cookies[authConfig.session.name];
    if (sid) {
      sessionStore.remove(sid);
    }
    res.clearCookie(authConfig.session.name);
    res.redirect('/auth/login');
  });

  return router;
}

function setup(config) {
  const authConfig = config.auth;

  if (authConfig.type === 'local') {
    return setupLocalRoutes(authConfig);
  }

  // GET /auth/login - Initiate OIDC flow
  router.get('/login', (req, res) => {
    const oidcConfig = oidcClient.getConfig();
    if (!oidcConfig) {
      return res.status(503).json({ error: 'OIDC not configured' });
    }

    // Reject if too many pending auth requests (DoS protection)
    if (pendingAuth.size >= PENDING_AUTH_MAX_SIZE) {
      console.warn(`pendingAuth limit reached (${PENDING_AUTH_MAX_SIZE}), rejecting new auth request`);
      return res.status(503).json({ error: 'Too many pending authentication requests. Please try again later.' });
    }

    const state = randomState();
    const nonce = randomNonce();

    // Store state for callback validation
    pendingAuth.set(state, {
      nonce,
      returnTo: req.query.returnTo || '/',
      createdAt: Date.now()
    });

    // Cleanup after 10 minutes
    setTimeout(() => pendingAuth.delete(state), 600000);

    const authUrl = oidcClient.buildAuthUrl(state, nonce);
    res.redirect(authUrl.href);
  });

  // GET /auth/callback - Handle OIDC callback
  router.get('/callback', async (req, res) => {
    const oidcConfig = oidcClient.getConfig();
    if (!oidcConfig) {
      return res.status(503).json({ error: 'OIDC not configured' });
    }

    try {
      const state = req.query.state;
      const pending = pendingAuth.get(state);

      if (!pending) {
        return res.status(400).send('Invalid or expired state parameter');
      }

      pendingAuth.delete(state);

      // Build current URL for callback validation
      const currentUrl = new URL(req.originalUrl, authConfig.baseUrl);
      console.log('OIDC callback URL:', currentUrl.href);

      // Exchange code for tokens
      const tokens = await oidcClient.handleCallback(currentUrl, state, pending.nonce);
      console.log('OIDC tokens received');

      // Extract sub and sid from id_token claims
      const claims = tokens.claims();
      const sub = claims.sub;
      const oidcSid = claims.sid; // OIDC session ID for back-channel logout

      // Get user info
      const userInfo = await oidcClient.getUserInfo(tokens.access_token, sub);

      // Create session with OIDC sid for back-channel logout support
      const sid = sessionStore.create(
        userInfo.sub,
        userInfo,
        { id_token: tokens.id_token },
        oidcSid,
        authConfig.session.maxAge
      );

      // Set cookie
      res.cookie(authConfig.session.name, sid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: authConfig.session.maxAge
      });

      res.redirect(pending.returnTo);
    } catch (err) {
      console.error('OIDC callback error:', err.message);
      console.error('OIDC callback error details:', err);
      res.status(500).send('Authentication failed: ' + err.message);
    }
  });

  // GET /auth/logout - Front-channel logout
  router.get('/logout', (req, res) => {
    const sid = req.cookies[authConfig.session.name];

    // Delete local session and get id_token
    let idToken = null;
    if (sid) {
      idToken = sessionStore.remove(sid);
    }

    // Clear cookie
    res.clearCookie(authConfig.session.name);

    // Redirect to OP end_session_endpoint if available
    const logoutUrl = oidcClient.getEndSessionUrl(idToken);
    if (logoutUrl) {
      return res.redirect(logoutUrl.href);
    }

    res.redirect('/');
  });

  return router;
}

// POST /logout/backchannel - Back-channel logout (called by OP)
async function backChannelLogout(req, res, config) {
  const oidcConfig = oidcClient.getConfig();
  if (!oidcConfig) {
    return res.status(501).send('OIDC not configured');
  }

  try {
    const { logout_token } = req.body;

    if (!logout_token) {
      return res.status(400).send('logout_token required');
    }

    // Verify JWT signature, expiration, issuer, and audience using openid-client
    // This validates:
    // - Signature against OIDC provider's JWKS
    // - Token expiration (exp claim)
    // - Issuer matches configured OIDC provider
    // - Audience contains our client_id
    // - Required claims (sub or sid) are present per RFC 7523
    const claims = await oidcClient.verifyLogoutToken(logout_token);

    let deleted = 0;

    // Prefer sid-based logout (more specific - single session)
    if (claims.sid) {
      deleted = sessionStore.deleteByOidcSid(claims.sid);
      console.log(`Back-channel logout: deleted ${deleted} session(s) for sid=${claims.sid}`);
    }

    // If no sessions found by sid, or no sid provided, try sub (all user sessions)
    if (deleted === 0 && claims.sub) {
      deleted = sessionStore.deleteByUserId(claims.sub);
      console.log(`Back-channel logout: deleted ${deleted} session(s) for sub=${claims.sub}`);
    }

    // Return 200 OK per spec (even if no sessions deleted)
    res.status(200).send('OK');
  } catch (err) {
    console.error('Back-channel logout error:', err.message);
    res.status(400).send('Invalid logout token');
  }
}

module.exports = {
  setup,
  backChannelLogout
};
