import { describe, expect, it, vi } from 'vitest';
import { formatPrice, getProducts, PRODUCTS_PATH } from '../src/services/products';

const product = {
  productName: 'iPhone',
  descriptionShort: 'Descrição',
  photo: 'https://example.com/phone.png',
  price: 1499.9,
};

describe('serviço de produtos', () => {
  it('consulta o endpoint exigido e preserva nomes, preços e imagens', async () => {
    const request = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, products: [product] }),
    });
    vi.stubGlobal('fetch', request);
    const controller = new AbortController();
    expect(await getProducts(controller.signal)).toEqual([product]);
    expect(request).toHaveBeenCalledWith(PRODUCTS_PATH, { signal: controller.signal });
  });
  it('informa falhas HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(getProducts()).rejects.toThrow('Não foi possível carregar');
  });
  it.each([
    { success: true, products: [{ ...product, price: '1499' }] },
    { success: true, products: [{ ...product, price: -1 }] },
    { success: true, products: [{ ...product, photo: 'javascript:alert(1)' }] },
    { success: false, products: [product] },
  ])('rejeita um contrato inválido: %j', async (data) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => data }),
    );
    await expect(getProducts()).rejects.toThrow('dados de produtos inválidos');
  });
  it('formata reais com centavos, sem alterar a unidade do JSON', () => {
    expect(formatPrice(1499.9).replace(/\s/g, ' ')).toBe('R$ 1.499,90');
  });
});
