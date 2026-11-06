const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\elixir\\.gemini\\antigravity\\brain\\3e9aa1d1-bc09-43cd-a180-9f8457e40a33';

async function verifyPackageMeta() {
  const port = 9340;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + process.env.TEMP + '\\ch_dbg_meta_ver_' + Date.now(),
    '--window-size=1300,900',
    'file:///c:/innovalq_tech/nov_82_project/packages.html'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const listRes = await new Promise(r => {
    http.get(`http://127.0.0.1:${port}/json`, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => r(JSON.parse(d)));
    });
  });
  const ws = new WebSocket((listRes.find(t => t.type === 'page') || listRes[0]).webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 100;
  const send = (m, p = {}) => new Promise(res => {
    const cur = ++id;
    const h = e => { const d = JSON.parse(e.data); if (d.id === cur) { ws.removeEventListener('message', h); res(d.result); } };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });
  await send('Page.enable');

  const evalCode = async (code) => {
    const res = await send('Runtime.evaluate', { expression: code, returnByValue: true });
    return res.result.value;
  };

  await evalCode(`
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelectorAll('.camp-container, .camp-animate, .camp-reveal').forEach(el => el.classList.add('camp-visible'));
  `);

  console.log('--- 1. DESKTOP VERIFICATION (1300x900) ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1300, height: 900, deviceScaleFactor: 2, mobile: false });
  await new Promise(r => setTimeout(r, 400));

  const desktopCards = await evalCode(`
    (() => {
      return Array.from(document.querySelectorAll('.package-item')).map((item, idx) => {
        const meta = item.querySelector('.camp-card-meta');
        const spans = Array.from(meta.querySelectorAll('span'));
        const span0 = spans[0].getBoundingClientRect();
        const span1 = spans[1].getBoundingClientRect();
        return {
          card: idx + 1,
          span0Text: spans[0].textContent.trim(),
          span0Height: span0.height,
          span1Text: spans[1].textContent.trim(),
          span1Height: span1.height,
          isOneLineEach: span0.height <= 24 && span1.height <= 24,
          isSameRow: Math.abs(span0.top - span1.top) < 2
        };
      });
    })()
  `);
  console.log('Desktop cards:', JSON.stringify(desktopCards, null, 2));

  // Screenshot Desktop Card 1 Meta (Light)
  const metaPos1300 = await evalCode(`
    (() => {
      const m = document.querySelector('.package-item .camp-card-body');
      const r = m.getBoundingClientRect();
      return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
    })()
  `);
  const snapDesktopLight = await send('Page.captureScreenshot', {
    clip: { x: metaPos1300.x, y: metaPos1300.y, width: metaPos1300.width, height: 260, scale: 2 },
    captureBeyondViewport: true
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'package_meta_desktop_light.png'), Buffer.from(snapDesktopLight.data, 'base64'));
  console.log('Saved package_meta_desktop_light.png');

  // Screenshot Desktop Card 1 Meta (Dark)
  await evalCode(`document.documentElement.setAttribute('data-theme', 'dark');`);
  await new Promise(r => setTimeout(r, 200));
  const snapDesktopDark = await send('Page.captureScreenshot', {
    clip: { x: metaPos1300.x, y: metaPos1300.y, width: metaPos1300.width, height: 260, scale: 2 },
    captureBeyondViewport: true
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'package_meta_desktop_dark.png'), Buffer.from(snapDesktopDark.data, 'base64'));
  console.log('Saved package_meta_desktop_dark.png');

  console.log('--- 2. MOBILE VERIFICATION (375x812) ---');
  await evalCode(`document.documentElement.setAttribute('data-theme', 'light');`);
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 400));

  const mobileCards = await evalCode(`
    (() => {
      return Array.from(document.querySelectorAll('.package-item')).map((item, idx) => {
        const meta = item.querySelector('.camp-card-meta');
        const spans = Array.from(meta.querySelectorAll('span'));
        const span0 = spans[0].getBoundingClientRect();
        const span1 = spans[1].getBoundingClientRect();
        return {
          card: idx + 1,
          span0Text: spans[0].textContent.trim(),
          span0Height: span0.height,
          span1Text: spans[1].textContent.trim(),
          span1Height: span1.height,
          isOneLineEach: span0.height <= 24 && span1.height <= 24,
          isSameRow: Math.abs(span0.top - span1.top) < 2
        };
      });
    })()
  `);
  console.log('Mobile cards (375px):', JSON.stringify(mobileCards, null, 2));

  // Screenshot Mobile Card 1 Meta (Light)
  const metaPos375 = await evalCode(`
    (() => {
      const m = document.querySelector('.package-item .camp-card-body');
      const r = m.getBoundingClientRect();
      return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
    })()
  `);
  const snapMobileLight = await send('Page.captureScreenshot', {
    clip: { x: metaPos375.x, y: metaPos375.y, width: metaPos375.width, height: 260, scale: 2 },
    captureBeyondViewport: true
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'package_meta_mobile_light.png'), Buffer.from(snapMobileLight.data, 'base64'));
  console.log('Saved package_meta_mobile_light.png');

  // Screenshot Mobile Card 1 Meta (Dark)
  await evalCode(`document.documentElement.setAttribute('data-theme', 'dark');`);
  await new Promise(r => setTimeout(r, 200));
  const snapMobileDark = await send('Page.captureScreenshot', {
    clip: { x: metaPos375.x, y: metaPos375.y, width: metaPos375.width, height: 260, scale: 2 },
    captureBeyondViewport: true
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'package_meta_mobile_dark.png'), Buffer.from(snapMobileDark.data, 'base64'));
  console.log('Saved package_meta_mobile_dark.png');

  console.log('--- 3. NARROW VIEWPORTS TEST (320px & 1024px) ---');
  for (const w of [320, 1024]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 800, deviceScaleFactor: 2, mobile: w < 992 });
    await new Promise(r => setTimeout(r, 250));
    const allOneLine = await evalCode(`
      (() => {
        return Array.from(document.querySelectorAll('.package-item .camp-card-meta')).every(meta => {
          const spans = Array.from(meta.querySelectorAll('span'));
          return spans.every(s => s.getBoundingClientRect().height <= 24);
        });
      })()
    `);
    console.log(`Viewport ${w}px allOneLine:`, allOneLine);
  }

  chrome.kill();
  console.log('Package meta verification completed successfully!');
}

verifyPackageMeta().catch(err => {
  console.error('Error during package meta verification:', err);
  process.exit(1);
});
