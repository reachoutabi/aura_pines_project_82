const http = require('http');
const { spawn } = require('child_process');

async function testScreens() {
  const port = 9337;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + process.env.TEMP + '\\ch_dbg_screens_' + Date.now(),
    '--window-size=1200,800',
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

  const widths = [320, 340, 360, 375, 414, 576, 768, 992, 1000, 1024, 1100, 1200];
  for (const w of widths) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 800, deviceScaleFactor: 2, mobile: w < 992 });
    await new Promise(r => setTimeout(r, 200));
    const res = await evalCode(`
      (() => {
        const meta1 = document.querySelector('.camp-card-meta');
        const spans = Array.from(meta1.querySelectorAll('span'));
        return {
          viewport: ${w},
          metaWidth: meta1.getBoundingClientRect().width,
          span0Height: spans[0].getBoundingClientRect().height,
          span1Height: spans[1].getBoundingClientRect().height,
          span0Top: spans[0].getBoundingClientRect().top,
          span1Top: spans[1].getBoundingClientRect().top
        };
      })()
    `);
    console.log(JSON.stringify(res));
  }

  chrome.kill();
}

testScreens();
