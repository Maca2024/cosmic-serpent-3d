import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Collect ALL console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.toString());
  });

  // Collect failed requests
  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  console.log('=== Step 1: Navigating to the game URL ===');
  try {
    await page.goto('https://3d-snake-game-sigma.vercel.app/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('Page loaded successfully');
  } catch (e) {
    console.log('Navigation issue:', e.message);
  }

  // Wait a bit for Three.js to initialize
  await page.waitForTimeout(3000);

  // Take first screenshot
  await page.screenshot({ path: 'screenshot-1-initial.png', fullPage: true });
  console.log('Screenshot 1 saved: screenshot-1-initial.png');

  // Check page title and visible text
  const title = await page.title();
  console.log('Page title:', title);

  // Try to get any visible text on the page
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Visible body text:', JSON.stringify(bodyText));

  // Check for canvas element (Three.js)
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      return { exists: true, width: canvas.width, height: canvas.height };
    }
    return { exists: false };
  });
  console.log('Canvas info:', JSON.stringify(canvasInfo));

  // Check DOM structure
  const domInfo = await page.evaluate(() => {
    const html = document.documentElement.outerHTML;
    return html.substring(0, 2000);
  });
  console.log('DOM (first 2000 chars):', domInfo);

  console.log('\n=== Console messages before key press ===');
  for (const msg of consoleMessages) {
    console.log(`  [${msg.type}] ${msg.text}`);
  }

  console.log('\n=== Page errors before key press ===');
  for (const err of pageErrors) {
    console.log(`  ERROR: ${err}`);
  }

  console.log('\n=== Failed requests ===');
  for (const req of failedRequests) {
    console.log(`  FAILED: ${req.url} - ${req.failure}`);
  }

  // Step 4: Press ArrowRight to start the game
  console.log('\n=== Step 4: Pressing ArrowRight key ===');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(2000);

  // Take second screenshot
  await page.screenshot({ path: 'screenshot-2-after-keypress.png', fullPage: true });
  console.log('Screenshot 2 saved: screenshot-2-after-keypress.png');

  // Press a few more keys to move the snake
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(1000);

  // Take third screenshot
  await page.screenshot({ path: 'screenshot-3-gameplay.png', fullPage: true });
  console.log('Screenshot 3 saved: screenshot-3-gameplay.png');

  console.log('\n=== ALL Console messages (final) ===');
  for (const msg of consoleMessages) {
    console.log(`  [${msg.type}] ${msg.text}`);
  }

  console.log('\n=== ALL Page errors (final) ===');
  for (const err of pageErrors) {
    console.log(`  ERROR: ${err}`);
  }

  if (pageErrors.length === 0 && consoleMessages.filter(m => m.type === 'error').length === 0) {
    console.log('  No errors detected!');
  }

  await browser.close();
  console.log('\n=== Test complete ===');
})();
