import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  await page.goto('http://localhost:5173');
  
  // login
  await page.type('input[type="text"]', '001');
  await page.type('input[type="password"]', 'ajay@124');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 1000));
  
  // click 'My Clients' card
  const cards = await page.$$('.card');
  for (const card of cards) {
    const text = await page.evaluate(el => el.innerText, card);
    if (text.includes('My Clients')) {
      await card.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
