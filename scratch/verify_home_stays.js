const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PROJECT_DIR = 'C:\\innovalq_tech\\nov_82_project';
const ARTIFACTS_DIR = 'C:\\Users\\elixir\\.gemini\\antigravity\\brain\\3e9aa1d1-bc09-43cd-a180-9f8457e40a33';
const PORT = 8120;
const CDP_PORT = 9325;

// MIME types
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
  if (reqPath === '/') reqPath = '/index.html';
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
  console.log(`Server listening at http://localhost:${PORT}`);
  
  // Launch Chrome
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
  
  // Wait for CDP
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
    const wsUrl = pageTarget.webSocketDebuggerUrl;
    
    // Connect WebSocket using Node 22+ built-in WebSocket
    const ws = new WebSocket(wsUrl);
    
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    console.log('Connected to CDP WebSocket');
    
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
    
    async function testViewport(width, height, isMobile, theme, screenshotName) {
      console.log(`\n--- Testing ${width}x${height} (${theme}) ---`);
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: isMobile
      });
      
      await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
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
      
      // Evaluate card metrics
      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const cards = Array.from(document.querySelectorAll('.camp-card'));
            const stayCards = cards.filter(c => c.querySelector('.price-tag') && c.querySelector('.btn-camp'));
            return stayCards.map((c, i) => {
              const footer = c.querySelector('.camp-card-footer');
              const priceTag = c.querySelector('.price-tag');
              const val = c.querySelector('.price-tag-value');
              const period = c.querySelector('.price-tag-period');
              const btn = c.querySelector('.btn-camp');
              
              const fRect = footer.getBoundingClientRect();
              const pRect = priceTag.getBoundingClientRect();
              const vRect = val.getBoundingClientRect();
              const perRect = period.getBoundingClientRect();
              const bRect = btn.getBoundingClientRect();
              
              const isOneLine = Math.abs(vRect.top - perRect.top) < 12; // baseline check
              const isButtonSecondLine = bRect.top >= pRect.bottom - 2;
              const isFullWidthBtn = Math.abs(bRect.width - fRect.width) < 5;
              
              return {
                index: i + 1,
                valText: val.textContent.trim(),
                periodText: period.textContent.trim(),
                btnText: btn.textContent.trim(),
                isOneLine,
                isButtonSecondLine,
                isFullWidthBtn,
                valTop: Math.round(vRect.top),
                perTop: Math.round(perRect.top),
                pBottom: Math.round(pRect.bottom),
                bTop: Math.round(bRect.top),
                fWidth: Math.round(fRect.width),
                bWidth: Math.round(bRect.width)
              };
            });
          })()
        `,
        returnByValue: true
      });
      
      console.log('Results:', JSON.stringify(evalRes.result.value, null, 2));
      
      // Scroll to stays section and take screenshot
      await send('Runtime.evaluate', {
        expression: `
          const el = document.querySelector('.section-badge i.bi-house-heart')?.closest('section') || document.querySelector('.camp-card');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        `
      });
      await new Promise(r => setTimeout(r, 600));
      
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      const ssPath = path.join(ARTIFACTS_DIR, screenshotName);
      fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
      console.log(`Saved screenshot: ${ssPath}`);
    }
    
    // Test Desktop Light
    await testViewport(1300, 900, false, 'light', 'home_stays_twoline_desktop_light.png');
    
    // Test Desktop Dark
    await testViewport(1300, 900, false, 'dark', 'home_stays_twoline_desktop_dark.png');
    
    // Test Mobile Light
    await testViewport(375, 812, true, 'light', 'home_stays_twoline_mobile_light.png');
    
    // Test Mobile Dark
    await testViewport(375, 812, true, 'dark', 'home_stays_twoline_mobile_dark.png');
    
    // Also test index-2.html
    console.log('\n--- Testing index-2.html Route Cards ---');
    await send('Emulation.setDeviceMetricsOverride', { width: 1300, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `http://localhost:${PORT}/index-2.html` });
    await new Promise(r => setTimeout(r, 1500));
    const evalIndex2 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = Array.from(document.querySelectorAll('.trail-card-item .camp-card'));
          return cards.map((c, i) => {
            const footer = c.querySelector('.camp-card-footer');
            const priceTag = c.querySelector('.price-tag');
            const val = c.querySelector('.price-tag-value');
            const period = c.querySelector('.price-tag-period');
            const btn = c.querySelector('.btn-camp');
            const fRect = footer.getBoundingClientRect();
            const pRect = priceTag.getBoundingClientRect();
            const vRect = val.getBoundingClientRect();
            const perRect = period.getBoundingClientRect();
            const bRect = btn.getBoundingClientRect();
            return {
              index: i + 1,
              valText: val.textContent.trim(),
              periodText: period.textContent.trim(),
              btnText: btn.textContent.trim(),
              isOneLine: Math.abs(vRect.top - perRect.top) < 12,
              isButtonSecondLine: bRect.top >= pRect.bottom - 2,
              isFullWidthBtn: Math.abs(bRect.width - fRect.width) < 5
            };
          });
        })()
      `,
      returnByValue: true
    });
    console.log('index-2.html results:', JSON.stringify(evalIndex2.result.value, null, 2));
    
    ws.close();
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    try {
      chrome.kill();
      execSync(`taskkill /f /im chrome.exe /fi "WINDOWTITLE eq about:blank*" 2>nul`);
    } catch(e) {}
    server.close();
    process.exit(0);
  }
});
