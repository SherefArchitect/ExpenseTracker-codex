// Dependency-free Chromium/CDP verification. Category requests are mocked by default.
// --live uses normal UI/API writes and requires prior manual schema application confirmation.
// Requires a running frontend and an installed Chrome/Edge. No direct database access.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const browserPath = process.env.CATEGORY_BROWSER ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifacts = new URL('../.npm-cache/category-browser/', import.meta.url);
await mkdir(artifacts, { recursive: true });
const browser = spawn(browserPath, [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9337',
  '--user-data-dir=' + fileURLToPath(new URL('profile/', artifacts)), 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
browser.on('error', error => console.error(error.message));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
let nextId = 0;
let checks = 0;
const pending = new Map();
const items = [];
let failSave = true, failList = false;
const errors = [];
const live = process.argv.includes('--live');
const liveToken = 'VERIFY-UI-' + Date.now().toString(36);
async function send(method, params = {}) {
  const id = ++nextId;
  const promise = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  socket.send(JSON.stringify({ id, method, params }));
  return promise;
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function until(expression, label) {
  for (let i = 0; i < 80; i++) {
    if (await evaluate('Boolean(' + expression + ')')) { checks++; return; }
    await pause(100);
  }
  throw Error('Timed out: ' + label);
}
async function click(text) {
  await until(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()===${JSON.stringify(text)} && !b.disabled)`, 'button ' + text);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)} && !b.disabled).click()`);
}
async function input(id, value) {
  await evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
}
async function select(selector, value) {
  await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
}
async function screenshot(name) {
  await pause(500); // Wait for layout, drawer, and dialog transitions before visual checks.
  const geometry = await evaluate("({viewport:innerWidth,root:document.getElementById('root').getBoundingClientRect().width,wrapper:document.querySelector('.wrapper').getBoundingClientRect().width,padding:getComputedStyle(document.querySelector('.wrapper')).paddingInlineStart,scroll:document.documentElement.scrollWidth,card:document.querySelector('[data-slot=card]').getBoundingClientRect().right,dir:getComputedStyle(document.querySelector('.wrapper')).direction})");
  await writeFile(new URL(name + '-layout.json', artifacts), JSON.stringify(geometry, null, 2));
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(new URL(name + '.png', artifacts), Buffer.from(result.data, 'base64'));
}
async function mock(params) {
  const url = new URL(params.request.url);
  const method = params.request.method;
  const data = params.request.postData ? JSON.parse(params.request.postData) : {};
  let body, status = 200;
  if (method === 'GET') {
    if (failList) { failList = false; status = 500; body = { code: 'server.error' }; }
    else {
      const search = (url.searchParams.get('search') ?? '').toLowerCase();
      const active = url.searchParams.get('isActive');
      body = items.filter(item => (!search || item.nameEn.toLowerCase().includes(search) || item.nameAr.includes(search))
        && (active === null || item.isActive === (active === 'true')));
    }
  } else if (method === 'POST' || method === 'PUT') {
    if (failSave) { failSave = false; status = 409; body = { code: 'category.conflict', errors: { nameEn: ['category.name.duplicate'] } }; }
    else {
      const id = method === 'POST' ? items.length + 1 : Number(url.pathname.split('/').at(-1));
      const current = items.find(item => item.id === id);
      body = { id, nameEn: data.nameEn, nameAr: data.nameAr, isActive: current?.isActive ?? true };
      if (current) Object.assign(current, body); else items.push(body);
      status = method === 'POST' ? 201 : 200;
      failList = true; // Simulate a successful write followed by a failed refresh.
    }
  } else if (method === 'PATCH') {
    const id = Number(url.pathname.split('/').at(-2));
    body = items.find(item => item.id === id);
    body.isActive = data.isActive;
  } else throw Error('Unexpected Category request: ' + method);
  await send('Fetch.fulfillRequest', { requestId: params.requestId, responseCode: status,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
    body: Buffer.from(JSON.stringify(body)).toString('base64') });
}
try {
  let target;
  for (let i = 0; i < 60; i++) {
    try { const targets = await (await fetch('http://127.0.0.1:9337/json')).json(); target = targets.find(t => t.type === 'page'); if (target) break; }
    catch {}
    await pause(100);
  }
  assert.ok(target, 'Browser debugging target');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = async event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const callback = pending.get(message.id); pending.delete(message.id);
      if (message.error) callback?.reject(Error(message.error.message)); else callback?.resolve(message.result);
    } else if (message.method === 'Fetch.requestPaused') {
      try { await mock(message.params); } catch (error) { errors.push(String(error)); }
    } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  if (!live) await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/categories*' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: process.argv[2] ?? 'http://127.0.0.1:5173/categories' });
  await evaluate("localStorage.removeItem('expense-tracker-locale')");
  await send('Page.reload');
  if (live) {
    await until("document.getElementById('category-search') && !document.body.innerText.includes('Loading categories')", 'live catalog load');
    await input('category-search', liveToken);
    await until("document.body.innerText.includes('No categories match')", 'live search empty');
    await click('Add category');
    await until("document.activeElement.id==='nameEn'", 'keyboard initial focus');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await until("document.activeElement.id==='nameAr'", 'keyboard tab to Arabic name');
    await input('nameEn', liveToken + '-Groceries');
    await input('nameAr', liveToken + '-بقالة');
    await click('Save category');
    await until("!document.querySelector('[role=dialog]') && document.querySelector('tbody')?.innerText.includes('Groceries')", 'live create via Vite proxy');
    await click('Edit');
    await input('nameEn', liveToken + '-Dining');
    await input('nameAr', liveToken + '-مطاعم');
    await click('Save category');
    await until("!document.querySelector('[role=dialog]') && document.querySelector('tbody')?.innerText.includes('Dining')", 'live edit');
    await click('Add category');
    await input('nameEn', liveToken + '-Dining');
    await input('nameAr', liveToken + '-مطاعم');
    await click('Save category');
    await until("document.body.innerText.includes('This name is already used')", 'live duplicate');
    assert.equal(await evaluate("document.getElementById('nameEn').value"), liveToken + '-Dining'); checks++;
    await click('Cancel');
    await click('Deactivate');
    await until("document.querySelector('tbody')?.innerText.includes('Inactive')", 'live deactivate');
    await select('#category-status', 'active');
    await until("document.body.innerText.includes('No categories match')", 'live active consumer filter');
    await select('#category-status', 'all');
    await until("document.querySelector('tbody')?.innerText.includes('Dining')", 'live restore filter');
    await screenshot('live-english');
    await select('select[aria-label="Language"]', 'ar');
    await until("document.documentElement.dir==='rtl' && document.body.innerText.includes('إدارة التصنيفات')", 'live Arabic');
    await click('تفعيل');
    await until("document.querySelector('tbody')?.innerText.includes('إلغاء التفعيل')", 'live reactivate');
    await click('إلغاء التفعيل');
    await until("document.querySelector('tbody')?.innerText.includes('غير نشط')", 'live retire UI test record');
    await screenshot('live-arabic');
    assert.deepEqual(errors, [], 'No live browser exceptions'); checks++;
    await writeFile(new URL('live-report.json', artifacts), JSON.stringify({ passed: true, checks, liveToken, errors }, null, 2));
    console.log('PASS: ' + checks + ' live UI/API checks through the Vite proxy; test category retired inactive.');
  } else {
  await until("document.body.innerText.includes('No categories yet.')", 'initial empty');
  await screenshot('english-empty');
  await click('Add category');
  await input('nameEn', 'Groceries');
  await input('nameAr', 'بقالة');
  await click('Save category');
  await until("document.body.innerText.includes('This name is already used')", 'field conflict');
  assert.equal(await evaluate("document.getElementById('nameEn').value"), 'Groceries'); checks++;
  assert.equal(await evaluate("document.getElementById('nameAr').value"), 'بقالة'); checks++;
  await click('Save category');
  await until("!document.querySelector('[role=dialog]') && document.body.innerText.includes('The change was saved, but')", 'write success and refresh failure');
  await click('Retry');
  await until("document.querySelector('tbody')?.innerText.includes('Groceries')", 'refresh after save');
  await click('Deactivate');
  await until("document.querySelector('tbody')?.innerText.includes('Inactive')", 'deactivate');
  await select('#category-status', 'active');
  await until("document.body.innerText.includes('No categories match')", 'status filter');
  await select('#category-status', 'all');
  await input('category-search', 'missing');
  await until("document.body.innerText.includes('No categories match')", 'search empty');
  await input('category-search', '');
  await until("document.querySelector('tbody')?.innerText.includes('Groceries')", 'clear search');
  await select('select[aria-label="Language"]', 'ar');
  await until("document.documentElement.dir==='rtl' && document.body.innerText.includes('إدارة التصنيفات')", 'Arabic locale and RTL');
  assert.equal(await evaluate("document.querySelector('td span[lang=en]').dir"), 'ltr'); checks++;
  assert.equal(await evaluate("document.querySelector('td span[lang=ar]').dir"), 'rtl'); checks++;
  await screenshot('arabic-desktop');
  await click('تعديل');
  await until("document.querySelector('[role=dialog]')?.innerText.includes('الاسم بالعربية')", 'Arabic dialog');
  await screenshot('arabic-dialog');
  await click('إلغاء');
  await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 850, deviceScaleFactor: 1, mobile: true });
  await until("document.querySelector('button[aria-label=\"فتح قائمة التنقل\"]')!==null", 'mobile navigation');
  await screenshot('arabic-mobile');
  await evaluate('document.querySelector(\'button[aria-label="فتح قائمة التنقل"]\').click()');
  await until("document.querySelector('[data-slot=sheet-content]') || document.querySelector('[role=dialog]')", 'mobile sheet');
  await pause(450);
  const box = await evaluate("(()=>{const r=document.querySelector('[role=dialog]').getBoundingClientRect();return {left:r.left,right:r.right}})()");
  assert.ok(box.left > 100 && box.right >= 399, 'Arabic mobile sheet opens from right'); checks++;
  await screenshot('arabic-mobile-menu');
  await click('إلغاء');
  await send('Page.reload');
  await until("document.documentElement.dir==='rtl' && document.body.innerText.includes('إدارة التصنيفات')", 'locale persists');
  assert.deepEqual(errors, [], 'No runtime or mock errors'); checks++;
  await writeFile(new URL('report.json', artifacts), JSON.stringify({ passed: true, checks, errors }, null, 2));
  console.log('PASS: ' + checks + ' mocked browser checks; English/Arabic, mobile RTL, failure retention, saved/refetch failure, filters.');
  }
} finally {
  try {
  if (live) {
    // Retire only this run's identifiable test records if a preceding assertion failed.
    const response = await fetch('http://localhost:5080/api/categories?search=' + encodeURIComponent(liveToken));
    if (response.ok) {
      for (const record of await response.json()) {
        if (!record.nameEn.startsWith(liveToken)) continue;
        const retired = await fetch('http://localhost:5080/api/categories/' + record.id + '/status', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: false }),
        });
        assert.equal(retired.status, 200, 'Live test record retirement');
      }
    }
  }
  } finally {
  socket?.close();
  browser.kill();
  }
}
