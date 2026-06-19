const LDAP_PREFIX = 'auth.ldap.';
const SSO_PREFIX = 'auth.sso.';

const LDAP_DEFAULTS = {
  enabled: false,
  url: '',
  baseDN: '',
  bindDN: '',
  bindPassword: '',
  userFilter: '(uid={{username}})',
  adminGroup: '',
  operatorGroup: '',
  tlsRejectUnauthorized: true
};

const SSO_DEFAULTS = {
  enabled: false,
  protocol: 'oidc',
  providerName: 'SSO',
  appBaseUrl: '',
  showLocalLogin: true,
  forceSsoRedirect: false,
  autoProvision: true,
  defaultRole: 'viewer',
  oidcIssuerUrl: '',
  oidcClientId: '',
  oidcClientSecret: '',
  oidcScopes: 'openid profile email',
  oidcClaimEmail: 'email',
  oidcClaimName: 'name',
  oidcClaimGroups: 'groups',
  oidcAdminGroup: '',
  samlEntryPoint: '',
  samlIssuer: '',
  samlCertificate: '',
  samlCallbackUrl: '',
  samlLogoutUrl: '',
  samlNameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
};

function ensureTable(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function parseStoredValue(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function loadByPrefix(database, prefix, defaults) {
  ensureTable(database);
  const rows = database.prepare('SELECT key, value FROM app_settings WHERE key LIKE ?').all(`${prefix}%`);
  const settings = { ...defaults };

  for (const row of rows) {
    const field = row.key.slice(prefix.length);
    if (Object.prototype.hasOwnProperty.call(defaults, field)) {
      settings[field] = parseStoredValue(row.value, defaults[field]);
    }
  }

  return settings;
}

function saveByPrefix(database, prefix, settings) {
  ensureTable(database);
  const stmt = database.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
  `);

  const trx = database.transaction((entries) => {
    for (const [key, value] of entries) {
      stmt.run(`${prefix}${key}`, JSON.stringify(value));
    }
  });

  trx(Object.entries(settings));
}

function asString(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function asBoolean(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  return value === true || value === 'true' || value === 1 || value === '1';
}

function publicLdap(settings) {
  return {
    ...settings,
    bindPassword: '',
    hasBindPassword: Boolean(settings.bindPassword)
  };
}

function publicSso(settings) {
  return {
    ...settings,
    oidcClientSecret: '',
    hasOidcClientSecret: Boolean(settings.oidcClientSecret)
  };
}

function getLdap(database) {
  return publicLdap(loadByPrefix(database, LDAP_PREFIX, LDAP_DEFAULTS));
}

function getLdapPrivate(database) {
  return loadByPrefix(database, LDAP_PREFIX, LDAP_DEFAULTS);
}

function updateLdap(database, payload = {}) {
  const current = loadByPrefix(database, LDAP_PREFIX, LDAP_DEFAULTS);
  const next = {
    enabled: asBoolean(payload.enabled, current.enabled),
    url: asString(payload.url, current.url),
    baseDN: asString(payload.baseDN, current.baseDN),
    bindDN: asString(payload.bindDN, current.bindDN),
    bindPassword: payload.bindPassword ? String(payload.bindPassword) : current.bindPassword,
    userFilter: asString(payload.userFilter, current.userFilter) || LDAP_DEFAULTS.userFilter,
    adminGroup: asString(payload.adminGroup, current.adminGroup),
    operatorGroup: asString(payload.operatorGroup, current.operatorGroup),
    tlsRejectUnauthorized: asBoolean(payload.tlsRejectUnauthorized, current.tlsRejectUnauthorized)
  };

  if (payload.clearBindPassword === true) {
    next.bindPassword = '';
  }

  if (next.enabled && (!next.url || !next.baseDN)) {
    throw new Error('LDAP URL and base DN are required when LDAP is enabled');
  }

  saveByPrefix(database, LDAP_PREFIX, next);
  return publicLdap(next);
}

function getSso(database) {
  return publicSso(loadByPrefix(database, SSO_PREFIX, SSO_DEFAULTS));
}

function getSsoPrivate(database) {
  return loadByPrefix(database, SSO_PREFIX, SSO_DEFAULTS);
}

function updateSso(database, payload = {}) {
  const current = loadByPrefix(database, SSO_PREFIX, SSO_DEFAULTS);
  const protocol = asString(payload.protocol, current.protocol).toLowerCase();
  const next = {
    enabled: asBoolean(payload.enabled, current.enabled),
    protocol: protocol === 'saml' ? 'saml' : 'oidc',
    providerName: asString(payload.providerName, current.providerName) || SSO_DEFAULTS.providerName,
    appBaseUrl: asString(payload.appBaseUrl, current.appBaseUrl),
    showLocalLogin: asBoolean(payload.showLocalLogin, current.showLocalLogin),
    forceSsoRedirect: asBoolean(payload.forceSsoRedirect, current.forceSsoRedirect),
    autoProvision: asBoolean(payload.autoProvision, current.autoProvision),
    defaultRole: asString(payload.defaultRole, current.defaultRole) || SSO_DEFAULTS.defaultRole,
    oidcIssuerUrl: asString(payload.oidcIssuerUrl, current.oidcIssuerUrl),
    oidcClientId: asString(payload.oidcClientId, current.oidcClientId),
    oidcClientSecret: payload.oidcClientSecret ? String(payload.oidcClientSecret) : current.oidcClientSecret,
    oidcScopes: asString(payload.oidcScopes, current.oidcScopes) || SSO_DEFAULTS.oidcScopes,
    oidcClaimEmail: asString(payload.oidcClaimEmail, current.oidcClaimEmail) || SSO_DEFAULTS.oidcClaimEmail,
    oidcClaimName: asString(payload.oidcClaimName, current.oidcClaimName) || SSO_DEFAULTS.oidcClaimName,
    oidcClaimGroups: asString(payload.oidcClaimGroups, current.oidcClaimGroups) || SSO_DEFAULTS.oidcClaimGroups,
    oidcAdminGroup: asString(payload.oidcAdminGroup, current.oidcAdminGroup),
    samlEntryPoint: asString(payload.samlEntryPoint, current.samlEntryPoint),
    samlIssuer: asString(payload.samlIssuer, current.samlIssuer),
    samlCertificate: asString(payload.samlCertificate, current.samlCertificate),
    samlCallbackUrl: asString(payload.samlCallbackUrl, current.samlCallbackUrl),
    samlLogoutUrl: asString(payload.samlLogoutUrl, current.samlLogoutUrl),
    samlNameIdFormat: asString(payload.samlNameIdFormat, current.samlNameIdFormat) || SSO_DEFAULTS.samlNameIdFormat
  };

  if (payload.clearOidcClientSecret === true) {
    next.oidcClientSecret = '';
  }

  if (next.enabled && next.protocol === 'oidc' && (!next.oidcIssuerUrl || !next.oidcClientId)) {
    throw new Error('OIDC issuer URL and client ID are required when OIDC is enabled');
  }

  if (next.enabled && next.protocol === 'saml' && (!next.samlEntryPoint || !next.samlIssuer || !next.samlCertificate)) {
    throw new Error('SAML entry point, issuer and certificate are required when SAML is enabled');
  }

  saveByPrefix(database, SSO_PREFIX, next);
  return publicSso(next);
}

module.exports = {
  getLdap,
  getLdapPrivate,
  updateLdap,
  getSso,
  getSsoPrivate,
  updateSso
};
