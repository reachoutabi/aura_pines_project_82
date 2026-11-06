const http = require('http');
const { spawn } = require('child_process');

async function testAllCards() {
  const port = 9339;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + process.env.TEMP + '\\ch_dbg_all_cards_' + Date.now(),
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

  const widths = [320, 360, 375, 768, 1024, 1300];
  for (const w of widths) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 2, mobile: w < 992 });
    await new Promise(r => setTimeout(r, 250));
    const cards = await evalCode(`
      (() => {
        return Array.from(document.querySelectorAll('.package-item')).map((item, idx) => {
          const meta = item.querySelector('.camp-card-meta');
          const spans = Array.from(meta.querySelectorAll('span'));
          return {
            card: idx + 1,
            span0Text: spans[0].textContent.trim(),
            span0Height: spans[0].getBoundingClientRect().height,
            span1Text: spans[1].textContent.trim(),
            span1Height: spans[1].getBoundingClientRect().height,
            isOneLineEach: spans[0].getBoundingClientRect().height <= 24 && spans[1].getBoundingClientRect().height <= 24,
            isSameRow: Math.abs(spans[0].getBoundingClientRect().top - spans[1].getBoundingClientRect().top) < 2
          };
        });
      })()
    `);
    console.log('=== Viewport ' + w + ' ===');
    cards.forEach(c => {
      console.log('  Card ' + c.card + ': "' + c.span0Text + '" & "' + c.span1Text + '" -> isOneLineEach: ' + c.isOneLineEach + ', isSameRow: ' + c.isSameRow);
    });
  }

  chrome.kill();
}

testAllCards();
