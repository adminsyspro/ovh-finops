const ldap = require('ldapjs');

function escapeFilterValue(value) {
  return String(value)
    .replaceAll('\\', '\\5c')
    .replaceAll('*', '\\2a')
    .replaceAll('(', '\\28')
    .replaceAll(')', '\\29')
    .replaceAll('\u0000', '\\00');
}

function createClient(config) {
  return ldap.createClient({
    url: config.url,
    connectTimeout: 5000,
    timeout: 10000,
    tlsOptions: {
      rejectUnauthorized: config.tlsRejectUnauthorized !== false
    }
  });
}

function bind(client, dn, password) {
  return new Promise((resolve, reject) => {
    client.bind(dn, password, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function unbind(client) {
  try {
    client.unbind(() => {});
  } catch {
    // Ignore cleanup failures.
  }
}

function readAttribute(attrs, name) {
  const attr = attrs.find((item) => item.type?.toLowerCase() === name.toLowerCase());
  return attr?.values?.[0] || '';
}

function readAttributeArray(attrs, name) {
  const attr = attrs.find((item) => item.type?.toLowerCase() === name.toLowerCase());
  return attr?.values || [];
}

function normalizeEntry(entry) {
  if (entry.pojo) {
    const pojo = entry.pojo;
    return {
      dn: pojo.objectName || entry.dn?.toString(),
      attributes: (pojo.attributes || []).map((attr) => ({
        type: attr.type,
        values: attr.values || []
      }))
    };
  }

  return {
    dn: entry.dn?.toString(),
    attributes: (entry.attributes || []).map((attr) => ({
      type: attr.type,
      values: attr.values || []
    }))
  };
}

function search(client, baseDN, filter) {
  return new Promise((resolve, reject) => {
    const results = [];
    client.search(baseDN, {
      filter,
      scope: 'sub',
      attributes: ['uid', 'sAMAccountName', 'cn', 'displayName', 'givenName', 'sn', 'mail', 'memberOf']
    }, (err, res) => {
      if (err) return reject(err);

      res.on('searchEntry', (entry) => {
        const normalized = normalizeEntry(entry);
        if (normalized.dn) results.push(normalized);
      });
      res.on('error', reject);
      res.on('end', () => resolve(results));
    });
  });
}

function extractGroups(attrs) {
  return readAttributeArray(attrs, 'memberOf').map((dn) => {
    const match = String(dn).match(/^cn=([^,]+)/i);
    return match ? match[1] : String(dn);
  });
}

function normalizeGroupValue(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const match = text.match(/(?:^|,)cn=([^,]+)/i);
  return (match ? match[1] : text).toLowerCase();
}

function roleFromGroups(config, groups) {
  const adminGroup = normalizeGroupValue(config.adminGroup);
  const operatorGroup = normalizeGroupValue(config.operatorGroup);
  const normalizedGroups = groups.map(normalizeGroupValue);

  if (adminGroup && normalizedGroups.includes(adminGroup)) return 'admin';
  if (operatorGroup && normalizedGroups.includes(operatorGroup)) return 'operator';
  if (adminGroup || operatorGroup) return null;
  return 'viewer';
}

class LdapUnauthorizedGroupError extends Error {
  constructor() {
    super('LDAP user is not member of an authorized group');
    this.code = 'LDAP_GROUP_NOT_ALLOWED';
  }
}

async function authenticate(config, username, password) {
  if (!config.enabled || !config.url || !config.baseDN || !username || !password) {
    return null;
  }

  const serviceClient = createClient(config);

  try {
    if (config.bindDN && config.bindPassword) {
      await bind(serviceClient, config.bindDN, config.bindPassword);
    }

    const safeUsername = escapeFilterValue(username);
    const filter = (config.userFilter || '(uid={{username}})').replace(/\{\{username\}\}/g, safeUsername);
    const entries = await search(serviceClient, config.baseDN, filter);
    const userEntry = entries[0];
    if (!userEntry?.dn) return null;

    const userClient = createClient(config);
    try {
      await bind(userClient, userEntry.dn, password);
    } finally {
      unbind(userClient);
    }

    const attrs = userEntry.attributes;
    const groups = extractGroups(attrs);
    const role = roleFromGroups(config, groups);
    if (!role) {
      throw new LdapUnauthorizedGroupError();
    }

    const uid = readAttribute(attrs, 'uid') || readAttribute(attrs, 'sAMAccountName') || username;
    const displayName = readAttribute(attrs, 'displayName') ||
      readAttribute(attrs, 'cn') ||
      [readAttribute(attrs, 'givenName'), readAttribute(attrs, 'sn')].filter(Boolean).join(' ') ||
      uid;

    return {
      id: `ldap:${uid}`,
      username: uid,
      name: displayName,
      email: readAttribute(attrs, 'mail') || null,
      role,
      groups,
      dn: userEntry.dn
    };
  } catch (err) {
    if (err.code === 'LDAP_GROUP_NOT_ALLOWED') {
      throw err;
    }
    console.warn('[LDAP] Authentication failed:', err.message);
    return null;
  } finally {
    unbind(serviceClient);
  }
}

module.exports = {
  authenticate,
  roleFromGroups
};
