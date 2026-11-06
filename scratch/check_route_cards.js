const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PROJECT_DIR = 'C:\\innovalq_tech\\nov_82_project';
const ARTIFACTS_DIR = 'C:\\Users\\elixir\\.gemini\\antigravity\\brain\\3e9aa1d1-bc09-43cd-a180-9f8457e40a33';
const PORT = 8125;
const CDP_PORT = 9330;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index-2.html';
  const filePath = path.join(PROJECT_DIR, reqPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeUserData = path.join(ARTIFACTS_DIR, 'scratch', 'chrome_profile_' + CDP_PORT);
  
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${chromeUserData}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    'about:blank'
  ]);
  
  await new Promise(r => setTimeout(r, 1200));
  
  try {
    const httpGet = (url) => new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
    
    const targets = JSON.parse(await httpGet(`http://localhost:${CDP_PORT}/json/list`));
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    
    let id = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === msgId) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
    
    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');
    
    await send('Emulation.setDeviceMetricsOverride', { width: 1300, height: 900, deviceScaleFactor: 2, mobile: false });
    await send('Page.navigate', { url: `http://localhost:${PORT}/index-2.html` });
    await new Promise(r => setTimeout(r, 1500));
    
    const res = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = Array.from(document.querySelectorAll('.trail-card-item, .camp-card'));
          const routeCards = cards.filter(c => c.querySelector('.price-tag'));
          return routeCards.map(c => {
            const pt = c.querySelector('.price-tag');
            const v = c.querySelector('.price-tag-value');
            const p = c.querySelector('.price-tag-period');
            const btn = c.querySelector('.btn-camp');
            const cs = window.getComputedStyle(pt);
            const vcs = window.getComputedStyle(v);
            const pcs = window.getComputedStyle(p);
            const vr = v.getBoundingClientRect();
            const pr = p.getBoundingClientRect();
            const br = btn.getBoundingClientRect();
            return {
              valText: v.textContent,
              periodText: p.textContent,
              display: cs.display,
              flexDirection: cs.flexDirection,
              whiteSpace: cs.whiteSpace,
              vDisplay: vcs.display,
              pDisplay: pcs.display,
              vTop: Math.round(vr.top),
              pTop: Math.round(pr.top),
              bTop: Math.round(br.top),
              isSingleLine: Math.abs(vr.top - pr.top) < 10,
              isButtonDown: br.top >= pr.bottom - 2
            };
          });
        })()
      `,
      returnByValue: true
    });
    
    console.log('Route cards computed styles:', JSON.stringify(res.result.value, null, 2));
    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    try {
      chrome.kill();
      execSync(`taskkill /f /im chrome.exe /fi "WINDOWTITLE eq about:blank*" 2>nul`);
    } catch(e) {}
    server.close();
    process.exit(0);
  }
});
