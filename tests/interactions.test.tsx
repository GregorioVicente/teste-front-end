import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { ProductShelf } from '../src/components/ProductShelf';
import { ProductCard } from '../src/components/ProductCard';

const products = [
  {
    productName: 'Celular Alpha',
    descriptionShort: 'Alpha',
    photo: 'https://example.com/alpha.png',
    price: 100,
  },
  {
    productName: 'Celular Beta',
    descriptionShort: 'Beta',
    photo: 'https://example.com/beta.png',
    price: 200,
  },
];
function mockProducts() {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ success: true, products }) }),
  );
}

describe('busca, filtros e apresentação', () => {
  it('busca ao enviar, informa ausência e restaura ao limpar', async () => {
    mockProducts();
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<App />);
    await screen.findAllByRole('button', { name: 'Comprar Celular Alpha' });
    const input = screen.getByRole('searchbox');
    await user.type(input, '  BETA  ');
    await user.click(screen.getByRole('button', { name: 'Pesquisar' }));
    expect(
      screen.queryByRole('button', { name: 'Comprar Celular Alpha' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Comprar Celular Beta' })).toHaveLength(
      3,
    );
    await user.clear(input);
    await user.type(input, 'inexistente');
    await user.keyboard('{Enter}');
    expect(screen.getAllByText(/Nenhum produto encontrado/)).toHaveLength(3);
    await user.clear(input);
    expect(screen.getAllByRole('button', { name: 'Comprar Celular Alpha' })).toHaveLength(
      3,
    );
  });
  it('explica categorias indisponíveis e permite voltar ou ver todos', async () => {
    const user = userEvent.setup();
    vi.spyOn(Element.prototype, 'scrollTo').mockImplementation(() => {});
    render(<ProductShelf products={products} onSelect={vi.fn()} tabs />);
    for (const category of ['Acessórios', 'Tablets', 'Notebooks', 'TVs']) {
      await user.click(screen.getByRole('button', { name: category }));
      expect(screen.getByRole('status')).toHaveTextContent(
        `${category}: categoria indisponível`,
      );
      expect(
        screen.queryByRole('button', { name: 'Próximos produtos' }),
      ).not.toBeInTheDocument();
    }
    await user.click(screen.getByRole('button', { name: 'Ver celulares' }));
    expect(screen.getByRole('button', { name: 'Celular' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Ver todos' }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
  it('expande e recolhe a grade de produtos', async () => {
    const user = userEvent.setup();
    render(<ProductShelf products={products} onSelect={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Ver todos' }));
    expect(screen.getByRole('list')).toHaveClass('shelf__rail--expanded');
    expect(screen.getByRole('button', { name: 'Recolher produtos' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(
      screen.queryByRole('button', { name: 'Próximos produtos' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Recolher produtos' }));
    expect(screen.getByRole('list')).not.toHaveClass('shelf__rail--expanded');
  });
  it('mostra cartões de carregamento até a resposta', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );
    render(<App />);
    const status = screen.getByRole('status', { name: 'Carregando produtos' });
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(within(status).getByRole('list', { hidden: true }).children).toHaveLength(4);
  });
  it('substitui a foto com falha por imagem local sem repetir a URL quebrada', () => {
    render(<ProductCard product={products[0]} onSelect={vi.fn()} />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', '/assets/product-placeholder.svg');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', '/assets/product-placeholder.svg');
  });
});
