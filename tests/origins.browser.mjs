import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
await fs.mkdir('.tmp/origins', { recursive: true });
const baseUrl = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3000';
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--enable-webgl', '--enable-unsafe-swiftshader', '--no-first-run'] });
const pause = ms => new Promise(r => setTimeout(r, ms));
const results = [];
async function open(width, { reduced = false, locale = 'en', fail = false, debug = false } = {}) {
  const page = await browser.newPage();
  const errors = [], models = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if(m.type() === 'error') errors.push(m.text()); });
  page.on('request', r => { if(r.url().endsWith('.glb')) models.push(r.url()); });
  if (fail) { await page.setRequestInterception(true); page.on('request', r => r.url().endsWith('.glb') ? r.abort() : r.continue()); }
  await page.setViewport({ width, height: width > 900 ? 1000 : 844, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: width < 768 });
  if(reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(`${baseUrl}/${locale}/shop${debug ? '?debug=true' : ''}`, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.locator('#origins-title').scroll();
  if(!fail) await page.waitForSelector('button[aria-label="Najibe, Douma"]', { timeout: 60000 });
  return { page, errors, models };
}
try {
  const { page, errors, models } = await open(1440);
  const section = await page.$('section[aria-labelledby="origins-title"]');
  await section.screenshot({ path: '.tmp/origins/desktop.png' });
  assert.equal(models.length, 1);
  assert.match(models[0], /desktop/);
  for(const name of ['Georges, Ain el-Rihaneh', 'Fayez, Rashaya', 'Malvina, Deir Mimas', 'Em Ramiz, Aabra', 'Najibe, Douma']) {
    await page.locator(`button[aria-label="${name}"]`).click();
    await page.waitForFunction(name => document.querySelector('aside h3')?.textContent === name, {}, name.split(', ')[1]);
  }
  assert.equal(await page.$('aside a'), null, 'unlisted Najibe has no product link');
  const list = await page.$$('nav[aria-label="Explore the origins"] button');
  await list[2].focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('aside h3')?.textContent === 'Deir Mimas');
  await pause(1200);
  await section.screenshot({ path: '.tmp/origins/desktop-selected.png' });
  await page.locator('button::-p-text(Carafes)').click();
  assert.equal(await page.$('#malvina'), null);
  await page.locator('aside a[href="#malvina"]').click();
  await page.waitForFunction(() => document.activeElement?.id === 'malvina');
  await pause(1000);
  assert.ok(await page.$eval('#malvina', el => el.getBoundingClientRect().top >= 0 && el.getBoundingClientRect().top < window.innerHeight));
  await page.locator('aside a[href="#malvina"]').click();
  await page.waitForFunction(() => document.activeElement?.id === 'malvina');
  results.push({ desktop: 'five markers, keyboard, filtered/repeated catalogue jump passed', models, errors });
  assert.deepEqual(errors, []);
  await page.close();
  for (const width of [320, 360, 375, 390, 412, 430, 768, 1024]) {
    const { page, errors, models } = await open(width);
    assert.equal(models.length, 1, 'only one model requested');
    assert.match(models[0], width <= 768 ? /mobile/ : /desktop/);
    const marker = await page.$('button[aria-label="Malvina, Deir Mimas"]');
    if (width < 768) await marker.tap();
    else await marker.click();
    await page.waitForFunction(() => document.querySelector('aside h3')?.textContent === 'Deir Mimas');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal overflow');
    await pause(450);
    if ([320, 390, 1024].includes(width)) await (await page.$('section[aria-labelledby="origins-title"]')).screenshot({ path: `.tmp/origins/width-${width}.png` });
    results.push({ width, model: models[0].split('/').at(-1), errors });
    assert.deepEqual(errors, []);
    await page.close();
  }
  {
    const { page, errors } = await open(1440, { debug: true });
    const radius = () => page.$eval('pre', el => {
      const camera = el.textContent.match(/camera: (.*)/)[1].split(',').map(Number);
      const target = el.textContent.match(/target: (.*)/)[1].split(',').map(Number);
      return Math.hypot(...camera.map((n, i) => n - target[i]));
    });
    await page.locator('button[aria-label="Zoom in"]').click();
    await page.locator('button[aria-label="Zoom in"]').click();
    await pause(2500);
    const zoomed = await radius();
    await page.locator('button[aria-label="Malvina, Deir Mimas"]').click();
    await pause(2500);
    assert.ok(Math.abs(await radius() - zoomed) < 0.04, 'selection preserves zoom distance');
    assert.equal(await page.$eval('button[aria-label="Zoom in"]', el => el.disabled), true);
    await page.locator('button::-p-text(Full map)').click();
    await pause(1500);
    assert.equal(await page.$eval('button[aria-label="Zoom in"]', el => el.disabled), false);
    assert.ok(await radius() > zoomed + 1, 'reset restores full-country framing');
    const map = await page.$('[data-active]');
    await page.locator('#malvina').scroll();
    await page.mouse.wheel({deltaY:1500});
    await page.waitForFunction(() => document.querySelector('[data-active]')?.dataset.active === 'false');
    const paused = await page.$eval('pre', el => el.textContent);
    await pause(1400);
    assert.equal(await page.$eval('pre', el => el.textContent), paused, 'no rendered frames while map is offscreen');
    await map.dispose();
    results.push({ camera: 'zoom preserved on selection, reset and offscreen pause passed', errors });
    assert.deepEqual(errors, []);
    await page.close();
  }
  {
    const { page, errors } = await open(1440, { reduced: true, locale: 'fr', debug: true });
    await pause(1200);
    const before = await page.$eval('pre', e => e.textContent.match(/camera: (.*)/)?.[1]);
    await page.locator('button[aria-label="Malvina, Deir Mimas"]').click();
    await pause(1500);
    const after = await page.$eval('pre', e => e.textContent.match(/camera: (.*)/)?.[1]);
    assert.equal(before, after, 'reduced motion does not move camera on selection');
    assert.equal(await page.$eval('aside a[href="#malvina"]', e => e.textContent.includes('Voir l’huile')), true);
    assert.equal(await page.$eval('button[data-selected="true"] span', e => getComputedStyle(e).animationName), 'none');
    results.push({ reducedFrench: 'camera stays still, pulse disabled, translated action', errors });
    assert.deepEqual(errors, []);
    await page.close();
  }
  {
    const { page } = await open(390, { fail: true });
    await page.waitForFunction(() => document.querySelector('section[aria-labelledby="origins-title"]')?.textContent.includes('The 3D relief is unavailable'));
    const list = await page.$$('nav[aria-label="Explore the origins"] button');
    await list[2].click();
    await page.waitForFunction(() => document.querySelector('aside h3')?.textContent === 'Deir Mimas');
    await page.locator('aside a[href="#malvina"]').click();
    await page.waitForFunction(() => document.activeElement?.id === 'malvina');
    results.push({ failedGLB: 'HTML list, details and catalogue jump remain usable' });
    await page.close();
  }
  console.log(JSON.stringify(results, null, 2));
  await fs.writeFile('.tmp/origins/results.json', JSON.stringify(results, null, 2));
} finally { await browser.close(); }
