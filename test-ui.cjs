const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const issues = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      issues.push('Console: ' + msg.text().substring(0, 100));
    }
  });
  
  try {
    console.log('🔍 访问首页...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    console.log('🔍 检查欢迎界面...');
    const body = await page.textContent('body');
    
    // 检查关键元素
    const checks = {
      '标题': body.includes('DBForge'),
      '功能亮点': body.includes('智能浏览') || body.includes('SQL工坊'),
      'MySQL按钮': body.includes('MySQL'),
      'SQLite按钮': body.includes('SQLite') || body.includes('文件'),
    };
    
    console.log('\n📊 界面检查:');
    Object.entries(checks).forEach(([k, v]) => {
      console.log(`  ${v ? '✅' : '❌'} ${k}`);
    });
    
    // 检查功能亮点区域
    const features = await page.locator('[class*="feature"], [class*="highlight"], .card').count();
    console.log(`  功能卡片数量: ${features}`);
    
    // 检查连接弹窗
    console.log('\n🔍 测试连接弹窗...');
    const mysqlBtn = await page.getByText(/MySQL|连接/).first();
    if (mysqlBtn) {
      await mysqlBtn.click();
      await page.waitForTimeout(500);
      
      const modal = await page.locator('[class*="fixed"][class*="inset-0"]').first();
      const modalVisible = await modal.isVisible().catch(() => false);
      console.log(`  弹窗打开: ${modalVisible ? '✅' : '❌'}`);
      
      if (modalVisible) {
        const hasForm = await page.locator('input').count();
        console.log(`  表单输入框: ${hasForm} 个`);
        
        // 关闭弹窗
        const closeBtn = await page.locator('[class*="close"], [aria-label*="close"]').first();
        await closeBtn.click().catch(() => {});
      }
    }
    
    // 检查控制台错误
    console.log(`\n📊 控制台错误: ${issues.length === 0 ? '无 ✅' : issues.length + ' 个 ❌'}`);
    if (issues.length > 0) {
      issues.forEach(i => console.log('  -', i.substring(0, 80)));
    }
    
    // 检查性能
    console.log('\n📊 性能指标:');
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.fetchStart),
        loadComplete: Math.round(perf.loadEventEnd - perf.fetchStart),
      };
    });
    console.log(`  DOM加载: ${metrics.domContentLoaded}ms`);
    console.log(`  页面完成: ${metrics.loadComplete}ms`);
    
  } catch (e) {
    console.log('❌ 测试失败:', e.message);
  }
  
  await browser.close();
})();
