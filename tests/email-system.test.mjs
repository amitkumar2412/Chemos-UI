import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function load(relativePath) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const code = ts.transpileModule(source, {
    fileName: relativePath,
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require: () => ({}) }, { filename: relativePath });
  return loaded.exports;
}

const { buildRecipientPatch, parsePrice, renderPreview, statusCounts } = load('app\\admin\\email-system\\_lib\\logic.ts');
const plain = (value) => JSON.parse(JSON.stringify(value));
const prefill = { subjectLine: 'Offer', htmlBody: '<p>Hi</p>' };
const draft = (overrides = {}) => ({
  templateId: 7, overrideName: '', overridePrice: '', subjectLine: 'Offer', htmlBody: '<p>Hi</p>', ...overrides,
});

test('PATCH omits untouched subject/body and always carries the master template id', () => {
  assert.deepEqual(plain(buildRecipientPatch(draft({ overrideName: 'Priya' }), prefill).body), { templateId: 7, overrideName: 'Priya' });
});

test('PATCH includes only the edited text fields', () => {
  assert.deepEqual(plain(buildRecipientPatch(draft({ subjectLine: 'New' }), prefill).body), { templateId: 7, subjectLine: 'New' });
  assert.deepEqual(plain(buildRecipientPatch(draft({ htmlBody: '<p>Yo</p>' }), prefill).body), { templateId: 7, htmlBody: '<p>Yo</p>' });
});

test('PATCH never sends text when no template is chosen and rejects empty or invalid patches', () => {
  assert.ok(buildRecipientPatch(draft({ templateId: null, subjectLine: 'x' }), prefill).error);
  assert.ok(buildRecipientPatch(draft({ overridePrice: '1.234' }), prefill).error);
});

test('price validation mirrors backend limits', () => {
  assert.equal(parsePrice('12.5').value, 12.5);
  for (const bad of ['', '0', '-1', '1.234', '12345678901', 'abc']) assert.ok(parsePrice(bad).error, bad);
});

test('preview substitutes placeholders and status counts group rows', () => {
  assert.ok(!renderPreview('Hi {{customer_name}} {{price}}').includes('{{'));
  assert.deepEqual(plain(statusCounts([{ status: 'SENT' }, { status: 'SENT' }, { status: 'FAILED' }])), { SENT: 2, FAILED: 1 });
});
