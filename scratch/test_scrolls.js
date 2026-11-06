const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\elixir\\.gemini\\antigravity\\brain\\3e9aa1d1-bc09-43cd-a180-9f8457e40a33';

async function testScrolls() {
  const port = 9343;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + process.env.TEMP + '\\ch_dbg_act_scrolls_' + Date.now(),
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

  for (const s of [100, 200, 300, 400]) {
    await evalCode(`window.scrollTo(0, ${s});`);
    await new Promise(r => setTimeout(r, 400));
    const snap = await send('Page.captureScreenshot', {});
    fs.writeFileSync(path.join(ARTIFACT_DIR, `act_mobile_scroll_${s}.png`), Buffer.from(snap.data, 'base64'));

    const isVisible = await evalCode(`
      (() => {
        const c = document.querySelector('#activitiesGrid').closest('.camp-container');
        return {
          scrollY: window.scrollY,
          classList: Array.from(c.classList),
          opacity: window.getComputedStyle(c).opacity
        };
      })()
    `);
    console.log(`Scroll ${s}:`, JSON.stringify(isVisible));
  }

  chrome.kill();
}

testScrolls();
