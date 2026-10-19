import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProductModal } from '../src/components/ProductModal';

const product = {
  productName: 'IPHONE 13 MINI 2',
  descriptionShort: 'Descrição do produto selecionado',
  photo: 'https://example.com/phone.png',
  price: 12000,
};

describe('modal de produto', () => {
  it('exibe as informações do produto selecionado e permite comprar a quantidade escolhida', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<ProductModal product={product} onAdd={onAdd} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toHaveAccessibleName(product.productName);
    expect(screen.getByText(product.descriptionShort)).toBeVisible();
    expect(screen.getByRole('img')).toHaveAttribute('src', product.photo);
    expect(screen.getByLabelText('Diminuir quantidade')).toBeDisabled();
    await user.click(screen.getByLabelText('Aumentar quantidade'));
    expect(screen.getByLabelText('Quantidade selecionada')).toHaveTextContent('02');
    await user.click(screen.getByRole('button', { name: 'Comprar' }));
    expect(onAdd).toHaveBeenCalledWith(2);
    expect(onClose).toHaveBeenCalledOnce();
  });
  it('fecha por botão, cancelamento nativo (Escape) e clique no fundo', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProductModal product={product} onAdd={vi.fn()} onClose={onClose} />);
    await user.click(screen.getByLabelText('Fechar modal'));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
  it('restaura o scroll e o foco do elemento que abriu o modal', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const { unmount } = render(
      <ProductModal product={product} onAdd={vi.fn()} onClose={vi.fn()} />,
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
