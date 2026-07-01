const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    await page.goto('http://localhost:8082/lam', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Page loaded');
  } catch (err) {
    console.error('Error loading page:', err);
  }
  
  await browser.close();
})();
