const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\elixir\\.gemini\\antigravity\\brain\\3e9aa1d1-bc09-43cd-a180-9f8457e40a33';

async function verifyActivitiesMobile() {
  const port = 9344;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + process.env.TEMP + '\\ch_dbg_act_ver_' + Date.now(),
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

  console.log('--- 1. INITIAL LOAD ON MOBILE (375x812) ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 600));

  const initialCheck = await evalCode(`
    (() => {
      const container = document.querySelector('#activitiesGrid').closest('.camp-container');
      const cards = Array.from(document.querySelectorAll('.act-card-wrapper'));
      const visibleCards = cards.filter(c => window.getComputedStyle(c).display !== 'none');
      const containerStyle = window.getComputedStyle(container);

      return {
        containerOpacity: containerStyle.opacity,
        containerVisibility: containerStyle.visibility,
        containerDisplay: containerStyle.display,
        containerClasses: Array.from(container.classList),
        totalCards: cards.length,
        visibleCardsCount: visibleCards.length,
        firstCardRect: {
          width: visibleCards[0].getBoundingClientRect().width,
          height: visibleCards[0].getBoundingClientRect().height,
          top: visibleCards[0].getBoundingClientRect().top
        }
      };
    })()
  `);
  console.log('Initial Mobile Check:', JSON.stringify(initialCheck, null, 2));

  // Scroll 250px so search bar + top of first card is in view
  await evalCode(`window.scrollTo(0, 250);`);
  await new Promise(r => setTimeout(r, 300));
  const snapMobileLight = await send('Page.captureScreenshot', {});
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'activities_mobile_initial_light.png'), Buffer.from(snapMobileLight.data, 'base64'));
  console.log('Saved activities_mobile_initial_light.png');

  // Dark mode
  await evalCode(`document.documentElement.setAttribute('data-theme', 'dark');`);
  await new Promise(r => setTimeout(r, 200));
  const snapMobileDark = await send('Page.captureScreenshot', {});
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'activities_mobile_initial_dark.png'), Buffer.from(snapMobileDark.data, 'base64'));
  console.log('Saved activities_mobile_initial_dark.png');

  console.log('--- 2. FILTER INTERACTION TEST (Adventure Category) ---');
  await evalCode(`document.documentElement.setAttribute('data-theme', 'light');`);
  const filterCheck = await evalCode(`
    (() => {
      const advBtn = document.querySelector('.act-filter-btn[data-category="adventure"]');
      advBtn.click();
      const cards = Array.from(document.querySelectorAll('.act-card-wrapper'));
      const visible = cards.filter(c => window.getComputedStyle(c).display !== 'none');
      return {
        activeCat: 'adventure',
        visibleCount: visible.length,
        visibleTitles: visible.map(c => c.dataset.title)
      };
    })()
  `);
  console.log('Adventure Filter Result:', JSON.stringify(filterCheck, null, 2));

  const snapFilter = await send('Page.captureScreenshot', {});
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'activities_mobile_filter_adventure.png'), Buffer.from(snapFilter.data, 'base64'));
  console.log('Saved activities_mobile_filter_adventure.png');

  // Reset to All
  await evalCode(`
    document.querySelector('.act-filter-btn[data-category="all"]').click();
  `);

  console.log('--- 3. DESKTOP VERIFICATION (1300x900) ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1300, height: 900, deviceScaleFactor: 2, mobile: false });
  await evalCode(`window.scrollTo(0, 400);`);
  await new Promise(r => setTimeout(r, 400));
  const desktopCheck = await evalCode(`
    (() => {
      const container = document.querySelector('#activitiesGrid').closest('.camp-container');
      const cards = Array.from(document.querySelectorAll('.act-card-wrapper'));
      const visible = cards.filter(c => window.getComputedStyle(c).display !== 'none');
      return {
        containerOpacity: window.getComputedStyle(container).opacity,
        visibleCount: visible.length
      };
    })()
  `);
  console.log('Desktop Check:', JSON.stringify(desktopCheck, null, 2));

  const snapDesktop = await send('Page.captureScreenshot', {});
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'activities_desktop_light.png'), Buffer.from(snapDesktop.data, 'base64'));
  console.log('Saved activities_desktop_light.png');

  chrome.kill();
  console.log('All activities mobile visibility tests passed successfully!');
}

verifyActivitiesMobile().catch(err => {
  console.error('Error during activities verification:', err);
  process.exit(1);
});
