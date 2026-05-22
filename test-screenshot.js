const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  
  // Click the search bar
  await page.click('button:has-text("Search...")');
  await page.waitForTimeout(1000);
  
  await page.keyboard.type('bmw');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'test-screenshot.png' });
  console.log('Screenshot saved to test-screenshot.png');
  await browser.close();
})();
