const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PROJECT_DIR = 'C:\\innovalq_tech\\nov_82_project';
const ARTIFACTS_DIR = 'C:\\Users\\elixir\\.gemini\\antigravity\\brain\\3e9aa1d1-bc09-43cd-a180-9f8457e40a33';
const PORT = 8126;
const CDP_PORT = 9331;

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
    
    async function testAndCapture(w, h, isMobile, theme, filename) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: isMobile });
      await send('Page.navigate', { url: `http://localhost:${PORT}/index-2.html` });
      await new Promise(r => setTimeout(r, 1500));
      
      if (theme === 'dark') {
        await send('Runtime.evaluate', {
          expression: `
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('aura_theme', 'dark');
          `
        });
        await new Promise(r => setTimeout(r, 300));
      }
      
      await send('Runtime.evaluate', {
        expression: `document.querySelectorAll('.camp-container').forEach(c => c.classList.add('camp-visible'));`
      });
      
      const metrics = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const cards = Array.from(document.querySelectorAll('.trail-card-item'));
            return cards.map((c, i) => {
              const pt = c.querySelector('.price-tag');
              const val = c.querySelector('.price-tag-value');
              const period = c.querySelector('.price-tag-period');
              const btn = c.querySelector('.btn-camp');
              
              const vRect = val.getBoundingClientRect();
              const pRect = period.getBoundingClientRect();
              const bRect = btn.getBoundingClientRect();
              const ptRect = pt.getBoundingClientRect();
              
              const isOneLine = Math.abs(vRect.top - pRect.top) < 10;
              const isButtonBelow = bRect.top >= ptRect.bottom - 2;
              
              return {
                cardIndex: i + 1,
                valText: val.textContent.trim(),
                periodText: period.textContent.trim(),
                isOneLine,
                isButtonBelow,
                valTop: Math.round(vRect.top),
                periodTop: Math.round(pRect.top),
                btnTop: Math.round(bRect.top),
                ptBottom: Math.round(ptRect.bottom)
              };
            });
          })()
        `,
        returnByValue: true
      });
      
      console.log(`\nMetrics for ${w}x${h} (${theme}):`, JSON.stringify(metrics.result.value, null, 2));
      
      // Scroll to route cards footer
      await send('Runtime.evaluate', {
        expression: `
          const el = document.querySelectorAll('.trail-card-item')[1]?.querySelector('.camp-card-footer') || document.querySelector('.trail-card-item');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        `
      });
      await new Promise(r => setTimeout(r, 500));
      
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACTS_DIR, filename), Buffer.from(ss.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }
    
    // Desktop Light
    await testAndCapture(1300, 900, false, 'light', 'route_cards_desktop_light.png');
    // Desktop Dark
    await testAndCapture(1300, 900, false, 'dark', 'route_cards_desktop_dark.png');
    // Mobile Light
    await testAndCapture(375, 812, true, 'light', 'route_cards_mobile_light.png');
    // Mobile Dark
    await testAndCapture(375, 812, true, 'dark', 'route_cards_mobile_dark.png');
    
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
