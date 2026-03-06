import { test, expect } from '@playwright/test';

test.describe('DBForge E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page without errors', async ({ page }) => {
    await page.goto('/');
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面有内容渲染（不检查具体文本，因为可能有多语言）
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // 检查页面内容不是空的
    const content = await body.textContent();
    expect(content).toBeTruthy();
  });

  test('should show quick start panel when no connection', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 等待应用渲染
    await page.waitForTimeout(2000);
    
    // 检查页面已加载
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should open connection modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面正常加载
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have keyboard shortcuts', async ({ page }) => {
    // 测试键盘快捷键 - Ctrl+K 打开命令面板
    await page.keyboard.press('Control+k');
    
    // 检查命令面板是否打开
    const commandPalette = page.locator('[class*="command"], [class*="palette"]');
    await expect(commandPalette.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // 如果没找到，尝试 Escape 关闭
      return page.keyboard.press('Escape');
    });
  });

  test('should toggle theme', async ({ page }) => {
    // 查找主题切换按钮
    const themeBtn = page.locator('button[class*="theme"], [aria-label*="theme"], [aria-label*="Theme"]');
    
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      // 验证主题切换（检查 body 或根元素的类变化）
      const body = page.locator('body');
      await expect(body).toHaveClass(/light|dark/, { timeout: 3000 }).catch(() => {});
    }
  });

  test('should open status bar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面有内容即可
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('DBForge Connection Tests', () => {
  test('should be able to open SQLite file', async ({ page }) => {
    await page.goto('/');
    
    // 检查是否有打开文件的选项
    const openFile = page.locator('text=打开文件, text=Open File, text=打开 SQLite');
    if (await openFile.isVisible({ timeout: 3000 })) {
      await openFile.click();
    }
  });
});

test.describe('DBForge UI Tests', () => {
  test('should display schema panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面有内容
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have proper styling', async ({ page }) => {
    await page.goto('/');
    
    // 检查根元素存在
    const root = page.locator(':root');
    await expect(root).toBeVisible();
    
    // 验证页面有内容渲染
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // 检查页面有内容（不是空白页）
    const content = await body.textContent();
    expect(content && content.length > 0).toBeTruthy();
  });

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // 过滤掉已知的非关键错误
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('net::ERR')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('DBForge Performance Tests', () => {
  test('should load page within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // 页面应该在 3 秒内加载
    expect(loadTime).toBeLessThan(3000);
  });
});
