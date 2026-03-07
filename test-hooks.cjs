const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text().substring(0, 200));
    }
  });
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles('./test.db');
    console.log('文件已选择');
    await page.waitForTimeout(2000);
  } else {
    console.log('未找到文件输入');
  }
  
  console.log('=== 测试查询执行 ===');
  const cmContent = await page.$('.cm-content');
  if (cmContent) {
    await cmContent.click();
    await page.keyboard.type('SELECT * FROM users LIMIT 3');
    await page.waitForTimeout(500);
    
    const runBtn = await page.$('button:has-text("运行")');
    if (runBtn) {
      await runBtn.click();
      await page.waitForTimeout(3000);
    }
  }
  
  const errorText = await page.textContent('body');
  console.log('Has error:', errorText.includes('Something went wrong') || errorText.includes('hooks'));
  
  await browser.close();
})();
