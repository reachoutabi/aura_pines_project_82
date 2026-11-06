const http = require('http');
const { spawn } = require('child_process');

async function testMetaWrap() {
  const port = 9336;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + process.env.TEMP + '\\ch_dbg_meta_' + Date.now(),
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

  console.log('--- DESKTOP (1300x900) ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1300, height: 900, deviceScaleFactor: 2, mobile: false });
  await new Promise(r => setTimeout(r, 500));
  const desktop = await evalCode(`
    (() => {
      return Array.from(document.querySelectorAll('.camp-card-meta')).map((meta, i) => {
        const spans = Array.from(meta.querySelectorAll('span'));
        return {
          card: i + 1,
          metaWidth: meta.getBoundingClientRect().width,
          spans: spans.map(s => ({
            text: s.textContent.trim(),
            width: s.getBoundingClientRect().width,
            height: s.getBoundingClientRect().height,
            isMultiLine: s.getBoundingClientRect().height > 22
          }))
        };
      });
    })()
  `);
  console.log('Desktop meta:', JSON.stringify(desktop, null, 2));

  console.log('--- MOBILE (375x812) ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 500));
  const mobile = await evalCode(`
    (() => {
      return Array.from(document.querySelectorAll('.camp-card-meta')).map((meta, i) => {
        const spans = Array.from(meta.querySelectorAll('span'));
        return {
          card: i + 1,
          metaWidth: meta.getBoundingClientRect().width,
          spans: spans.map(s => ({
            text: s.textContent.trim(),
            width: s.getBoundingClientRect().width,
            height: s.getBoundingClientRect().height,
            isMultiLine: s.getBoundingClientRect().height > 22
          }))
        };
      });
    })()
  `);
  console.log('Mobile meta:', JSON.stringify(mobile, null, 2));

  chrome.kill();
}

testMetaWrap();
