const { roleFromGroups } = require('../server/auth/ldap-client');

describe('LDAP group authorization', () => {
  test('assigns admin role when user is member of the configured admin group', () => {
    expect(roleFromGroups({ adminGroup: 'FinOps-Admins', operatorGroup: 'FinOps-Operators' }, ['FinOps-Admins'])).toBe('admin');
  });

  test('assigns operator role when user is member of the configured operator group', () => {
    expect(roleFromGroups({ adminGroup: 'FinOps-Admins', operatorGroup: 'FinOps-Operators' }, ['FinOps-Operators'])).toBe('operator');
  });

  test('rejects user when access groups are configured and no group matches', () => {
    expect(roleFromGroups({ adminGroup: 'FinOps-Admins', operatorGroup: 'FinOps-Operators' }, ['Other-Group'])).toBeNull();
  });

  test('keeps viewer fallback when no access group is configured', () => {
    expect(roleFromGroups({ adminGroup: '', operatorGroup: '' }, ['Other-Group'])).toBe('viewer');
  });

  test('matches configured DN against memberOf CN', () => {
    const config = {
      adminGroup: 'CN=FinOps-Admins,OU=Groups,DC=example,DC=com',
      operatorGroup: ''
    };

    expect(roleFromGroups(config, ['FinOps-Admins'])).toBe('admin');
  });
});
