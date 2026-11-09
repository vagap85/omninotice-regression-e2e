import { test, expect } from '@playwright/test';

test.describe('История рассылок', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/push/history');
    await page.waitForLoadState('networkidle');
    
    const skipTourBtn = page.getByRole('button', { name: /Пропустить/i });
    if (await skipTourBtn.isVisible()) {
      await skipTourBtn.click({ force: true });
      await page.locator('.chakra-portal').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
  });

  // ВНИМАНИЕ: Тесты заскипаны, так как раздел "История" временно закрыт на фронтенде.
  // Как только фронт восстановят — убрать .skip и проверить селекторы.

  test.skip('Отображение статусов и фильтров', async ({ page }) => {
    await expect(page.locator('table, .chakra-table')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Сбросить фильтры')).toBeVisible();
    const appFilter = page.getByRole('button', { name: /Все прило/i });
    await expect(appFilter).toBeVisible();
  });

  test.skip('Проверка тултипа при ошибке', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const errorStatus = page.getByText('ошибка').first();
    if (await errorStatus.isVisible()) {
      await errorStatus.hover();
      await expect(page.locator('.chakra-tooltip')).toBeVisible({ timeout: 3000 });
    } else {
      console.log('Строка с ошибкой не найдена в истории');
    }
  });

  test.skip('Сортировка по дате', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table, .chakra-table')).toBeVisible({ timeout: 10000 });
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();
    const dateCell = firstRow.locator('td').nth(4);
    const firstDate = await dateCell.textContent();
    expect(firstDate).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });
});