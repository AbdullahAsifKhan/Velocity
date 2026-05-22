const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  
  // Click the search bar
  await page.click('button:has-text("Search...")');
  await page.waitForTimeout(500);
  
  await page.keyboard.type('bmw');
  await page.waitForTimeout(500);
  
  // Check the value of the input
  const inputValue = await page.$eval('input[cmdk-input]', el => el.value);
  console.log('INPUT_VALUE:', inputValue);
  
  // Check if any results showed up
  const items = await page.$$eval('[cmdk-item]', els => els.map(el => el.textContent));
  console.log('CMDK_ITEMS:', items);
  
  // Check if popular brands are visible
  const brandsVisible = await page.$eval('.p-2.space-y-6', el => {
     const style = window.getComputedStyle(el);
     return style.display !== 'none' && style.visibility !== 'hidden';
  }).catch(() => false);
  console.log('BRANDS_VISIBLE:', brandsVisible);

  await browser.close();
})();
