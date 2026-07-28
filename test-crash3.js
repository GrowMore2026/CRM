import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  await page.type('input[type="text"]', '001');
  await page.type('input[type="password"]', 'ajay@124');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));
  
  // click 'My Clients'
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card'));
    const card = cards.find(c => c.innerText.includes('My Clients'));
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // click first 'Edit' button
  await page.evaluate(() => {
    const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText === 'Edit');
    if (editBtn) editBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // set company
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const companyInput = inputs.find(i => i.placeholder === 'Company');
    if (companyInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(companyInput, 'Testing Company');
      companyInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // click 'Save'
  await page.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText === 'Save');
    if (saveBtn) saveBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
