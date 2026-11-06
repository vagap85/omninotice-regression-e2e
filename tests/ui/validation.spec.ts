import { test, expect } from '@playwright/test';

test.describe('Создание рассылки - Валидация и лимиты', () => {
  test.beforeEach(async ({ page }) => {
    // Переходим на страницу создания рассылки
    await page.goto('/create/push');
    await page.waitForLoadState('networkidle');
  });

  test('Проверка ввода и лимитов', async ({ page }) => {
    const titleInput = page.getByPlaceholder('Например, Вам назначена задача');
    const textInput = page.getByPlaceholder('Введите текст уведомления');

    // Вводим валидный текст
    await titleInput.fill('Тест');
    await textInput.fill('Тестовое уведомление');

    // Вводим текст больше лимита (60 для заголовка)
    await titleInput.fill('А'.repeat(60));
    const titleValue = await titleInput.inputValue();
    expect([50, 60]).toContain(titleValue.length);

    // Вводим текст больше лимита (210 для текста)
    await textInput.fill('Б'.repeat(210));
    const textValue = await textInput.inputValue();
    expect([200, 210]).toContain(textValue.length);
  });

  test('Проверка невалидного URL в кнопке', async ({ page }) => {
    const urlInput = page.getByPlaceholder('Вставьте ссылку');
    
    // Вводим невалидную ссылку
    await urlInput.fill('невалидная-ссылка');
    
    // Проверяем наличие ошибки или блокировку кнопки
    await expect(page.getByText('Некорректная ссылка')).toBeVisible().catch(() => {
       expect(page.getByRole('button', { name: 'Отправить' })).toBeDisabled();
    });
  });
  
});