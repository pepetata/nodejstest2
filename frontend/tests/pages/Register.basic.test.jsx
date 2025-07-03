import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import RegisterPage from '../../src/pages/Register';

// Mock the AuthContext and useAuth hook
const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../src/contexts/AuthContext', () => ({
  AuthContext: React.createContext(),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    loading: false,
    error: null,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
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

  it('starts with empty form fields', () => {
    renderWithRouter(<RegisterPage />);
    // Verify that all required fields start empty (correct behavior for production)
    expect(screen.getByLabelText(/Nome Completo/)).toHaveValue('');
    expect(screen.getByLabelText(/Endereço de Email/)).toHaveValue('');
    expect(screen.getByLabelText(/Número de Telefone/)).toHaveValue('');
    expect(screen.getByLabelText('Senha *')).toHaveValue('');
    expect(screen.getByLabelText('Confirmar Senha *')).toHaveValue('');
  });
});
