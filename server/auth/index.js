/**
 * OIDC Authentication Module (openid-client v6.x)
 *
 * Provides optional OpenID Connect authentication with:
 * - Authorization code flow
 * - Session management in SQLite
 * - Back-channel logout support
 */
const oidcClient = require('./oidc-client');
const sessionStore = require('./session-store');
const localUsers = require('./local-users');
const routes = require('./routes');
const { createAuthMiddleware } = require('./middleware');

/**
 * Build auth configuration from environment variables and config file
 */
function buildAuthConfig(fileConfig) {
  const authFileConfig = fileConfig?.auth || {};
  const oidcEnvEnabled = process.env.OIDC_ENABLED === 'true';
  const localEnvEnabled = process.env.LOCAL_AUTH_ENABLED === 'true';
  const fileEnabled = authFileConfig.enabled === true;

  if (!oidcEnvEnabled && !localEnvEnabled && !fileEnabled) {
    return { enabled: false };
  }

  const type = process.env.AUTH_TYPE ||
    (oidcEnvEnabled ? 'oidc' : null) ||
    (localEnvEnabled ? 'local' : null) ||
    authFileConfig.type ||
    (authFileConfig.provider?.issuer ? 'oidc' : 'local');

  const session = {
    secret: process.env.SESSION_SECRET || authFileConfig.session?.secret,
    maxAge: authFileConfig.session?.maxAge || 86400000, // 24h
    name: authFileConfig.session?.name || 'ocm.sid'
  };

  if (type === 'local') {
    const envUsername = process.env.LOCAL_AUTH_USERNAME;
    const envPassword = process.env.LOCAL_AUTH_PASSWORD;
    const configuredUsers = Array.isArray(authFileConfig.users) ? authFileConfig.users : [];
    const users = envUsername || envPassword
      ? [{
        username: envUsername || 'admin',
        password: envPassword || 'admin',
        name: envUsername || 'admin'
      }]
      : configuredUsers.length > 0
        ? configuredUsers
        : [{ username: 'admin', password: 'admin', name: 'Administrator' }];

    return {
      enabled: true,
      type: 'local',
      session,
      users
    };
  }

  return {
    enabled: true,
    type: 'oidc',
    provider: {
      issuer: process.env.OIDC_ISSUER || authFileConfig.provider?.issuer,
      clientId: process.env.OIDC_CLIENT_ID || authFileConfig.provider?.clientId,
      clientSecret: process.env.OIDC_CLIENT_SECRET || authFileConfig.provider?.clientSecret,
      scopes: (process.env.OIDC_SCOPES?.split(',') || authFileConfig.provider?.scopes || ['openid', 'profile', 'email'])
    },
    session,
    baseUrl: process.env.OIDC_BASE_URL || authFileConfig.baseUrl,
    backChannelLogout: authFileConfig.backChannelLogout !== false
  };
}

/**
 * Initialize OIDC authentication
 */
async function initialize(app, db, fileConfig) {
  const config = { auth: buildAuthConfig(fileConfig) };

  if (!config.auth.enabled) {
    console.log('Authentication disabled');
    return { config, initialized: false };
  }

  if (config.auth.type === 'local') {
    sessionStore.init(db);
    localUsers.init(db, config.auth.users);
    console.log('Local authentication enabled');
    console.log(`  Users: ${localUsers.list().map((u) => u.username).join(', ')}`);
    return { config, initialized: true };
  }

  // Validate required config
  const { provider, session, baseUrl } = config.auth;
  if (!provider.issuer || !provider.clientId || !provider.clientSecret) {
    console.error('OIDC: Missing required configuration (issuer, clientId, clientSecret)');
    config.auth.enabled = false;
    return { config, initialized: false };
  }

  if (!baseUrl) {
    console.error('OIDC: Missing baseUrl configuration');
    config.auth.enabled = false;
    return { config, initialized: false };
  }

  if (!session.secret) {
    console.error('OIDC: Missing session secret');
    config.auth.enabled = false;
    return { config, initialized: false };
  }

  try {
    // Initialize session store
    sessionStore.init(db);

    // Initialize OIDC client
    await oidcClient.initialize(config);

    console.log('OIDC authentication enabled');
    console.log(`  Issuer: ${provider.issuer}`);
    console.log(`  Client ID: ${provider.clientId}`);
    console.log(`  Base URL: ${baseUrl}`);

    return { config, initialized: true };
  } catch (err) {
    console.error('OIDC initialization failed:', err.message);
    config.auth.enabled = false;
    return { config, initialized: false };
  }
}

module.exports = {
  buildAuthConfig,
  initialize,
  createAuthMiddleware,
  setupRoutes: routes.setup,
  backChannelLogout: routes.backChannelLogout,
  sessionStore,
  localUsers
};
