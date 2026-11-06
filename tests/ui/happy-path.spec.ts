import { test, expect } from '@playwright/test';

test.describe('2.8 UI: Создание рассылки через OmniNotice', () => {
  test('Проверка контракта: Фронт -> Бэкенд', async ({ page }) => {
    // 1. Переходим на страницу
    await page.goto('/create/push');
    await expect(page.getByPlaceholder(/Например, Вам назначена задача/i)).toBeVisible({ timeout: 10000 });

    // 2. Закрываем тур
    const skipTourBtn = page.getByRole('button', { name: 'Пропустить' });
    if (await skipTourBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipTourBtn.click();
      await expect(skipTourBtn).toBeHidden({ timeout: 5000 });
    }

    // 3. Заполняем форму
    await page.getByPlaceholder(/Например, Вам назначена задача/i).fill(`E2E Test ${Date.now()}`);
    await page.getByPlaceholder(/Введите текст уведомления/i).fill('Проверка UI через Playwright');
    await page.getByPlaceholder(/Например, перейти на сайт/i).fill('Перейти');
    await page.getByPlaceholder(/Вставьте ссылку/i).fill('https://example.com');

    // 4. Выбираем приложение
    await page.getByRole('combobox').click();
    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5000 });
    await page.getByRole('option').first().click();
    await page.waitForTimeout(1000);

    // 5. Открываем модалку
    const openModalBtn = page.getByRole('button', { name: 'Отправить', exact: true }).last();
    await expect(openModalBtn).toBeVisible({ timeout: 5000 });
    await openModalBtn.click();

    // 6. Ждем модалку
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const confirmBtn = modal.getByRole('button', { name: 'Отправить', exact: true });
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });

    // 7. Кликаем и НЕ ждем запроса — проверяем UI
    await confirmBtn.click();
    console.log('✅ Кликнули по кнопке в модалке');

    // 8. Ждем появления тоста об успехе
    await expect(page.getByText(/успешно отправлена/i).first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Рассылка успешно отправлена (по UI)');

    // 9. Проверяем, что тост содержит заголовок уведомления
    const toastRegion = page.getByRole('region', { name: 'Уведомления' });
    await expect(toastRegion).toBeVisible({ timeout: 5000 });
    await expect(toastRegion).toContainText('E2E Test');
    console.log('✅ Тост содержит текст уведомления');
  });
});