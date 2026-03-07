const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const issues = [];
  const checks = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      issues.push('Console Error: ' + msg.text().substring(0, 150));
    }
  });
  
  page.on('pageerror', err => {
    issues.push('Page Error: ' + err.message.substring(0, 150));
  });
  
  try {
    console.log('🔍 测试 1: 首页加载');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    checks.push({ name: '首页加载', pass: true });
    
    console.log('🔍 测试 2: UI 元素检查');
    const hasTitle = await page.textContent('body').then(t => t.includes('DBForge'));
    const hasDropzone = await page.$('.dropzone, [class*="drop"], input[type="file"]');
    checks.push({ name: '标题显示', pass: hasTitle });
    checks.push({ name: '文件上传区域', pass: !!hasDropzone });
    
    console.log('🔍 测试 3: MySQL 连接按钮');
    const mysqlBtn = await page.getByText(/MySQL|连接/i).first();
    const hasMysqlBtn = !!mysqlBtn;
    checks.push({ name: 'MySQL连接按钮', pass: hasMysqlBtn });
    
    console.log('🔍 测试 4: 功能亮点区域');
    const features = await page.$$('[class*="feature"], [class*="highlight"], .card, .feature-card');
    checks.push({ name: '功能亮点区域', pass: features.length > 0 });
    
    console.log('🔍 测试 5: 点击 MySQL 连接');
    if (hasMysqlBtn) {
      await mysqlBtn.click();
      await page.waitForTimeout(500);
      const modal = await page.$('[class*="modal"], [class*="dialog"]');
      checks.push({ name: '连接弹窗打开', pass: !!modal });
      
      // 关闭弹窗
      const closeBtn = await page.$('[class*="close"], [aria-label="close"]');
      if (closeBtn) await closeBtn.click();
    }
    
    console.log('🔍 测试 6: 检查控制台错误');
    await page.waitForTimeout(1000);
    checks.push({ name: '无控制台错误', pass: issues.length === 0 });
    
    if (issues.length > 0) {
      console.log('\n❌ 发现问题:');
      issues.forEach(i => console.log('  -', i.substring(0, 100)));
    }
    
    console.log('\n📊 检查结果:');
    checks.forEach(c => {
      console.log(`${c.pass ? '✅' : '❌'} ${c.name}`);
    });
    
    const passCount = checks.filter(c => c.pass).length;
    console.log(`\n总计: ${passCount}/${checks.length} 通过`);
    
  } catch (e) {
    console.log('❌ 测试失败:', e.message);
  }
  
  await browser.close();
})();
