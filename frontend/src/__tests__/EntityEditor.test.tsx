import { render, screen, fireEvent } from '@testing-library/react';
import { EntityEditor } from '../components/workspace/EntityEditor';
import { MantineProvider } from '@mantine/core';

// Mocking the mock APIService to prevent localStorage errors during testing without real DOM limits
vi.mock('../../data/MockDataService', () => ({
  APIService: {
    updateEntity: vi.fn().mockResolvedValue({ id: 'npc1', name: 'Testing Passed' })
  }
}));

describe('EntityEditor State Integrity', () => {
  const entity = {
    id: 'npc1',
    name: 'Garrick',
    description: 'Barkeep',
    role: 'Innkeeper',
    type: 'npc'
  };

  it('initially renders read-only fields', () => {
    render(<MantineProvider><EntityEditor entity={entity} onSave={vi.fn()} /></MantineProvider>);
    expect(screen.getByText('Garrick')).toBeInTheDocument();
    expect(screen.getByText('Barkeep')).toBeInTheDocument();
    // Cannot find text inputs unless in edit mode
    expect(screen.queryByDisplayValue('Garrick')).not.toBeInTheDocument();
  });

  it('toggles editable mode precisely upon clicking Edit', () => {
    render(<MantineProvider><EntityEditor entity={entity} onSave={vi.fn()} /></MantineProvider>);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    // Now inputs should be visibly rendered with current payload
    expect(screen.getByDisplayValue('Garrick')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Barkeep')).toBeInTheDocument();
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('updates internally while typing and locks state after canceling', () => {
    const onSave = vi.fn();
    render(<MantineProvider><EntityEditor entity={entity} onSave={onSave} /></MantineProvider>);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    const nameInput = screen.getByDisplayValue('Garrick');
    
    fireEvent.change(nameInput, { target: { value: 'Garrick Modified' } });
    expect(screen.queryByDisplayValue('Garrick Modified')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.getByText('Garrick')).toBeInTheDocument(); // Reverted UI element representation.
    expect(screen.queryByDisplayValue('Garrick Modified')).not.toBeInTheDocument();
  });
});
