import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import RegisterPage from '../../src/pages/Register';

// Mock the AuthContext
const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock fetch for CEP lookup
global.fetch = vi.fn();

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('RegisterPage Basic Tests', () => {
  it('renders the registration form', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByText('Registre Seu Restaurante')).toBeInTheDocument();
  });

  it('shows step 1 content initially', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByText('Informações da Conta')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome Completo/)).toBeInTheDocument();
  });

  it('has pre-filled test data', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByDisplayValue('Flavio Ferreira')).toBeInTheDocument();
    expect(screen.getByDisplayValue('flavio_luiz_ferreira@hotmail.com')).toBeInTheDocument();
  });
});
