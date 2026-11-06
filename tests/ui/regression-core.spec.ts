import { test, expect } from '@playwright/test';

test.describe('Регресс - Дополнительные сценарии OmniNotice', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create/push');
    await page.waitForLoadState('networkidle');
    
    // Закрываем онбординг, если он есть
    const skipTourBtn = page.getByRole('button', { name: /Пропустить/i });
    if (await skipTourBtn.isVisible()) {
      await skipTourBtn.click({ force: true });
      await page.locator('.chakra-portal').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
  });

  // Вспомогательная функция для заполнения формы до валидного состояния
  async function fillValidForm(page: any) {
    // 1. Заполняем заголовок и текст
    await page.getByPlaceholder('Например, Вам назначена задача').fill('Тестовый заголовок', { force: true });
    await page.getByPlaceholder('Введите текст уведомления').fill('Тестовый текст', { force: true });
    
    // 2. Выбираем приложение (клик по combobox и выбор опции)
    // По YAML-снимку: combobox содержит текст "Выберите приложение"
    const appCombobox = page.getByRole('combobox').first();
    await appCombobox.click({ force: true });
    
    // Ждем появления опций и кликаем по первой
    const option = page.getByRole('option').first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click({ force: true });

    // 3. Ждем, пока активируется кнопка "Отправить"
    const submitBtn = page.getByRole('button', { name: 'Отправить' });
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
  }

  // REG-CORE-010 УДАЛЕН, так как в интерфейсе нет блока предпросмотра

  test('REG-CORE-012: Отмена подтверждения сохраняет форму', async ({ page }) => {
    // Заполняем валидную форму
    await fillValidForm(page);

    // Открываем модалку
    await page.getByRole('button', { name: 'Отправить' }).click({ force: true });
    
    const modal = page.locator('.chakra-modal__content');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Нажимаем "Отмена" (или крестик)
    const cancelBtn = modal.getByRole('button', { name: /Отмена|Закрыть/i });
    if (await cancelBtn.isVisible()) {
       await cancelBtn.click({ force: true });
    } else {
       // Если кнопки "Отмена" нет, закрываем через крестик
       await modal.locator('button[aria-label="Close"]').click({ force: true }).catch(() => {
          // Или кликаем по фону
          page.locator('.chakra-modal__overlay').click({ force: true });
       });
    }

    // Проверяем, что модалка закрылась, а текст остался в форме
    await expect(modal).toBeHidden({ timeout: 5000 });
    await expect(page.getByPlaceholder('Например, Вам назначена задача')).toHaveValue('Тестовый заголовок');
  });

  test('REG-CORE-023: Текст подтверждения не содержит слова "писем"', async ({ page }) => {
    // Заполняем валидную форму
    await fillValidForm(page);
    
    // Открываем модалку
    await page.getByRole('button', { name: 'Отправить' }).click({ force: true });
    const modal = page.locator('.chakra-modal__content');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Проверяем, что в модалке нет слова "писем"
    await expect(modal).not.toContainText(/писем/i);
    
    // Проверяем, что есть слова "уведомлен" или "получател"
    await expect(modal).toContainText(/уведомлен|получател/i);
  });
});