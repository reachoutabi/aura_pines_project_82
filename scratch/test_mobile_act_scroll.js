const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\elixir\\.gemini\\antigravity\\brain\\3e9aa1d1-bc09-43cd-a180-9f8457e40a33';

async function testMobileActivities() {
  const port = 9342;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + process.env.TEMP + '\\ch_dbg_act_scroll_' + Date.now(),
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
  await new Promise(r => setTimeout(r, 1000));

  // Take screenshot at scroll = 0
  const snap0 = await send('Page.captureScreenshot', {});
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'act_mobile_scroll0.png'), Buffer.from(snap0.data, 'base64'));

  // Scroll 500px
  await evalCode(`window.scrollTo(0, 500);`);
  await new Promise(r => setTimeout(r, 500));
  const snap500 = await send('Page.captureScreenshot', {});
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'act_mobile_scroll500.png'), Buffer.from(snap500.data, 'base64'));

  // Scroll 800px
  await evalCode(`window.scrollTo(0, 800);`);
  await new Promise(r => setTimeout(r, 500));
  const snap800 = await send('Page.captureScreenshot', {});
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'act_mobile_scroll800.png'), Buffer.from(snap800.data, 'base64'));

  // Check state at 800px
  const state800 = await evalCode(`
    (() => {
      const container = document.querySelector('#activitiesGrid').closest('.camp-container');
      const cards = Array.from(document.querySelectorAll('.act-card-wrapper'));
      return {
        scrollY: window.scrollY,
        containerClasses: container.className,
        containerOpacity: window.getComputedStyle(container).opacity,
        containerTransform: window.getComputedStyle(container).transform,
        firstCardRect: cards[0].getBoundingClientRect()
      };
    })()
  `);
  console.log('State at scroll 800px:', JSON.stringify(state800, null, 2));

  chrome.kill();
}

testMobileActivities();
