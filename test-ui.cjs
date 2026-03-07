const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    errors.push('PAGE: ' + err.message);
  });
  
  try {
    console.log('🔍 加载首页...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // 检查是否有错误
    if (errors.length > 0) {
      console.log('❌ 发现错误:');
      errors.forEach(e => console.log('  -', e.substring(0, 100)));
    } else {
      console.log('✅ 首页加载正常');
    }
    
    // 检查关键UI元素
    const hasUpload = await page.$('input[type="file"]');
    console.log('✅ 文件上传:', hasUpload ? '存在' : '缺失');
    
    const bodyText = await page.textContent('body');
    const hasWelcome = bodyText.includes('欢迎') || bodyText.includes('Welcome') || bodyText.includes('Connect');
    console.log('✅ 欢迎界面:', hasWelcome ? '正常' : '异常');
    
  } catch (e) {
    console.log('❌ 测试失败:', e.message);
  }
  
  await browser.close();
})();
