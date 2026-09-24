import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-first-run'],
});
const baseUrl = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3000';
await fs.mkdir('.tmp/about', { recursive: true });

try {
  const page = await browser.newPage();
  const films = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let releaseFilm;
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('zurunyaboutvid.mp4') && !releaseFilm) {
      releaseFilm = () => request.continue();
    } else void request.continue();
  });
  page.on('request', request => {
    if (request.url().includes('zurunyaboutvid.mp4')) films.push(request.url());
  });
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/en/about`, { waitUntil: 'networkidle0' });
  assert.ok(await page.$('button[aria-label="Play the Zuruny story"]'), 'company film has an explicit play action');
  assert.equal(films.length, 0, 'company film does not download before play');
  await page.screenshot({ path: '.tmp/about/desktop.png' });
  await (await page.$('button[aria-label="Play the Zuruny story"]')).focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent.includes('Loading film'));
  await page.screenshot({ path: '.tmp/about/loading.png' });
  assert.match(await page.$eval('[role="status"]', element => element.textContent), /9.6 MB/);
  assert.ok(releaseFilm, 'request is pending while loading indicator is shown');
  await releaseFilm();
  await page.waitForFunction(() => {
    const video = document.querySelector('video[data-company-film]');
    return video && !video.paused && video.currentTime > 0;
  });
  assert.ok(films.length > 0, 'play starts the media request');
  assert.equal(await page.$eval('video[data-company-film]', video => video.controls && video.playsInline), true);
  assert.equal(await page.$eval('video[data-company-film]', video => video === document.activeElement), true, 'keyboard focus moves to player');
  assert.deepEqual(errors, []);
  await page.close();
  console.log('PASS: no eager company film request, keyboard play, loading state, focus, inline playback');

  for (const width of [320, 390, 768, 1024, 1440]) {
    const page = await browser.newPage();
    const requests = [];
    page.on('request', request => { if (request.url().endsWith('.mp4')) requests.push(request.url()); });
    await page.setViewport({ width, height: 900, isMobile: width < 768, hasTouch: width < 768 });
    await page.goto(`${baseUrl}/${width === 768 ? 'fr' : 'en'}/about`, { waitUntil: 'networkidle0' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no overflow at ${width}px`);
    assert.ok(!requests.some(url => url.includes('zurunyaboutvid')), 'resizing/scrolling does not load company film');
    const button = await page.$('figure button');
    assert.ok(await button.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      return bounds.width >= 44 && bounds.height >= 44;
    }), 'play target is touch accessible');
    if (width === 768) assert.match(await button.evaluate(element => element.textContent), /Voir notre histoire/);
    if ([320, 390, 768].includes(width)) await page.screenshot({ path: `.tmp/about/width-${width}.png`, fullPage: true });
    if (width === 1440) {
      await page.waitForFunction(() => !document.querySelector('[data-pottery-film]').paused);
      await page.locator('button[aria-label="Pause background"]').click();
      assert.ok(await page.$eval('[data-pottery-film]', video => video.paused));
      await page.locator('button[aria-label="Play background"]').click();
      await page.waitForFunction(() => !document.querySelector('[data-pottery-film]').paused);
      await page.locator('main section:nth-of-type(1) + div section').scroll();
      await page.screenshot({ path: '.tmp/about/stories.png' });
      await page.locator('footer').scroll();
      await page.waitForFunction(() => document.querySelector('[data-pottery-film]').paused);
    }
    await page.close();
  }
  console.log('PASS: 320/390/768/1024/1440px layouts, French copy, background pause/resume and offscreen pause');

  for (const preference of ['reduced-motion', 'save-data']) {
    const page = await browser.newPage();
    const requests = [];
    page.on('request', request => { if (request.url().endsWith('.mp4')) requests.push(request.url()); });
    if (preference === 'reduced-motion') {
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    } else {
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'connection', { value: Object.assign(new EventTarget(), { saveData: true }) });
      });
    }
    await page.goto(`${baseUrl}/en/about`, { waitUntil: 'networkidle0' });
    assert.deepEqual(requests, [], `${preference} does not download either film automatically`);
    assert.equal(await page.$eval('[data-pottery-film]', video => video.getAttribute('src')), null);
    await page.close();
  }
  console.log('PASS: reduced motion and Save-Data avoid automatic video downloads');

  {
    const page = await browser.newPage();
    let fail = true;
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (fail && request.url().includes('zurunyaboutvid')) void request.abort();
      else void request.continue();
    });
    await page.goto(`${baseUrl}/en/about`, { waitUntil: 'networkidle0' });
    await page.locator('button[aria-label="Play the Zuruny story"]').click();
    await page.waitForSelector('[role="alert"]');
    assert.match(await page.$eval('[role="alert"]', element => element.textContent), /connection/);
    fail = false;
    await page.locator('button[aria-label="Try again"]').click();
    await page.waitForFunction(() => document.querySelector('[data-company-film]').currentTime > 0);
    await page.close();
  }
  console.log('PASS: failed download shows a useful error and retry recovers playback');
} finally {
  await browser.close();
}
