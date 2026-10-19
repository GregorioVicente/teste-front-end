import { expect, test } from '@playwright/test';

test('produtos reais, modal, teclado, quantidade e carrinho', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /^Ver detalhes de/ }).first(),
  ).toBeVisible({ timeout: 20000 });
  const trigger = page.getByRole('button', { name: /^Ver detalhes de/ }).nth(1);
  const name = (await trigger.getAttribute('aria-label'))!.replace(
    'Ver detalhes de ',
    '',
  );
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAccessibleName(name);
  await dialog.getByLabel('Aumentar quantidade').click();
  await expect(dialog.getByLabel('Quantidade selecionada')).toHaveText('02');
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    expect(
      await dialog.evaluate((element) => element.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Comprar', exact: true })
    .click();
  await expect(page.getByLabel('Carrinho com 1 itens')).toBeVisible();
});

test('layout sem overflow horizontal no celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /^Ver detalhes de/ }).first(),
  ).toBeVisible({ timeout: 20000 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await page
    .getByRole('button', { name: /^Ver detalhes de/ })
    .first()
    .click();
  const bounds = await page.getByRole('dialog').boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(390);
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Comprar', exact: true }),
  ).toBeVisible();
});

test('setas movem a vitrine e Ver todos expande os produtos', async ({ page }) => {
  await page.route('**/api/products', (route) =>
    route.fulfill({
      json: {
        success: true,
        products: Array.from({ length: 8 }, (_, index) => ({
          productName: `Celular ${index + 1}`,
          descriptionShort: 'Produto de teste',
          price: 100 + index,
          photo: 'http://127.0.0.1:5173/assets/product-placeholder.svg',
        })),
      },
    }),
  );
  await page.goto('/');
  const shelf = page.getByRole('region', { name: 'Produtos relacionados' }).first();
  const rail = shelf.getByRole('list');
  await shelf.getByRole('button', { name: 'Próximos produtos' }).click();
  await expect
    .poll(() => rail.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(100);
  const moved = await rail.evaluate((element) => element.scrollLeft);
  await shelf.getByRole('button', { name: 'Produtos anteriores' }).click();
  await expect
    .poll(() => rail.evaluate((element) => element.scrollLeft))
    .toBeLessThan(moved - 100);
  const second = page.getByRole('region', { name: 'Produtos relacionados' }).nth(1);
  await second.getByRole('button', { name: 'Ver todos', exact: true }).click();
  await expect(second.getByRole('list')).toHaveClass(/shelf__rail--expanded/);
  await expect(second.getByRole('button', { name: 'Próximos produtos' })).toHaveCount(0);
  await second.getByRole('button', { name: 'Recolher produtos' }).click();
  await expect(second.getByRole('button', { name: 'Próximos produtos' })).toBeVisible();
});
