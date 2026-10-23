import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const nativeRequire = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function load(relativePath, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const code = ts.transpileModule(source, {
    fileName: relativePath,
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(code, {
    module: loadedModule, exports: loadedModule.exports,
    require: (id) => Object.hasOwn(dependencies, id) ? dependencies[id] : nativeRequire(id),
    URLSearchParams, ...globals,
  }, { filename: relativePath });
  return loadedModule.exports;
}

const { roleDraft, previewEffective, permissionChanges, eligibleParents } = load('lib\\permissions\\roleDraft.ts');
const { hasAccess, findAccessRuleForPath, getDefaultLandingRoute } = load('lib\\permissions\\navConfig.ts');
const { permissionAction, default: PermissionMatrix } = load('components\\permissions\\PermissionMatrix.tsx');
const plain = (value) => JSON.parse(JSON.stringify(value));
const role = (id, properties = {}) => ({
  id, name: id.toUpperCase(), displayName: id, isSuperRole: false, parentRoleId: null,
  permissions: [], inheritanceMode: 'NONE', selectedInheritedPermissions: [],
  inheritedPermissions: [], effectivePermissions: [], ...properties,
});

test('NONE grants nothing from parent; ALL uses only direct grants, never grandparent grants', () => {
  const parent = role('manager', { permissions: ['PURCHASE_EDIT'], inheritedPermissions: ['PRODUCT_VIEW'], effectivePermissions: ['PURCHASE_EDIT', 'PRODUCT_VIEW'] });
  const draft = roleDraft(role('executive', { parentRoleId: 'manager', permissions: ['PURCHASE_VIEW'] }));
  assert.deepEqual(plain(previewEffective(draft, parent)), ['PURCHASE_VIEW']);
  draft.inheritanceMode = 'ALL';
  assert.deepEqual(plain(previewEffective(draft, parent)), ['PURCHASE_EDIT', 'PURCHASE_VIEW']);
  assert.deepEqual(plain(previewEffective(draft, { ...parent, isSuperRole: true })), ['PURCHASE_VIEW']);
});

test('SELECTED intersects parent direct grants and deduplicates direct/inherited overlap', () => {
  const parent = role('manager', { permissions: ['PURCHASE_VIEW', 'PRODUCT_VIEW'] });
  const draft = roleDraft(role('executive', {
    inheritanceMode: 'SELECTED', permissions: ['PURCHASE_VIEW'],
    selectedInheritedPermissions: ['PURCHASE_VIEW', 'PRODUCT_VIEW', 'DASHBOARD_VIEW'],
  }));
  assert.deepEqual(plain(previewEffective(draft, parent)), ['PRODUCT_VIEW', 'PURCHASE_VIEW']);
  assert.deepEqual(plain(previewEffective(draft, null)), ['PURCHASE_VIEW']);
});

test('full draft includes null parent and empty lists outside SELECTED', () => {
  const draft = roleDraft(role('empty', { selectedInheritedPermissions: ['OLD_CODE'] }));
  assert.deepEqual(plain(draft), { parentRoleId: null, inheritanceMode: 'NONE', permissions: [], selectedInheritedPermissions: [] });
});

test('confirmation reports effective additions/removals, not direct/inherited provenance changes', () => {
  assert.deepEqual(plain(permissionChanges(['PURCHASE_VIEW', 'PRODUCT_VIEW'], ['PURCHASE_VIEW', 'PURCHASE_EDIT'])),
    { added: ['PURCHASE_EDIT'], removed: ['PRODUCT_VIEW'] });
  assert.deepEqual(plain(permissionChanges(['PURCHASE_VIEW'], ['PURCHASE_VIEW'])), { added: [], removed: [] });
});

test('parent candidates exclude self, super roles, descendants and cycles', () => {
  const roles = [role('self'), role('admin', { isSuperRole: true }), role('manager'),
    role('child', { parentRoleId: 'self' }), role('grandchild', { parentRoleId: 'child' }),
    role('cycleA', { parentRoleId: 'cycleB' }), role('cycleB', { parentRoleId: 'cycleA' })];
  assert.deepEqual(plain(eligibleParents(roles, 'self').map((item) => item.id)), ['manager']);
});

test('parent dropdown follows configured role hierarchy', () => {
  const roles = [
    role('admin', { name: 'ADMIN', isSuperRole: true }),
    role('pur_man', { name: 'PURCHASE_MANAGER' }), role('pur_exe', { name: 'PURCHASE_EXECUTIVE' }),
    role('sal_man', { name: 'SALES_MANAGER' }), role('sal_exe', { name: 'SALES_EXECUTIVE' }),
  ];
  const ids = (id) => plain(eligibleParents(roles, id).map((item) => item.id));
  assert.deepEqual(ids('pur_man'), ['admin']);
  assert.deepEqual(ids('sal_man'), ['admin']);
  assert.deepEqual(ids('pur_exe'), ['pur_man']);
  assert.deepEqual(ids('sal_exe'), ['sal_man']);
});

test('management route is gated by exact ROLE_MANAGEMENT, not by role name', () => {
  const access = findAccessRuleForPath('/admin/permissions');
  assert.equal(hasAccess(access, { modules: {}, permissions: [], role: 'ADMIN' }), false);
  const ctx = { modules: {}, permissions: ['ROLE_MANAGEMENT'], role: 'EXECUTIVE' };
  assert.equal(hasAccess(access, ctx), true);
  assert.equal(getDefaultLandingRoute(ctx), '/admin/permissions');
});

test('permission action labels recognize standard actions and identify Other permissions', () => {
  for (const action of ['VIEW', 'CREATE', 'EDIT', 'APPROVE']) {
    assert.equal(permissionAction({ permissionCode: `PURCHASE_${action}`, module: 'PURCHASES' }), action);
  }
  for (const [permissionCode, module] of [['USER_MANAGEMENT', 'ADMIN'], ['STOCK_STATS_VIEW', 'STOCK'], ['DASHBOARD_VIEW', 'DASHBOARD']]) {
    assert.equal(permissionAction({ permissionCode, module }), null);
  }
});

test('permission matrix uses modules as rows and actions as columns, with Other listed separately', () => {
  const permissions = [
    { id: 'not-the-code', permissionCode: 'PURCHASE_VIEW', displayName: 'View purchases', module: 'PURCHASES' },
    { id: 'second', permissionCode: 'ORDER_VIEW', displayName: 'View orders', module: 'PURCHASES' },
    { id: 'other', permissionCode: 'CUSTOM_ACCESS', displayName: 'Custom access', module: 'CUSTOM' },
  ];
  const markup = renderToStaticMarkup(React.createElement(PermissionMatrix, {
    permissions, effectivePermissions: ['CUSTOM_ACCESS'],
    renderPermission: (permission) => React.createElement('input', {
      type: 'checkbox', 'aria-label': permission.displayName,
      defaultChecked: permission.permissionCode === 'CUSTOM_ACCESS',
    }),
  }));
  for (const permission of permissions) assert.ok(markup.includes(permission.permissionCode));
  assert.ok(markup.includes('PURCHASES'));
  assert.ok(markup.includes('CUSTOM'));
  assert.ok(markup.includes('Other'));
  assert.ok(markup.includes('Custom access'));
  assert.ok(markup.includes('View</th>'));
  assert.ok(markup.includes('Create</th>'));
  assert.ok(markup.includes('Edit</th>'));
  assert.ok(markup.includes('Approve</th>'));
  assert.ok(markup.includes('<th scope="row"><strong>PURCHASES</strong>'));
  assert.ok(markup.includes('Other permissions'));
  assert.ok(markup.includes('<table'));
  const table = markup.slice(markup.indexOf('<table'), markup.indexOf('</table>'));
  assert.ok(!table.includes('pm-permission-card'));
  assert.ok(!table.includes('<code>'));
  assert.ok(!table.includes('pm-module-count'));
  assert.equal((table.match(/type="checkbox"/g) ?? []).length, 2);
  assert.ok(table.includes('aria-label="View purchases"'));
  assert.ok(table.includes('aria-label="View orders"'));
  assert.ok(table.includes('pm-module-column'));
  const otherTable = markup.slice(markup.lastIndexOf('<table'), markup.lastIndexOf('</table>'));
  assert.ok(otherTable.includes('pm-other-matrix'));
  assert.ok(otherTable.includes('Custom access'));
  assert.ok(otherTable.includes('aria-label="Custom access"'));
  assert.ok(!markup.includes('pm-permission-card'));
  assert.ok(!markup.includes('not-the-code'));
});

function apiFixture() {
  const calls = [];
  const storage = new Map([['chemos_token', 'test-token'], ['chemos_user', '{}']]);
  const window = { location: { href: '' } };
  let response = { status: 200, ok: true, json: async () => ({}) };
  const api = load('lib\\apiClient.ts', {}, {
    process: { env: { NEXT_PUBLIC_BACKEND_URL: 'http://localhost:9999' } },
    window,
    localStorage: { getItem: (key) => storage.get(key) ?? null, removeItem: (key) => storage.delete(key) },
    fetch: async (url, config) => { calls.push({ url, ...config }); return response; },
  });
  const { permissionService } = load('lib\\services\\permissions.ts', { '@/lib/apiClient': api });
  return { api, permissionService, calls, storage, window, respond: (value) => { response = value; } };
}

test('service sends complete role replacement, bearer auth and encoded permission codes/usernames', async () => {
  const fixture = apiFixture();
  const draft = { parentRoleId: null, inheritanceMode: 'NONE', permissions: ['PURCHASE_VIEW'], selectedInheritedPermissions: [] };
  await fixture.permissionService.updateRole('role/id', draft);
  await fixture.permissionService.setOverride('daisy+one/name', 'CUSTOM/CODE', 'DENY', 'Coverage ended');
  const [update, override] = fixture.calls;
  assert.equal(update.method, 'PUT');
  assert.equal(update.url, 'http://localhost:9999/api/v1/auth/roles/role%2Fid/permissions');
  assert.deepEqual(JSON.parse(update.body), draft);
  assert.equal(update.headers.Authorization, 'Bearer test-token');
  assert.equal(override.url, 'http://localhost:9999/api/v1/auth/users/daisy%2Bone%2Fname/permission-overrides/CUSTOM%2FCODE');
  assert.deepEqual(JSON.parse(override.body), { effect: 'DENY', reason: 'Coverage ended' });
});

test('default override deletion accepts 204 without JSON parsing', async () => {
  const fixture = apiFixture();
  fixture.respond({ status: 204, ok: true, json: () => { throw new Error('must not parse'); } });
  assert.equal(await fixture.permissionService.removeOverride('daisy', 'PURCHASE_EDIT'), undefined);
  assert.equal(fixture.calls[0].method, 'DELETE');
});

test('Spring validation messages and 403 status are preserved without logging out', async () => {
  const fixture = apiFixture();
  fixture.respond({ status: 400, ok: false, json: async () => ({ message: 'Inheritance requires a non-super parent role' }) });
  await assert.rejects(fixture.permissionService.updateRole('executive', {}), { status: 400, message: 'Inheritance requires a non-super parent role' });
  fixture.respond({ status: 403, ok: false, json: async () => ({ message: 'Forbidden' }) });
  await assert.rejects(fixture.permissionService.listRoles(), { status: 403 });
  assert.equal(fixture.window.location.href, '');
  assert.equal(fixture.storage.has('chemos_token'), true);
});

test('401 from management endpoints clears session and redirects to login', async () => {
  const fixture = apiFixture();
  fixture.respond({ status: 401, ok: false, json: async () => ({}) });
  await assert.rejects(fixture.permissionService.getUser('daisy'), { status: 401 });
  assert.equal(fixture.window.location.href, '/login');
  assert.equal(fixture.storage.size, 0);
});
