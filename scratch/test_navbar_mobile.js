const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\elixir\\.gemini\\antigravity\\brain\\3e9aa1d1-bc09-43cd-a180-9f8457e40a33';

async function testNavbarMobile() {
  const port = 9345;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + process.env.TEMP + '\\ch_dbg_nav_' + Date.now(),
    '--window-size=375,812',
    'file:///c:/innovalq_tech/nov_82_project/activities.html'
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

  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 600));

  const navInfo = await evalCode(`
    (() => {
      const logo = document.querySelector('.main-navbar .brand-logo');
      const logoSpan = logo.querySelector('span');
      const logoIcon = logo.querySelector('.brand-icon');
      const navActions = document.querySelector('.main-navbar .nav-actions');

      return {
        logoRect: { width: logo.getBoundingClientRect().width, height: logo.getBoundingClientRect().height },
        spanRect: { width: logoSpan.getBoundingClientRect().width, height: logoSpan.getBoundingClientRect().height },
        iconRect: { width: logoIcon.getBoundingClientRect().width, height: logoIcon.getBoundingClientRect().height },
        actionsRect: { width: navActions.getBoundingClientRect().width, height: navActions.getBoundingClientRect().height },
        spanText: logoSpan.textContent
      };
    })()
  `);
  console.log('Nav Info Before:', JSON.stringify(navInfo, null, 2));

  // Capture navbar screenshot before
  const snapBefore = await send('Page.captureScreenshot', {
    clip: { x: 0, y: 0, width: 375, height: 80, scale: 2 }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'navbar_mobile_before.png'), Buffer.from(snapBefore.data, 'base64'));
  console.log('Saved navbar_mobile_before.png');

  chrome.kill();
}

testNavbarMobile();
