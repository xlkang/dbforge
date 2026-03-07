const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  // 查找所有按钮
  const buttons = await page.$$('button');
  console.log('按钮数量:', buttons.length);
  
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && text.includes('MySQL')) {
      console.log('找到MySQL按钮:', text.trim());
      await btn.click();
      await page.waitForTimeout(1000);
      
      // 检查弹窗
      const modal = await page.$('[class*="modal"], [role="dialog"]');
      console.log('弹窗状态:', modal ? '已打开' : '未打开');
      
      // 检查页面内容
      const body = await page.textContent('body');
      console.log('包含host:', body.includes('host') || body.includes('主机'));
      console.log('包含port:', body.includes('port') || body.includes('端口'));
      break;
    }
  }
  
  await browser.close();
})();
