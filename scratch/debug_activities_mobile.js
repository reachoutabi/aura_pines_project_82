const http = require('http');
const { spawn } = require('child_process');

async function debugActivitiesMobile() {
  const port = 9341;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + process.env.TEMP + '\\ch_dbg_act_' + Date.now(),
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
  await send('Log.enable');

  const evalCode = async (code) => {
    const res = await send('Runtime.evaluate', { expression: code, returnByValue: true });
    return res.result.value;
  };

  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 1000));

  const check = await evalCode(`
    (() => {
      const grid = document.getElementById('activitiesGrid');
      const cards = Array.from(document.querySelectorAll('.act-card-wrapper'));
      const containers = Array.from(document.querySelectorAll('.camp-container')).map(c => ({
        classes: c.className,
        opacity: window.getComputedStyle(c).opacity,
        visibility: window.getComputedStyle(c).visibility,
        display: window.getComputedStyle(c).display,
        rect: { top: c.getBoundingClientRect().top, height: c.getBoundingClientRect().height }
      }));

      const bodyClasses = document.body.className;

      return {
        bodyClasses,
        gridRect: grid ? { top: grid.getBoundingClientRect().top, height: grid.getBoundingClientRect().height } : null,
        cardCount: cards.length,
        firstCard: cards.length > 0 ? {
          display: window.getComputedStyle(cards[0]).display,
          opacity: window.getComputedStyle(cards[0]).opacity,
          visibility: window.getComputedStyle(cards[0]).visibility,
          rect: {
            top: cards[0].getBoundingClientRect().top,
            height: cards[0].getBoundingClientRect().height,
            width: cards[0].getBoundingClientRect().width
          }
        } : null,
        containers
      };
    })()
  `);

  console.log('Mobile Check Result:', JSON.stringify(check, null, 2));

  chrome.kill();
}

debugActivitiesMobile();
