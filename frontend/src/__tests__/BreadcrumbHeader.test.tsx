import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BreadcrumbHeader } from '../components/workspace/BreadcrumbHeader';
import { MantineProvider } from '@mantine/core';

const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('BreadcrumbHeader Navigation', () => {
  const parentChain = [
    { id: 'w1', name: 'World 1', description: 'Desc', type: 'world' as const },
    { id: 'c1', name: 'Country 1', description: 'Desc', type: 'country' as const }
  ];

  const entity = { id: 'ct1', name: 'City 1', description: 'Desc', type: 'city' as const, population: '100', parentId: 'c1' };

  it('renders the parent chain and current entity name safely', () => {
    render(
      <MantineProvider>
        <BrowserRouter>
          <BreadcrumbHeader entity={entity} parentChain={parentChain} />
        </BrowserRouter>
      </MantineProvider>
    );
    expect(screen.getByText('World 1')).toBeInTheDocument();
    expect(screen.getByText('City 1')).toBeInTheDocument();
  });

  it('navigates to the immediate parent correctly on back arrow click', () => {
    render(
      <MantineProvider>
        <BrowserRouter>
          <BreadcrumbHeader entity={entity} parentChain={parentChain} />
        </BrowserRouter>
      </MantineProvider>
    );

    const backButton = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(backButton);
    expect(mockedNavigate).toHaveBeenCalledWith('/view/country/c1');
  });

  it('navigates cleanly to the root / if there is no parent chain', () => {
    render(
      <MantineProvider>
        <BrowserRouter>
          <BreadcrumbHeader entity={parentChain[0]} parentChain={[]} />
        </BrowserRouter>
      </MantineProvider>
    );
    const backButton = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(backButton);
    expect(mockedNavigate).toHaveBeenCalledWith('/');
  });
});
