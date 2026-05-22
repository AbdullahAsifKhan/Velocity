const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER_ERROR:', error.message));

  await page.goto('http://localhost:3000');
  
  console.log('Clicking search bar...');
  // Click the search bar
  await page.click('button:has-text("Search...")');
  
  // Wait a bit to see if an error is thrown
  await page.waitForTimeout(2000);
  
  console.log('Typing in search bar...');
  await page.keyboard.type('bmw');
  
  await page.waitForTimeout(2000);
  console.log('Done.');
  await browser.close();
})();
