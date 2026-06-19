/**
 * OIDC Authentication Routes (openid-client v6.x)
 */
const express = require('express');
const { randomState, randomNonce } = require('openid-client');
const oidcClient = require('./oidc-client');
const sessionStore = require('./session-store');
const localUsers = require('./local-users');
const ldapClient = require('./ldap-client');
const authSettings = require('../settings/auth-settings');

const router = express.Router();

// Temporary state storage (in-memory, cleaned up after 10 min)
// Max 1000 pending auth requests to prevent memory exhaustion
const pendingAuth = new Map();
const PENDING_AUTH_MAX_SIZE = 1000;
const LANGUAGE_COOKIE = 'ovh-dashboard-language';
const LOGIN_TRANSLATIONS = {
  fr: {
    methodSelector: 'Méthode de connexion',
    configuredProviderMessage: 'Cette méthode est configurée, mais le connecteur d\'authentification n\'est pas encore activé sur le serveur.',
    useLocalLogin: 'Utiliser la connexion locale',
    username: 'Utilisateur',
    password: 'Mot de passe',
    ldapUsername: 'Utilisateur LDAP',
    ldapPassword: 'Mot de passe LDAP',
    submit: 'Connexion',
    title: 'Connexion - OVH FinOps',
    subtitle: 'Maîtrisez la consommation de votre infrastructure.',
    invalidCredentials: 'Identifiants invalides',
    invalidLdapCredentials: 'Identifiants LDAP invalides',
    ldapDisabled: 'LDAP n\'est pas activé',
    ldapLoginError: 'Erreur lors de la connexion LDAP',
    language: 'Langue',
    french: 'Français',
    english: 'Anglais'
  },
  en: {
    methodSelector: 'Login method',
    configuredProviderMessage: 'This method is configured, but the authentication connector is not enabled on the server yet.',
    useLocalLogin: 'Use local login',
    username: 'Username',
    password: 'Password',
    ldapUsername: 'LDAP username',
    ldapPassword: 'LDAP password',
    submit: 'Log in',
    title: 'Login - OVH FinOps',
    subtitle: 'Control your infrastructure consumption.',
    invalidCredentials: 'Invalid credentials',
    invalidLdapCredentials: 'Invalid LDAP credentials',
    ldapDisabled: 'LDAP is not enabled',
    ldapLoginError: 'LDAP login failed',
    language: 'Language',
    french: 'French',
    english: 'English'
  }
};

function normalizeLanguage(value) {
  return value === 'en' ? 'en' : 'fr';
}

function loginT(language, key) {
  return LOGIN_TRANSLATIONS[language]?.[key] || LOGIN_TRANSLATIONS.fr[key] || key;
}

function languageFromAcceptHeader(header) {
  const raw = String(header || '').toLowerCase();
  if (!raw) return null;
  const candidates = raw.split(',')
    .map((part) => {
      const [tag, qPart] = part.trim().split(';');
      const q = qPart?.startsWith('q=') ? Number(qPart.slice(2)) : 1;
      return { tag, q: Number.isFinite(q) ? q : 1 };
    })
    .sort((a, b) => b.q - a.q);
  const match = candidates.find((item) => item.tag === 'fr' || item.tag.startsWith('fr-') || item.tag === 'en' || item.tag.startsWith('en-'));
  return match?.tag.startsWith('en') ? 'en' : match ? 'fr' : null;
}

function resolveLoginLanguage(req, body) {
  return normalizeLanguage(body?.lang || req.cookies?.[LANGUAGE_COOKIE] || languageFromAcceptHeader(req.headers['accept-language']));
}

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

function resolveLoginMethods(database, authConfig) {
  const methods = [];
  const localEnabled = authConfig.type === 'local';

  if (localEnabled) {
    methods.push({ id: 'local', label: 'Local', status: 'ready' });
  }

  if (!database) return methods;

  try {
    const ldap = authSettings.getLdap(database);
    if (ldap.enabled) {
      methods.push({ id: 'ldap', label: 'LDAP', status: 'ready' });
    }
  } catch (err) {
    console.warn('Unable to read LDAP login settings:', err.message);
  }

  try {
    const sso = authSettings.getSso(database);
    if (sso.enabled && sso.protocol === 'oidc') {
      methods.push({ id: 'oidc', label: 'OIDC', status: 'configured', providerName: sso.providerName });
    }
    if (sso.enabled && sso.protocol === 'saml') {
      methods.push({ id: 'saml', label: 'SAML', status: 'configured', providerName: sso.providerName });
    }
  } catch (err) {
    console.warn('Unable to read SSO login settings:', err.message);
  }

  return methods.length > 0 ? methods : [{ id: 'local', label: 'Local', status: 'ready' }];
}

