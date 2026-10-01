// Uses normal application endpoints only. Run only after manual schema application confirmation.
// Leaves identifiable test categories inactive; never deletes records or changes database objects.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const base = process.argv[2] ?? 'http://localhost:5080';
const reportUrl = new URL('../.npm-cache/category-api-report.json', import.meta.url);
let checks = 0;
const created = [];
async function call(method, path, body) {
  const response = await fetch(base + '/api/categories' + path, {
    method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}
function check(value, label) { assert.ok(value, label); checks++; }
async function add(names) {
  const result = await call('POST', '', names);
  check(result.status === 201, 'Create: ' + JSON.stringify(result));
  created.push(result.data);
  return result.data;
}
if (process.argv.includes('--read-back')) {
  const report = JSON.parse(await readFile(reportUrl, 'utf8'));
  for (const expected of report.created) {
    const result = await call('GET', '/' + expected.id);
    check(result.status === 200 && result.data.nameEn === expected.nameEn && result.data.nameAr === expected.nameAr
      && result.data.isActive === false, 'Inactive record persists after restart: ' + expected.id);
  }
  console.log('PASS: ' + checks + ' records persisted after API restart.');
} else {
  const token = 'VERIFY-' + Date.now().toString(36);
  let failure;
  try {
    const initial = await call('GET', '');
    check(initial.status === 200 && Array.isArray(initial.data), 'List');
    console.log('Initial catalog count: ' + initial.data.length);
    const item = await add({ nameEn: '\u0085 ' + token + '-Food \u3000', nameAr: ' ' + token + '-طعام ' });
    check(item.isActive && item.nameEn === token + '-Food', 'Unicode trim and active default');
    check((await call('POST', '', { nameEn: item.nameEn.toLowerCase(), nameAr: token + '-آخر' })).status === 409, 'Case-insensitive English uniqueness');
    check((await call('POST', '', { nameEn: token + '-Other', nameAr: item.nameAr })).status === 409, 'Arabic uniqueness');
    for (const names of [{ nameEn: ' ', nameAr: 'طعام' }, { nameEn: token, nameAr: null },
      { nameEn: 'x'.repeat(101), nameAr: 'طعام' }, { nameEn: token, nameAr: 'ع'.repeat(101) }]) {
      check((await call('POST', '', names)).status === 400, 'Invalid names rejected');
    }
    check((await call('PATCH', '/' + item.id + '/status', {})).status === 400, 'Missing status rejected');
    check((await call('PATCH', '/' + item.id + '/status', { isActive: null })).status === 400, 'Null status rejected');
    check((await call('GET', '/abc')).status === 400, 'Malformed ID rejected');
    check((await call('GET', '/0')).status === 400, 'Nonpositive ID rejected');
    check((await call('GET', '/2147483647')).status === 404, 'Missing ID');
    check((await call('GET', '?isActive=maybe')).status === 400, 'Malformed filter rejected');
    check((await call('DELETE', '/' + item.id)).status === 405, 'No deletion endpoint');
    check((await call('PATCH', '/' + item.id + '/status', { isActive: false })).data.isActive === false, 'Deactivate');
    check((await call('POST', '', { nameEn: item.nameEn, nameAr: token + '-OtherAr' })).status === 409, 'Inactive duplicate rejected');
    const renamedNames = { nameEn: token + '-Dining', nameAr: token + '-مطاعم' };
    const renamed = await call('PUT', '/' + item.id, renamedNames);
    check(renamed.status === 200 && renamed.data.id === item.id && !renamed.data.isActive, 'Rename preserves ID and status');
    Object.assign(item, renamed.data);
    check((await call('PUT', '/' + item.id, renamedNames)).status === 200, 'Unchanged names exclude self');
    const active = await call('GET', '?isActive=true&search=' + encodeURIComponent(token));
    check(!active.data.some(c => c.id === item.id), 'Active-only excludes inactive');
    check((await call('PATCH', '/' + item.id + '/status', { isActive: true })).data.isActive, 'Reactivate');
    check((await call('PATCH', '/' + item.id + '/status', { isActive: true })).data.isActive, 'Idempotent activation');
    const literal = await add({ nameEn: token + '%_[]~', nameAr: token + '-رموز' });
    const literalList = await call('GET', '?search=' + encodeURIComponent('%_[]~'));
    check(literalList.status === 200 && literalList.data.some(c => c.id === literal.id)
      && literalList.data.every(c => c.nameEn.includes('%_[]~') || c.nameAr.includes('%_[]~')), 'LIKE metacharacters are literal');
    const arabicList = await call('GET', '?search=' + encodeURIComponent('مطاعم'));
    check(arabicList.data.some(c => c.id === item.id), 'Arabic search');
    const longName = token + 'x'.repeat(100 - token.length);
    await add({ nameEn: longName, nameAr: token + 'ع'.repeat(100 - token.length) });
    const raceNames = { nameEn: token + '-Race', nameAr: token + '-سباق' };
    const race = await Promise.all([call('POST', '', raceNames), call('POST', '', raceNames)]);
    for (const result of race) if (result.status === 201) created.push(result.data);
    check(race.filter(r => r.status === 201).length === 1 && race.filter(r => r.status === 409).length === 1, 'Concurrent duplicate protection');
    const variants = await add({ nameEn: token + '-Cafe', nameAr: token + '-أكل' });
    await add({ nameEn: token + '-Café', nameAr: token + '-اكل' });
    check(variants.id > 0, 'English accents and Arabic spelling variants remain distinct');
  } catch (error) { failure = error; }
  finally {
    for (const category of created) {
      const result = await call('PATCH', '/' + category.id + '/status', { isActive: false });
      check(result.status === 200 && result.data.isActive === false, 'Retire test record ' + category.id);
      Object.assign(category, result.data);
    }
    await mkdir(new URL('../.npm-cache/', import.meta.url), { recursive: true });
    await writeFile(reportUrl, JSON.stringify({ token, checks, created, passed: !failure }, null, 2));
  }
  if (failure) throw failure;
  console.log('PASS: ' + checks + ' API checks; ' + created.length + ' test categories retained inactive.');
}
