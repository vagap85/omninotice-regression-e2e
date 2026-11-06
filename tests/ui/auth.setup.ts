import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // 1. Заходим на страницу логина
  await page.goto('/login');

  // 2. Ждем загрузки и заполняем форму по ПЛЕЙСХОЛДЕРАМ (видно на скриншотах)
  const loginInput = page.getByPlaceholder('example@omninotice');
  const passwordInput = page.getByPlaceholder('Введите пароль');

  await loginInput.fill(process.env.UI_LOGIN || 'test_dav@gmail.com');
  await passwordInput.fill(process.env.UI_PASSWORD || '12345678');
  
  // 3. Нажимаем "Войти"
  await page.getByRole('button', { name: 'Войти' }).click();

  // 4. Ждем, пока перекинет на главную (или в личный кабинет)
  // Ждем либо редиректа на главную, либо появления кнопки выхода/аватара
  await page.waitForURL('**/', { timeout: 15_000 });

  // 5. Сохраняем состояние (cookies + localStorage)
  await page.context().storageState({ path: authFile });
});