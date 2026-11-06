const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PROJECT_DIR = 'C:\\innovalq_tech\\nov_82_project';
const ARTIFACTS_DIR = 'C:\\Users\\elixir\\.gemini\\antigravity\\brain\\3e9aa1d1-bc09-43cd-a180-9f8457e40a33';
const PORT = 8122;
const CDP_PORT = 9327;

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
    
    // Check index.html elements on mobile (375px) and desktop (1300px)
    for (const [w, h, isMob] of [[1300, 900, false], [375, 812, true]]) {
      console.log(`\n=== Verifying index.html at ${w}x${h} ===`);
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: isMob });
      await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
      await new Promise(r => setTimeout(r, 1500));
      
      const checkRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            // 1. Whispering Ridge Elev badge
            const badge1 = document.querySelector('.weather-header .camp-badge');
            const b1Rect = badge1 ? badge1.getBoundingClientRect() : null;
            
            // 2. Leave No Trace Certified
            const lntTitle = document.querySelector('.lnt-cert-title');
            const lntSub = document.querySelector('.lnt-cert-sub');
            const tRect = lntTitle ? lntTitle.getBoundingClientRect() : null;
            const sRect = lntSub ? lntSub.getBoundingClientRect() : null;
            
            // 3. Limited Wilderness Availability
            const bannerBadge = document.querySelector('.cta-banner-dark .section-badge');
            const bbRect = bannerBadge ? bannerBadge.getBoundingClientRect() : null;
            
            return {
              badge1: {
                text: badge1 ? badge1.textContent.trim() : null,
                height: b1Rect ? Math.round(b1Rect.height) : null,
                isSingleLine: b1Rect ? b1Rect.height < 34 : false
              },
              leaveNoTrace: {
                titleText: lntTitle ? lntTitle.textContent.trim() : null,
                titleHeight: tRect ? Math.round(tRect.height) : null,
                isTitleSingleLine: tRect ? tRect.height < 32 : false,
                subText: lntSub ? lntSub.textContent.trim() : null,
                subHeight: sRect ? Math.round(sRect.height) : null,
                isSubSingleLine: sRect ? sRect.height < 26 : false
              },
              limitedWildernessBadge: {
                text: bannerBadge ? bannerBadge.textContent.trim() : null,
                height: bbRect ? Math.round(bbRect.height) : null,
                isSingleLine: bbRect ? bbRect.height < 36 : false
              }
            };
          })()
        `,
        returnByValue: true
      });
      console.log('index.html checks:', JSON.stringify(checkRes.result.value, null, 2));
    }
    
    // Check index-2.html elements on mobile (375px) and desktop (1300px)
    for (const [w, h, isMob] of [[1300, 900, false], [375, 812, true]]) {
      console.log(`\n=== Verifying index-2.html at ${w}x${h} ===`);
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: isMob });
      await send('Page.navigate', { url: `http://localhost:${PORT}/index-2.html` });
      await new Promise(r => setTimeout(r, 1500));
      
      const checkRes2 = await send('Runtime.evaluate', {
        expression: `
          (() => {
            // 4. High-Altitude Wilderness Expeditions badge
            const expBadge = document.querySelector('.hero-expedition .section-badge');
            const eRect = expBadge ? expBadge.getBoundingClientRect() : null;
            
            // 5. $850 all meals & gear
            const priceTag = document.querySelector('.trail-card-item .price-tag');
            const val = priceTag ? priceTag.querySelector('.price-tag-value') : null;
            const per = priceTag ? priceTag.querySelector('.price-tag-period') : null;
            const vRect = val ? val.getBoundingClientRect() : null;
            const pRect = per ? per.getBoundingClientRect() : null;
            
            return {
              expeditionsBadge: {
                text: expBadge ? expBadge.textContent.trim() : null,
                height: eRect ? Math.round(eRect.height) : null,
                isSingleLine: eRect ? eRect.height < 36 : false
              },
              priceTag850: {
                val: val ? val.textContent.trim() : null,
                period: per ? per.textContent.trim() : null,
                vTop: vRect ? Math.round(vRect.top) : null,
                pTop: pRect ? Math.round(pRect.top) : null,
                isSingleLine: (vRect && pRect) ? Math.abs(vRect.top - pRect.top) < 12 : false
              }
            };
          })()
        `,
        returnByValue: true
      });
      console.log('index-2.html checks:', JSON.stringify(checkRes2.result.value, null, 2));
    }
    
    // Capture focused screenshots of all 5
    // 1. Whispering Ridge
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
    await new Promise(r => setTimeout(r, 1200));
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.weather-header .camp-badge')?.scrollIntoView({ block: 'center' });`
    });
    await new Promise(r => setTimeout(r, 400));
    let ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'single_line_1_whispering_ridge.png'), Buffer.from(ss.data, 'base64'));
    console.log('Saved single_line_1_whispering_ridge.png');
    
    // 2. Leave No Trace
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.lnt-cert-title')?.scrollIntoView({ block: 'center' });`
    });
    await new Promise(r => setTimeout(r, 400));
    ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'single_line_2_leave_no_trace.png'), Buffer.from(ss.data, 'base64'));
    console.log('Saved single_line_2_leave_no_trace.png');
    
    // 3. Limited Wilderness Availability
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.cta-banner-dark .section-badge')?.scrollIntoView({ block: 'center' });`
    });
    await new Promise(r => setTimeout(r, 400));
    ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'single_line_3_limited_wilderness.png'), Buffer.from(ss.data, 'base64'));
    console.log('Saved single_line_3_limited_wilderness.png');
    
    // 4 & 5. index-2.html
    await send('Page.navigate', { url: `http://localhost:${PORT}/index-2.html` });
    await new Promise(r => setTimeout(r, 1200));
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.hero-expedition .section-badge')?.scrollIntoView({ block: 'center' });`
    });
    await new Promise(r => setTimeout(r, 400));
    ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'single_line_4_high_altitude_badge.png'), Buffer.from(ss.data, 'base64'));
    console.log('Saved single_line_4_high_altitude_badge.png');
    
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.trail-card-item .price-tag')?.scrollIntoView({ block: 'center' });`
    });
    await new Promise(r => setTimeout(r, 400));
    ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'single_line_5_price_tag_850.png'), Buffer.from(ss.data, 'base64'));
    console.log('Saved single_line_5_price_tag_850.png');
    
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
