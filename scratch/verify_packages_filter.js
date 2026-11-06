const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\elixir\\.gemini\\antigravity\\brain\\3e9aa1d1-bc09-43cd-a180-9f8457e40a33';

async function verifyPackagesFilter() {
  const port = 9335;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=' + process.env.TEMP + '\\ch_dbg_pkg_filter_' + Date.now(),
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
    if (res.exceptionDetails) {
      console.error('Eval Exception:', res.exceptionDetails);
    }
    return res.result;
  };

  // Prepare page: smooth scroll off, reveal elements
  await evalCode(`
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelectorAll('.camp-animate, .camp-reveal').forEach(el => el.classList.add('camp-visible'));
  `);

  console.log('--- 1. DESKTOP VERIFICATION (1300x900) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1300,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 600));

  const desktopMetrics = (await evalCode(`
    (() => {
      const dur = document.getElementById('filterDuration').getBoundingClientRect();
      const grp = document.getElementById('filterGroup').getBoundingClientRect();
      const sea = document.getElementById('filterSeason').getBoundingClientRect();
      const srt = document.getElementById('sortPackages').getBoundingClientRect();
      const btn = document.getElementById('btnToggleComparison').getBoundingClientRect();
      const bar = document.querySelector('.packages-filter-bar').getBoundingClientRect();

      return {
        bar: { width: bar.width, height: bar.height },
        dur: { top: dur.top, height: dur.height, width: dur.width },
        grp: { top: grp.top, height: grp.height, width: grp.width },
        sea: { top: sea.top, height: sea.height, width: sea.width },
        srt: { top: srt.top, height: srt.height, width: srt.width },
        btn: { top: btn.top, height: btn.height, width: btn.width },
        sameHeight: Math.abs(dur.height - srt.height) < 1 && Math.abs(dur.height - btn.height) < 2
      };
    })()
  `)).value;

  console.log('Desktop Metrics:', JSON.stringify(desktopMetrics, null, 2));

  // Screenshot Desktop Light
  const snapDesktopLight = await send('Page.captureScreenshot', {
    clip: {
      x: 0,
      y: Math.max(0, desktopMetrics.dur.top - 80),
      width: 1300,
      height: 380,
      scale: 1
    }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'packages_filter_desktop_light.png'), Buffer.from(snapDesktopLight.data, 'base64'));
  console.log('Saved packages_filter_desktop_light.png');

  // Desktop Dark
  await evalCode(`document.documentElement.setAttribute('data-theme', 'dark');`);
  await new Promise(r => setTimeout(r, 200));
  const snapDesktopDark = await send('Page.captureScreenshot', {
    clip: {
      x: 0,
      y: Math.max(0, desktopMetrics.dur.top - 80),
      width: 1300,
      height: 380,
      scale: 1
    }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'packages_filter_desktop_dark.png'), Buffer.from(snapDesktopDark.data, 'base64'));
  console.log('Saved packages_filter_desktop_dark.png');

  console.log('--- 2. MOBILE VERIFICATION (375x812) ---');
  await evalCode(`document.documentElement.setAttribute('data-theme', 'light');`);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 600));

  const mobileMetrics = (await evalCode(`
    (() => {
      const dur = document.getElementById('filterDuration').getBoundingClientRect();
      const grp = document.getElementById('filterGroup').getBoundingClientRect();
      const sea = document.getElementById('filterSeason').getBoundingClientRect();
      const srt = document.getElementById('sortPackages').getBoundingClientRect();
      const btn = document.getElementById('btnToggleComparison').getBoundingClientRect();
      const bar = document.querySelector('.packages-filter-bar').getBoundingClientRect();
      const container = document.querySelector('.camp-container');

      return {
        bar: { width: bar.width, height: bar.height },
        dur: { top: dur.top, height: dur.height, width: dur.width, left: dur.left },
        grp: { top: grp.top, height: grp.height, width: grp.width, left: grp.left },
        sea: { top: sea.top, height: sea.height, width: sea.width, left: sea.left },
        srt: { top: srt.top, height: srt.height, width: srt.width, left: srt.left },
        btn: { top: btn.top, height: btn.height, width: btn.width, left: btn.left },
        row1Aligned: Math.abs(dur.top - grp.top) < 1.5,
        row2Aligned: Math.abs(sea.top - srt.top) < 1.5,
        row1EqualWidth: Math.abs(dur.width - grp.width) < 2,
        row2EqualWidth: Math.abs(sea.width - srt.width) < 2,
        btnFullWidth: btn.width > bar.width * 0.95,
        btnBelowRow2: btn.top > sea.top + sea.height - 2
      };
    })()
  `)).value;

  console.log('Mobile Metrics (375px):', JSON.stringify(mobileMetrics, null, 2));

  // Screenshot Mobile Light
  const snapMobileLight = await send('Page.captureScreenshot', {
    clip: {
      x: 0,
      y: Math.max(0, mobileMetrics.dur.top - 80),
      width: 375,
      height: 380,
      scale: 1
    }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'packages_filter_mobile_light.png'), Buffer.from(snapMobileLight.data, 'base64'));
  console.log('Saved packages_filter_mobile_light.png');

  // Mobile Dark
  await evalCode(`document.documentElement.setAttribute('data-theme', 'dark');`);
  await new Promise(r => setTimeout(r, 200));
  const snapMobileDark = await send('Page.captureScreenshot', {
    clip: {
      x: 0,
      y: Math.max(0, mobileMetrics.dur.top - 80),
      width: 375,
      height: 380,
      scale: 1
    }
  });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'packages_filter_mobile_dark.png'), Buffer.from(snapMobileDark.data, 'base64'));
  console.log('Saved packages_filter_mobile_dark.png');

  console.log('--- 3. FILTER & SORT FUNCTIONALITY TEST ---');
  const funcTest = (await evalCode(`
    (() => {
      const dur = document.getElementById('filterDuration');
      const sort = document.getElementById('sortPackages');
      const items = Array.from(document.querySelectorAll('.package-item'));
      
      // Test duration filter: '2-days'
      dur.value = '2-days';
      dur.dispatchEvent(new Event('change'));
      const visible2Days = items.filter(el => el.style.display !== 'none').length;

      // Reset
      dur.value = 'all';
      dur.dispatchEvent(new Event('change'));
      const visibleAll = items.filter(el => el.style.display !== 'none').length;

      // Test sort
      sort.value = 'price-low';
      sort.dispatchEvent(new Event('change'));
      const firstPrice = parseFloat(document.querySelectorAll('.package-item')[0].dataset.price);

      return {
        visible2Days,
        visibleAll,
        firstPriceLow: firstPrice,
        success: visible2Days < visibleAll && visibleAll === items.length
      };
    })()
  `)).value;
  console.log('Filter Functionality Result:', JSON.stringify(funcTest, null, 2));

  console.log('--- 4. NARROW MOBILE (320px) OVERFLOW TEST ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 568,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 400));
  const overflowCheck = (await evalCode(`
    (() => {
      const doc = document.documentElement;
      const bar = document.querySelector('.packages-filter-bar');
      return {
        docScrollWidth: doc.scrollWidth,
        docClientWidth: doc.clientWidth,
        hasOverflow: doc.scrollWidth > doc.clientWidth,
        barWidth: bar.getBoundingClientRect().width
      };
    })()
  `)).value;
  console.log('Narrow Mobile (320px) Result:', JSON.stringify(overflowCheck, null, 2));

  chrome.kill();
  console.log('Verification finished successfully!');
}

verifyPackagesFilter().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