function loginUrl({ provider, returnTo }) {
  const params = new URLSearchParams({
    provider,
    returnTo: safeReturnTo(returnTo)
  });
  return `/auth/login?${params.toString()}`;
}

function renderProviderSelector(methods, selectedProvider, returnTo, language) {
  if (methods.length <= 1) return '';

  const items = methods.map((method) => {
    const selected = method.id === selectedProvider ? ' selected' : '';
    const href = loginUrl({ provider: method.id, returnTo });
    return `<a class="provider${selected}" href="${href}">${escapeHtml(method.label)}</a>`;
  }).join('');

  return `<div class="providers" role="tablist" aria-label="${escapeHtml(loginT(language, 'methodSelector'))}">${items}</div>`;
}

function renderConfiguredProvider(method, returnTo, language) {
  const label = escapeHtml(method.providerName || method.label);
  const returnValue = escapeHtml(safeReturnTo(returnTo));
  return `
    <div class="configured-provider">
      <div class="provider-icon">${escapeHtml(method.label)}</div>
      <h2>${label}</h2>
      <p>${escapeHtml(loginT(language, 'configuredProviderMessage'))}</p>
      <form method="get" action="/auth/login">
        <input type="hidden" name="returnTo" value="${returnValue}" />
        <input type="hidden" name="provider" value="local" />
        <input type="hidden" name="lang" value="${escapeHtml(language)}" />
        <button type="submit" class="secondary">${escapeHtml(loginT(language, 'useLocalLogin'))}</button>
      </form>
    </div>`;
}

function renderCredentialsForm({ provider, returnTo, language, usernameLabel, passwordLabel }) {
  const autofocus = provider === 'local' ? ' autofocus' : '';
  return `<form method="post" action="/auth/login">
      <input type="hidden" name="returnTo" value="${escapeHtml(safeReturnTo(returnTo))}" />
      <input type="hidden" name="provider" value="${escapeHtml(provider)}" />
      <input type="hidden" name="lang" value="${escapeHtml(language)}" />
      <label for="username">${escapeHtml(usernameLabel)}</label>
      <input id="username" name="username" autocomplete="username" required${autofocus} />
      <label for="password">${escapeHtml(passwordLabel)}</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required />
      <button type="submit">${escapeHtml(loginT(language, 'submit'))}</button>
    </form>`;
}

