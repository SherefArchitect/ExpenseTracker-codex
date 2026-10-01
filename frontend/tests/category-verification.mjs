import assert from 'node:assert/strict';
import { categoryNamesSchema, trimName } from '../src/features/categories/validation.ts';
import { categoryApi } from '../src/features/categories/api.ts';
import { CategoryApiError } from '../src/features/categories/types.ts';
import { messages } from '../src/i18n/messages.ts';
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
check(trimName('\u0085 Food\u3000') === 'Food', 'Shared Unicode trim policy');
check(trimName('\uFEFFFood\uFEFF') === '\uFEFFFood\uFEFF', 'BOM remains significant');
check(!categoryNamesSchema.safeParse({ nameEn: ' \t', nameAr: 'طعام' }).success, 'Blank English');
check(!categoryNamesSchema.safeParse({ nameEn: 'Food', nameAr: '\u0085' }).success, 'Blank Arabic');
check(categoryNamesSchema.safeParse({ nameEn: 'x'.repeat(100), nameAr: 'ع'.repeat(100) }).success, '100 code units');
check(!categoryNamesSchema.safeParse({ nameEn: 'x'.repeat(101), nameAr: 'طعام' }).success, '101 code units');
check(categoryNamesSchema.safeParse({ nameEn: '😀'.repeat(50), nameAr: 'طعام' }).success, 'UTF-16 boundary');
check(!categoryNamesSchema.safeParse({ nameEn: '😀'.repeat(51), nameAr: 'طعام' }).success, 'Surrogate code units');
assert.deepEqual(Object.keys(messages.en).sort(), Object.keys(messages.ar).sort()); checks++;
check(Object.values(messages.ar).every(text => text.length > 0), 'Arabic messages complete');
const originalFetch = globalThis.fetch;
try {
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return new Response('[]', { status: 200 });
  };
  await categoryApi.list('طعام%_', 'active');
  const query = new URL(captured.url, 'http://localhost').searchParams;
  check(query.get('search') === 'طعام%_' && query.get('isActive') === 'true', 'Search encoded and active filter');
  globalThis.fetch = async () => new Response(JSON.stringify({ code: 'request.invalid' }), { status: 404 });
  await assert.rejects(categoryApi.list('', 'all'), error => error instanceof CategoryApiError && error.code === 'category.unavailable'); checks++;
  await assert.rejects(categoryApi.rename(999, { nameEn: 'Food', nameAr: 'طعام' }), error => error.code === 'request.invalid'); checks++;
  globalThis.fetch = async () => new Response(JSON.stringify({ code: 'category.conflict', errors: { nameEn: ['category.name.duplicate'] } }), { status: 409 });
  await assert.rejects(categoryApi.create({ nameEn: 'Food', nameAr: 'طعام' }), error => error.code === 'category.conflict' && error.fields.nameEn[0] === 'category.name.duplicate'); checks++;
  globalThis.fetch = async () => { throw new TypeError('Connection failed'); };
  await assert.rejects(categoryApi.list('', 'all'), error => error.code === 'network.error'); checks++;
  globalThis.fetch = async () => { throw new DOMException('Aborted', 'AbortError'); };
  await assert.rejects(categoryApi.list('', 'all'), error => error.name === 'AbortError'); checks++;
} finally { globalThis.fetch = originalFetch; }
console.log('PASS: ' + checks + ' frontend validation, localization, and API-client assertions.');
