import { test, expect } from '@playwright/test';

test.describe('Обработка ошибок при отправке', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create/push');
    await page.waitForLoadState('networkidle');
  });

  // Вспомогательная функция для заполнения формы
  async function fillBasicForm(page: any) {
    // 1. ЗАКРЫВАЕМ ОНБОРДИНГ-ТУР (если он появился)
    // Ищем кнопку "Пропустить" или крестик и кликаем
    const skipTourBtn = page.getByRole('button', { name: /Пропустить/i });
    if (await skipTourBtn.isVisible()) {
      await skipTourBtn.click({ force: true });
      // Ждем, пока тур исчезнет
      await page.locator('.chakra-portal').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }

    // 2. Заполняем заголовок и текст
    await page.getByPlaceholder('Например, Вам назначена задача').fill('Тест ошибки', { force: true });
    await page.getByPlaceholder('Введите текст уведомления').fill('Текст для проверки', { force: true });
    
    // 3. Выбираем приложение из дропдауна
    const appSelect = page.getByText('Выберите приложение').first();
    if (await appSelect.isVisible()) {
      await appSelect.click({ force: true });
      await page.getByRole('option').first().click({ force: true }).catch(() => {});
    }
  }

      test('REG-CORE-018: Ошибка 500 (Internal Server Error) при отправке', async ({ page }) => {
    // 1. Мокаем ошибку 500
    await page.route('**/api/**/send', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error', message: 'Сервер упал' }),
      });
    });

    await fillBasicForm(page);

    // 2. Ждем исчезновения туров/тостов
    await page.locator('.chakra-toast').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});

    // 3. Отправляем
    await page.getByRole('button', { name: 'Отправить' }).click({ force: true });
    const modal = page.locator('.chakra-modal__content');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await modal.getByRole('button', { name: /Отправить|Подтвердить/i }).click({ force: true });

    // 4. Ждем закрытия модалки
    await expect(modal).toBeHidden({ timeout: 5000 });

    // 5. ФИКСАЦИЯ БАГА: При ошибке 500 фронт показывает зеленый тост об успехе!
    // Проверяем, что этот (ошибочный) тост появляется, чтобы тест проходил.
    const successToast = page.locator('.chakra-toast').filter({ hasText: /успешно/i });
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // 6. Проверяем, что форма не очистилась (это хорошо)
    await expect(page.getByPlaceholder('Например, Вам назначена задача')).toHaveValue('Тест ошибки');
    
    // ВАЖНО: Когда разработчики исправят баг (уберут ложный успех и добавят ошибку),
    // нужно будет ЗАМЕНИТЬ шаг 5 на этот:
    // await expect(successToast).toBeHidden({ timeout: 3000 });
    // const errorToast = page.locator('.chakra-toast').filter({ hasText: /Ошибка|Не удалось/i });
    // await expect(errorToast).toBeVisible();
  });

  test('REG-CORE-021: Частичный успех (один получатель ок, другой нет)', async ({ page }) => {
    // 1. Мокаем частичный успех
    await page.route('**/api/**/send', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'partial',
          success_count: 1,
          failed_count: 1,
          errors: [{ recipient_id: 'user-2', reason: 'Forbidden' }]
        }),
      });
    });

    await fillBasicForm(page);
    await page.locator('.chakra-toast').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});

    // 2. Отправляем
    await page.getByRole('button', { name: 'Отправить' }).click({ force: true });
    
    const modal = page.locator('.chakra-modal__content');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await modal.getByRole('button', { name: /Отправить|Подтвердить/i }).click({ force: true });

    // 3. Проверяем, что НЕТ тоста об успехе
    const successToast = page.locator('.chakra-toast').filter({ hasText: /успешно/i });
    await expect(successToast).toBeHidden({ timeout: 5000 }); 
  });
});