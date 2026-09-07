import puppeteer from 'puppeteer-core';
const OUT = process.argv[2];
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 950), TAG = process.argv[5] || 'd';
const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--enable-unsafe-swiftshader', '--hide-scrollbars'],
  defaultViewport: { width: W, height: H },
});
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
await p.goto('http://localhost:3100/', { waitUntil: 'networkidle2', timeout: 90000 });
await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
await new Promise(r => setTimeout(r, 2500));
for (const [name, id] of [['names', 'names'], ['range', 'range'], ['table', 'table']]) {
  const y = await p.evaluate(i => {
    const el = document.getElementById(i);
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  }, id);
  await p.evaluate(v => window.scrollTo(0, v), y + 260);
  await new Promise(r => setTimeout(r, 1400));
  await p.screenshot({ path: `${OUT}/${TAG}-${name}.png` });
}
console.log('ERRORS:', errs.join(' | ') || 'none');
await b.close();
