const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\elixir\\.gemini\\antigravity\\brain\\3e9aa1d1-bc09-43cd-a180-9f8457e40a33';

async function testCardMetaDesigns() {
  const port = 9338;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + process.env.TEMP + '\\ch_dbg_meta_designs_' + Date.now(),
    '--window-size=1200,900',
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

  // Inject meta style
  await evalCode(`
    const style1 = document.createElement('style');
    style1.id = 'test-meta-style';
    style1.textContent = \`
      .camp-card-meta {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        flex-wrap: wrap !important;
        gap: 0.35rem 0.65rem !important;
        margin-bottom: 0.65rem !important;
      }
      .camp-card-meta span {
        white-space: nowrap !important;
        font-size: 0.78rem !important;
        display: inline-flex !important;
        align-items: center !important;
      }
    \`;
    document.head.appendChild(style1);
  `);

  // 1024px
  await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 900, deviceScaleFactor: 2, mobile: false });
  await new Promise(r => setTimeout(r, 300));
  const metaPos1024 = await evalCode(`
    (() => {
      const m = document.querySelector('.package-item .camp-card-meta');
      const r = m.getBoundingClientRect();
      return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
    })()
  `);
  console.log('metaPos1024:', metaPos1024);
  const snap1024 = await send('Page.captureScreenshot', {
    clip: { x: Math.max(0, metaPos1024.x - 10), y: Math.max(0, metaPos1024.y - 10), width: metaPos1024.width + 20, height: metaPos1024.height + 20, scale: 2 },
    captureBeyondViewport: true
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_meta_1024.png'), Buffer.from(snap1024.data, 'base64'));
  console.log('Saved test_meta_1024.png');

  // 375px mobile
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 300));
  const metaPos375 = await evalCode(`
    (() => {
      const m = document.querySelector('.package-item .camp-card-meta');
      const r = m.getBoundingClientRect();
      return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
    })()
  `);
  console.log('metaPos375:', metaPos375);
  const snap375 = await send('Page.captureScreenshot', {
    clip: { x: Math.max(0, metaPos375.x - 10), y: Math.max(0, metaPos375.y - 10), width: metaPos375.width + 20, height: metaPos375.height + 20, scale: 2 },
    captureBeyondViewport: true
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_meta_375.png'), Buffer.from(snap375.data, 'base64'));
  console.log('Saved test_meta_375.png');

  chrome.kill();
}

testCardMetaDesigns();
