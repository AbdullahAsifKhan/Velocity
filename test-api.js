const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const responses = [];
  page.on('response', response => {
    if (response.url().includes('/api/search/index')) {
      responses.push(response);
    }
  });

  await page.goto('http://localhost:3000');
  
  // Click the search bar
  await page.click('button:has-text("Search...")');
  await page.waitForTimeout(1000);
  
  if (responses.length > 0) {
    const json = await responses[0].json();
    console.log('SEARCH_INDEX_LENGTH:', json.length);
    if (json.length > 0) {
      console.log('FIRST_CAR:', json[0].name, json[0].brand);
    }
  } else {
    console.log('NO_API_REQUEST_MADE');
  }

  await browser.close();
})();
