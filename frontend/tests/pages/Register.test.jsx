import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import RegisterPage from '../../src/pages/Register';

// Mock dependencies
const mockRegister = vi.fn();
const mockNavigate = vi.fn();

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

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock window.scrollTo
global.scrollTo = vi.fn();

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Helper to fill form data
const fillStep1Data = async (user) => {
  await user.type(screen.getByLabelText(/nome completo/i), 'João Silva');
  await user.type(screen.getByLabelText(/endereço de email/i), 'joao@example.com');
  await user.type(screen.getByLabelText(/número de telefone/i), '11999887766');
  await user.type(screen.getByLabelText('Senha *'), 'password123');
  await user.type(screen.getByLabelText('Confirmar Senha *'), 'password123');
};

const fillStep2Data = async (user) => {
  await user.type(screen.getByLabelText(/nome do restaurante/i), 'Restaurante Teste');
  await user.type(screen.getByLabelText(/nome para url/i), 'restaurante-teste');
  await user.selectOptions(screen.getByLabelText(/tipo de culinária/i), 'Italian');
};

describe('RegisterPage', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    fetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render and Navigation', () => {
    it('renders the registration form with step 1 initially', () => {
      renderWithRouter(<RegisterPage />);

      expect(screen.getByText('Informações da Conta')).toBeInTheDocument();
      expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/endereço de email/i)).toBeInTheDocument();
    });

    it('shows progress bar with correct step highlighted', () => {
      renderWithRouter(<RegisterPage />);

      const activeStep = screen.getByText('1');
      expect(activeStep.parentElement).toHaveClass('active');
    });

    it('scrolls to top on component mount', () => {
      renderWithRouter(<RegisterPage />);

      expect(global.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('Form Auto-save and Recovery', () => {
    it('saves form data to localStorage on changes', async () => {
      renderWithRouter(<RegisterPage />);

      await user.type(screen.getByLabelText(/nome completo/i), 'João Silva');

      await waitFor(
        () => {
          expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'registerFormData',
            expect.stringContaining('João Silva')
          );
        },
        { timeout: 2000 }
      );
    });

    it('loads saved form data from localStorage on mount', async () => {
      const savedData = JSON.stringify({
        ownerName: 'João Saved',
        email: 'saved@example.com',
        locations: [{ id: 1, phone: '', address: { zipCode: '' } }],
      });
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'registerFormData') return savedData;
        if (key === 'registerCurrentStep') return '1'; // Load on step 1 where ownerName field exists
        return null;
      });

      renderWithRouter(<RegisterPage />);

      // Wait for the form to hydrate
      await waitFor(() => {
        expect(screen.getByDisplayValue('João Saved')).toBeInTheDocument();
      });
    });
  });

  describe('Step 1 - Account Information', () => {
    it('validates required fields before proceeding to step 2', async () => {
      renderWithRouter(<RegisterPage />);

      const nextButton = screen.getByRole('button', { name: /próximo passo/i });
      await user.click(nextButton);

      expect(screen.getByText(/nome completo é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
    });

    it('validates email format', async () => {
      renderWithRouter(<RegisterPage />);

      const emailInput = screen.getByLabelText(/endereço de email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger blur

      expect(screen.getByText(/email deve ter um formato válido/i)).toBeInTheDocument();
    });

    it('validates password confirmation match', async () => {
      renderWithRouter(<RegisterPage />);

      await user.type(screen.getByLabelText('Senha *'), 'password123');
      await user.type(screen.getByLabelText('Confirmar Senha *'), 'different');
      await user.tab();

      expect(screen.getByText(/as senhas não coincidem/i)).toBeInTheDocument();
    });

    it('formats phone numbers as user types', async () => {
      renderWithRouter(<RegisterPage />);

      const phoneInput = screen.getByLabelText(/número de telefone/i);
      await user.type(phoneInput, '11999887766');

      expect(phoneInput).toHaveValue('(11) 99988-7766');
    });

    it('validates international phone numbers', async () => {
      renderWithRouter(<RegisterPage />);

      const phoneInput = screen.getByLabelText(/número de telefone/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '+52 12 1234-1234');
      await user.tab();

      // Should not show error for valid international number
      expect(screen.queryByText(/telefone deve ter formato válido/i)).not.toBeInTheDocument();
    });

    it('proceeds to step 2 when all required fields are valid', async () => {
      renderWithRouter(<RegisterPage />);

      await fillStep1Data(user);

      const nextButton = screen.getByRole('button', { name: /próximo passo/i });
      await user.click(nextButton);

      expect(screen.getByText('Detalhes do Restaurante')).toBeInTheDocument();
    });
  });

  describe('Step 2 - Restaurant Details', () => {
    beforeEach(async () => {
      renderWithRouter(<RegisterPage />);
      await fillStep1Data(user);
      await user.click(screen.getByRole('button', { name: /próximo passo/i }));
    });

    it('validates restaurant name is required', async () => {
      const nextButton = screen.getByRole('button', { name: /próximo passo/i });
      await user.click(nextButton);

      expect(screen.getByText(/nome do restaurante é obrigatório/i)).toBeInTheDocument();
    });

    it('formats restaurant URL name as user types', async () => {
      const urlInput = screen.getByLabelText(/nome para url/i);
      await user.type(urlInput, 'Meu Restaurante!');

      expect(urlInput).toHaveValue('meu-restaurante-');
    });

    it('validates restaurant URL name format', async () => {
      const urlInput = screen.getByLabelText(/nome para url/i);
      await user.type(urlInput, 'ab'); // Too short
      await user.tab();

      expect(screen.getByText(/nome deve ter 3-50 caracteres/i)).toBeInTheDocument();
    });

    it('validates website URL format when provided', async () => {
      const websiteInput = screen.getByLabelText(/website/i);
      await user.type(websiteInput, 'invalid-url');
      await user.tab();

      expect(screen.getByText(/website deve ter formato válido/i)).toBeInTheDocument();
    });

    it('proceeds to step 3 when all required fields are valid', async () => {
      await fillStep2Data(user);

      const nextButton = screen.getByRole('button', { name: /próximo passo/i });
      await user.click(nextButton);

      expect(screen.getByText('Localizações e Horários')).toBeInTheDocument();
    });
  });

  describe('Step 3 - Location and Hours', () => {
    beforeEach(async () => {
      renderWithRouter(<RegisterPage />);
      await fillStep1Data(user);
      await user.click(screen.getByRole('button', { name: /próximo passo/i }));
      await fillStep2Data(user);
      await user.click(screen.getByRole('button', { name: /próximo passo/i }));
    });

    it('validates location phone is required', async () => {
      const nextButton = screen.getByRole('button', { name: /próximo passo/i });
      await user.click(nextButton);

      expect(screen.getByText(/telefone da localização é obrigatório/i)).toBeInTheDocument();
    });

    it('validates CEP format', async () => {
      const cepInput = screen.getByLabelText(/cep/i);
      // Clear and type an invalid 8-digit CEP that will fail validation
      await user.clear(cepInput);
      await user.type(cepInput, '1234567'); // 7 digits instead of 8
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/cep deve ter 8 dígitos.*ex:/i)).toBeInTheDocument();
      });
    });

    it('fetches address data from CEP API', async () => {
      const mockCepResponse = {
        logradouro: 'Rua Teste',
        bairro: 'Centro',
        localidade: 'São Paulo',
        uf: 'SP',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCepResponse),
      });

      const cepInput = screen.getByLabelText(/cep/i);
      // Type full 8-digit CEP and trigger blur to simulate the API call
      await user.clear(cepInput);
      await user.type(cepInput, '01310-100');
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01310100/json/');
      });
    });

    it('handles CEP API errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ erro: true }),
      });

      const cepInput = screen.getByLabelText(/cep/i);
      // Type full 8-digit CEP and trigger blur to simulate the API call
      await user.clear(cepInput);
      await user.type(cepInput, '99999-999');
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(screen.getByText(/cep não encontrado/i)).toBeInTheDocument();
      });
    });
  });

  describe('Phone Number Validation and Formatting', () => {
    it('accepts Brazilian phone format', async () => {
      renderWithRouter(<RegisterPage />);

      const phoneInput = screen.getByLabelText(/número de telefone/i);
      await user.type(phoneInput, '11999887766');
      await user.tab();

      expect(phoneInput).toHaveValue('(11) 99988-7766');
      expect(screen.queryByText(/telefone deve ter formato válido/i)).not.toBeInTheDocument();
    });

    it('accepts international phone formats', async () => {
      renderWithRouter(<RegisterPage />);

      const phoneInput = screen.getByLabelText(/número de telefone/i);

      // Test different international formats
      const validFormats = ['+52 12 1234-1234', '+55 11 99999-9999'];

      for (const format of validFormats) {
        await user.clear(phoneInput);
        await user.type(phoneInput, format);
        await user.tab();

        expect(screen.queryByText(/telefone deve ter formato válido/i)).not.toBeInTheDocument();
      }
    });

    it('rejects invalid phone formats', async () => {
      renderWithRouter(<RegisterPage />);

      const phoneInput = screen.getByLabelText(/número de telefone/i);
      await user.type(phoneInput, '123');
      await user.tab();

      expect(screen.getByText(/telefone deve ter formato válido/i)).toBeInTheDocument();
    });

    it('updates placeholder text for international numbers', async () => {
      renderWithRouter(<RegisterPage />);

      const phoneInput = screen.getByLabelText(/número de telefone/i);

      // Check that placeholder supports international format
      expect(phoneInput).toHaveAttribute('placeholder', expect.stringMatching(/\+/));
    });
  });

  describe('Restaurant URL Validation', () => {
    beforeEach(async () => {
      renderWithRouter(<RegisterPage />);
      await fillStep1Data(user);
      await user.click(screen.getByRole('button', { name: /próximo passo/i }));
    });

    it('formats URL name in real-time', async () => {
      const urlInput = screen.getByLabelText(/nome para url/i);

      await user.type(urlInput, 'Meu Restaurante Teste!@#');

      expect(urlInput).toHaveValue('meu-restaurante-teste-');
    });

    it('validates URL name length', async () => {
      const urlInput = screen.getByLabelText(/nome para url/i);

      await user.type(urlInput, 'ab');
      await user.tab();

      expect(screen.getByText(/nome deve ter 3-50 caracteres/i)).toBeInTheDocument();
    });

    it('cleans up URL name on blur', async () => {
      const urlInput = screen.getByLabelText(/nome para url/i);

      await user.type(urlInput, '-meu-restaurante-');
      await user.tab();

      expect(urlInput).toHaveValue('meu-restaurante');
    });
  });

  describe('Error Handling and Validation', () => {
    it('scrolls to top when validation errors occur', async () => {
      renderWithRouter(<RegisterPage />);

      const nextButton = screen.getByRole('button', { name: /próximo passo/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(global.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      });
    });

    it('highlights fields with errors', async () => {
      renderWithRouter(<RegisterPage />);

      const nextButton = screen.getByRole('button', { name: /próximo passo/i });
      await user.click(nextButton);

      const nameInput = screen.getByLabelText(/nome completo/i);
      expect(nameInput).toHaveClass('error');
    });

    it('removes error styling when field becomes valid', async () => {
      renderWithRouter(<RegisterPage />);

      const nameInput = screen.getByLabelText(/nome completo/i);
      const nextButton = screen.getByRole('button', { name: /próximo passo/i });

      await user.click(nextButton); // Trigger validation
      expect(nameInput).toHaveClass('error');

      await user.type(nameInput, 'João Silva');
      await user.tab();

      expect(nameInput).not.toHaveClass('error');
    });

    it('shows all validation errors at once', async () => {
      renderWithRouter(<RegisterPage />);

      const nextButton = screen.getByRole('button', { name: /próximo passo/i });
      await user.click(nextButton);

      expect(screen.getByText(/nome completo é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/número de telefone é obrigatório/i)).toBeInTheDocument();
    });
  });
});
