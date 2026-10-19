import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';

const products = [
  {
    productName: 'Produto A',
    descriptionShort: 'Descrição A',
    photo: 'https://example.com/a.png',
    price: 15000,
  },
  {
    productName: 'Produto B',
    descriptionShort: 'Descrição B',
    photo: 'https://example.com/b.png',
    price: 9000,
  },
];
describe('integração da vitrine', () => {
  it('abre dados diferentes ao escolher produtos diferentes', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ success: true, products }) }),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      (await screen.findAllByRole('button', { name: 'Ver detalhes de Produto B' }))[0],
    );
    let dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading')).toHaveTextContent('Produto B');
    expect(within(dialog).getByText('Descrição B')).toBeVisible();
    await user.click(within(dialog).getByLabelText('Fechar modal'));
    await user.click(screen.getAllByRole('button', { name: 'Comprar Produto A' })[0]);
    dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading')).toHaveTextContent('Produto A');
    expect(within(dialog).getByText('Descrição A')).toBeVisible();
  });
  it('permite tentar novamente após uma falha', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new Error('Falha de rede'))
        .mockResolvedValue({ ok: true, json: async () => ({ success: true, products }) }),
    );
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(
      (await screen.findAllByRole('button', { name: 'Comprar Produto A' })).length,
    ).toBe(3);
  });
});
