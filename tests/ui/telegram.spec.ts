import { test, expect } from '@playwright/test';

test.describe('Telegram рассылки', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create/telegram');
    await page.waitForLoadState('networkidle');
    
    const skipTourBtn = page.getByRole('button', { name: /Пропустить/i });
    if (await skipTourBtn.isVisible()) {
      await skipTourBtn.click({ force: true });
      await page.locator('.chakra-portal').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
  });

  test('REG-TG-006: Ошибка 503 (Service Unavailable) при отправке Telegram', async ({ page }) => {
    // 1. Мокаем ошибку 503
    await page.route('**/api/**/dispatches', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' }),
      });
    });

    // 2. Заполняем текст сообщения (клик по WYSIWYG-редактору и ввод текста)
    const messageEditor = page.getByPlaceholder('Введите текст сообщения');
    await messageEditor.click({ force: true });
    // Вводим текст с клавиатуры, так как это contenteditable div
    await page.keyboard.type('Тестовое сообщение для проверки 503');

    // 3. Нажимаем кнопку "Отправить"
    const submitBtn = page.getByRole('button', { name: 'Отправить' }).last();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click({ force: true });

    // 4. Ждем модалку "Подтверждение отправки"
    const modal = page.locator('.chakra-modal__content');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 5. Подтверждаем отправку в модалке
    const confirmBtn = modal.getByRole('button', { name: 'Отправить' });
    await confirmBtn.click({ force: true });

    // 6. Ждем, пока модалка закроется и появится ошибка
    await expect(modal).toBeHidden({ timeout: 5000 });
    await expect(page.getByText('При отправке произошла ошибка', { exact: false })).toBeVisible({ timeout: 10000 });

    // 7. Проверяем, что нет ложного тоста об успехе
    const successToast = page.locator('.chakra-toast').filter({ hasText: /успешно/i });
    await expect(successToast).toBeHidden({ timeout: 3000 });

    // 8. Проверяем кнопки "Отмена" и "Повторить"
    await expect(page.getByRole('button', { name: 'Отмена' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
  });
});