function renderLocalLogin({ error, returnTo, methods, selectedProvider, language = 'fr' }) {
  const availableMethods = methods?.length ? methods : [{ id: 'local', label: 'Local', status: 'ready' }];
  const selected = availableMethods.find((method) => method.id === selectedProvider)?.id || availableMethods[0].id;
  const selectedMethod = availableMethods.find((method) => method.id === selected) || availableMethods[0];
  const errorBlock = error
    ? `<div class="error">${escapeHtml(error)}</div>`
    : '';
  const selector = renderProviderSelector(availableMethods, selected, returnTo, language);
  const body = selectedMethod.id === 'local'
    ? renderCredentialsForm({
      provider: 'local',
      returnTo,
      language,
      usernameLabel: loginT(language, 'username'),
      passwordLabel: loginT(language, 'password')
    })
    : selectedMethod.id === 'ldap'
      ? renderCredentialsForm({
        provider: 'ldap',
        returnTo,
        language,
        usernameLabel: loginT(language, 'ldapUsername'),
        passwordLabel: loginT(language, 'ldapPassword')
      })
    : renderConfiguredProvider(selectedMethod, returnTo, language);

  return `<!DOCTYPE html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(loginT(language, 'title'))}</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: linear-gradient(rgb(246 248 251 / 62%), rgb(246 248 251 / 72%)), url("/login-bg.jpg") center / cover no-repeat fixed; color: #111827; }
    .panel { width: min(400px, calc(100vw - 32px)); border: 1px solid rgb(217 222 232 / 82%); border-radius: 12px; background: rgb(255 255 255 / 92%); padding: 32px; box-shadow: 0 18px 60px rgb(15 23 42 / 18%); backdrop-filter: blur(10px); }
    .brand { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .logo { display: block; width: 82px; height: auto; margin-bottom: 18px; color: #000e9c; }
    h1 { margin: 0; font-size: 24px; line-height: 1.2; letter-spacing: 0; }
    p { margin: 8px 0 28px; color: #667085; font-size: 14px; }
    .providers { display: grid; grid-template-columns: repeat(auto-fit, minmax(84px, 1fr)); gap: 8px; margin: 0 0 20px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f8fafc; padding: 4px; }
    .provider { display: flex; align-items: center; justify-content: center; min-height: 34px; border-radius: 8px; color: #475467; text-decoration: none; font-size: 13px; font-weight: 700; }
    .provider:hover { color: #111827; background: #eef2ff; }
    .provider.selected { background: #000e9c; color: #fff; box-shadow: 0 6px 16px rgb(0 14 156 / 18%); }
    label { display: block; margin: 14px 0 6px; color: #344054; font-size: 13px; font-weight: 600; }
    input { box-sizing: border-box; width: 100%; height: 40px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 12px; font: inherit; background: #fff; color: #111827; }
    button { width: 100%; height: 40px; margin-top: 20px; border: 0; border-radius: 8px; background: #000e9c; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    button:hover { background: #0718bd; }
    button.secondary { margin-top: 14px; border: 1px solid #cbd5e1; background: #fff; color: #111827; }
    button.secondary:hover { background: #f8fafc; }
    .error { margin: 0 0 16px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; color: #b42318; padding: 10px 12px; font-size: 13px; }
    .configured-provider { border: 1px solid #d9dee8; border-radius: 10px; background: #f8fafc; padding: 18px; text-align: center; }
    .provider-icon { display: inline-flex; align-items: center; justify-content: center; height: 36px; min-width: 52px; border-radius: 9px; background: #eef2ff; color: #000e9c; font-size: 12px; font-weight: 800; }
    .configured-provider h2 { margin: 12px 0 6px; font-size: 17px; letter-spacing: 0; }
    .configured-provider p { margin: 0; }
  </style>
</head>
<body>
  <main class="panel">
    <div class="brand">
      <svg class="logo" viewBox="0 0 1505 909" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="OVH">
        <path fill="currentColor" fill-rule="evenodd" d="m1407.08 52.27-160.24 283.35h-168.16L880.85 684.34h168.16l-126.62 223.9h413.47c193.88-243.71 223.55-582.53 71.22-855.97M592.01 908.24 1116.27.76H673.13L372.42 523.85 99.41 50.29C-54.9 323.73-27.2 664.53 172.61 908.24z" />
      </svg>
      <h1>OVH FinOps</h1>
      <p>${escapeHtml(loginT(language, 'subtitle'))}</p>
    </div>
    ${selector}
    ${errorBlock}
    ${body}
  </main>
</body>
</html>`;
}

function setupLocalRoutes(authConfig, database) {
  router.get('/login', (req, res) => {
    const methods = resolveLoginMethods(database, authConfig);
    const language = resolveLoginLanguage(req);
    res.cookie(LANGUAGE_COOKIE, language, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 31536000000
    });
    res.type('html').send(renderLocalLogin({
      returnTo: req.query.returnTo || '/',
      methods,
      selectedProvider: req.query.provider || 'local',
      language
    }));
  });

  router.post('/login', express.urlencoded({ extended: false }), (req, res) => {
    const provider = String(req.body?.provider || 'local').trim();
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const language = resolveLoginLanguage(req, req.body);
    const methods = resolveLoginMethods(database, authConfig);
    res.cookie(LANGUAGE_COOKIE, language, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 31536000000
    });

    const fail = (messageKey) => res.status(401).type('html').send(renderLocalLogin({
      error: loginT(language, messageKey),
      returnTo: req.body?.returnTo || '/',
      methods,
      selectedProvider: provider,
      language
    }));

    if (provider === 'ldap') {
      return Promise.resolve()
        .then(async () => {
          const ldapConfig = authSettings.getLdapPrivate(database);
          if (!ldapConfig.enabled) {
            return fail('ldapDisabled');
          }

          const ldapUser = await ldapClient.authenticate(ldapConfig, username, password);
          if (!ldapUser) {
            return fail('invalidLdapCredentials');
          }

          const userInfo = {
            sub: ldapUser.id,
            preferred_username: ldapUser.username,
            name: ldapUser.name || ldapUser.username,
            email: ldapUser.email || null,
            auth_provider: 'ldap',
            role: ldapUser.role,
            groups: ldapUser.groups
          };
          const sid = sessionStore.create(ldapUser.id, userInfo, {}, null, authConfig.session.maxAge);

          res.cookie(authConfig.session.name, sid, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: authConfig.session.maxAge
          });

          return res.redirect(safeReturnTo(req.body?.returnTo));
        })
        .catch((err) => {
          console.error('[LDAP] Login error:', err);
          return fail('ldapLoginError');
        });
    }

    const user = localUsers.authenticate(username, password);

    if (!user) {
      return fail('invalidCredentials');
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

function setup(config, database) {
  const authConfig = config.auth;

  if (authConfig.type === 'local') {
    return setupLocalRoutes(authConfig, database);
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
