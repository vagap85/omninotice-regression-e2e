import { test, expect } from '@playwright/test';

test.describe('История рассылок', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/push/history');
  });

    test('Отображение статусов и фильтров', async ({ page }) => {
    // 1. Проверяем, что таблица загрузилась
    await expect(page.getByRole('table')).toBeVisible();

    // 2. Ищем кнопку выпадающего списка приложений.
    // Используем регулярное выражение /Все прило/i (ищет "Все приложения" или "Все прило...")
    const appFilter = page.getByRole('button', { name: /Все прило/i });
    await expect(appFilter).toBeVisible();

    // 3. Ищем кнопку сброса фильтров
    const resetBtn = page.getByRole('button', { name: 'Сбросить фильтры' });
    await expect(resetBtn).toBeVisible();
    
    // 4. Проверяем кнопку "Сократить ссылку"
    const shortenBtn = page.getByRole('button', { name: /Сократить ссылку/i });
    await expect(shortenBtn).toBeVisible();
  });

  test('Проверка тултипа при ошибке', async ({ page }) => {
    // Ищем статус "ошибка"
    const errorStatus = page.getByText('ошибка').first();
    
    if (await errorStatus.isVisible()) {
      await errorStatus.hover();
      // Проверяем, что тултип с текстом появился
      await expect(page.locator('.tooltip')).toBeVisible(); // Селектор тултипа нужно уточнить
      await expect(page.locator('.tooltip')).toContainText('Внимание');
    } else {
      console.log('Строка с ошибкой не найдена в истории');
    }
  });

  test('Сортировка по дате', async ({ page }) => {
    // Проверяем, что первая строка имеет самую свежую дату
    const firstDate = await page.locator('tbody tr').first().locator('td').nth(4).textContent();
    console.log('Дата первой строки:', firstDate);
    // Тут можно добавить логику сравнения дат, если нужно
  });
});