import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// Helper function to render the component with necessary providers
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    fetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the registration form with all required elements', () => {
      renderWithRouter(<RegisterPage />);

      // Check for main title
      expect(screen.getByText('Registre Seu Restaurante')).toBeInTheDocument();

      // Check for progress bar
      expect(screen.getByText('Conta')).toBeInTheDocument();
      expect(screen.getByText('Restaurante')).toBeInTheDocument();
      expect(screen.getByText('Localização')).toBeInTheDocument();
      expect(screen.getByText('Recursos')).toBeInTheDocument();
      expect(screen.getByText('Pagamento')).toBeInTheDocument();

      // Check for step 1 content
      expect(screen.getByText('Informações da Conta')).toBeInTheDocument();
      expect(screen.getByLabelText(/Nome Completo/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Telefone/)).toBeInTheDocument();
      expect(screen.getByLabelText(/WhatsApp/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Senha/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirmar Senha/)).toBeInTheDocument();

      // Check for navigation buttons
      expect(screen.getByText('Próximo Passo')).toBeInTheDocument();
      expect(screen.getByText('Já tem uma conta?')).toBeInTheDocument();
    });

    it('renders with pre-filled test data', () => {
      renderWithRouter(<RegisterPage />);

      expect(screen.getByDisplayValue('Flavio Ferreira')).toBeInTheDocument();
      expect(screen.getByDisplayValue('flavio_luiz_ferreira@hotmail.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12345678')).toBeInTheDocument();
      expect(screen.getByDisplayValue('11234567890')).toBeInTheDocument();
    });

    it('shows step 1 as active in progress bar', () => {
      renderWithRouter(<RegisterPage />);

      const progressSteps = screen.getAllByRole('generic');
      const step1 = progressSteps.find((el) => el.textContent?.includes('1'));
      expect(step1).toHaveClass('active');
    });
  });

  describe('Form Validation', () => {
    describe('Step 1 Validation', () => {
      it('validates required fields', async () => {
        renderWithRouter(<RegisterPage />);

        // Clear required fields
        fireEvent.change(screen.getByLabelText(/Nome Completo/), { target: { value: '' } });
        fireEvent.change(screen.getByLabelText(/Email/), { target: { value: '' } });
        fireEvent.change(screen.getByLabelText(/^Senha/), { target: { value: '' } });
        fireEvent.change(screen.getByLabelText(/Confirmar Senha/), { target: { value: '' } });
        fireEvent.change(screen.getByLabelText(/Telefone/), { target: { value: '' } });

        // Try to go to next step
        fireEvent.click(screen.getByText('Próximo Passo'));

        await waitFor(() => {
          expect(screen.getByText('Por favor, corrija 5 campos obrigatórios')).toBeInTheDocument();
        });
      });

      it('validates email format', async () => {
        renderWithRouter(<RegisterPage />);

        const emailInput = screen.getByLabelText(/Email/);
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.blur(emailInput);

        await waitFor(() => {
          expect(
            screen.getByText('Email deve ter um formato válido (ex: usuario@dominio.com)')
          ).toBeInTheDocument();
        });
      });

      it('validates Brazilian phone format', async () => {
        renderWithRouter(<RegisterPage />);

        const phoneInput = screen.getByLabelText(/Telefone/);
        fireEvent.change(phoneInput, { target: { value: '123' } });
        fireEvent.blur(phoneInput);

        await waitFor(() => {
          expect(screen.getByText(/Telefone deve ter formato válido/)).toBeInTheDocument();
        });
      });

      it('validates password confirmation', async () => {
        renderWithRouter(<RegisterPage />);

        const passwordInput = screen.getByLabelText(/^Senha/);
        const confirmPasswordInput = screen.getByLabelText(/Confirmar Senha/);

        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
        fireEvent.blur(confirmPasswordInput);

        await waitFor(() => {
          expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument();
        });
      });

      it('validates password length', async () => {
        renderWithRouter(<RegisterPage />);

        const passwordInput = screen.getByLabelText(/^Senha/);
        fireEvent.change(passwordInput, { target: { value: '123' } });
        fireEvent.blur(passwordInput);

        await waitFor(() => {
          expect(screen.getByText('A senha deve ter pelo menos 8 caracteres')).toBeInTheDocument();
        });
      });

      it('validates WhatsApp format when provided', async () => {
        renderWithRouter(<RegisterPage />);

        const whatsappInput = screen.getByLabelText(/WhatsApp/);
        fireEvent.change(whatsappInput, { target: { value: '123' } });
        fireEvent.blur(whatsappInput);

        await waitFor(() => {
          expect(screen.getByText(/WhatsApp deve ter formato válido/)).toBeInTheDocument();
        });
      });
    });

    describe('Step 2 Validation', () => {
      beforeEach(async () => {
        renderWithRouter(<RegisterPage />);
        // Navigate to step 2
        fireEvent.click(screen.getByText('Próximo Passo'));
        await waitFor(() => {
          expect(screen.getByText('Detalhes do Restaurante')).toBeInTheDocument();
        });
      });

      it('validates restaurant name', async () => {
        const restaurantNameInput = screen.getByLabelText(/Nome do Restaurante/);
        fireEvent.change(restaurantNameInput, { target: { value: '' } });
        fireEvent.click(screen.getByText('Próximo Passo'));

        await waitFor(() => {
          expect(screen.getByText(/Nome do restaurante é obrigatório/)).toBeInTheDocument();
        });
      });

      it('validates restaurant URL name', async () => {
        const urlNameInput = screen.getByLabelText(/Nome para URL do Menu/);
        fireEvent.change(urlNameInput, { target: { value: '' } });
        fireEvent.click(screen.getByText('Próximo Passo'));

        await waitFor(() => {
          expect(screen.getByText(/Nome para URL é obrigatório/)).toBeInTheDocument();
        });
      });

      it('validates URL name format', async () => {
        const urlNameInput = screen.getByLabelText(/Nome para URL do Menu/);
        fireEvent.change(urlNameInput, { target: { value: 'a' } }); // Too short
        fireEvent.blur(urlNameInput);

        await waitFor(() => {
          expect(screen.getByText(/Nome deve ter 3-50 caracteres/)).toBeInTheDocument();
        });
      });

      it('shows URL preview', async () => {
        const urlNameInput = screen.getByLabelText(/Nome para URL do Menu/);
        fireEvent.change(urlNameInput, { target: { value: 'meu-restaurante' } });

        await waitFor(() => {
          expect(screen.getByText(/meu-restaurante.alacarteapp.com\/menu/)).toBeInTheDocument();
        });
      });

      it('validates cuisine type selection', async () => {
        const cuisineSelect = screen.getByLabelText(/Tipo de Culinária/);
        fireEvent.change(cuisineSelect, { target: { value: '' } });
        fireEvent.click(screen.getByText('Próximo Passo'));

        await waitFor(() => {
          expect(screen.getByText(/Tipo de culinária é obrigatório/)).toBeInTheDocument();
        });
      });

      it('validates website format when provided', async () => {
        const websiteInput = screen.getByLabelText(/Website/);
        fireEvent.change(websiteInput, { target: { value: 'invalid-url' } });
        fireEvent.blur(websiteInput);

        await waitFor(() => {
          expect(screen.getByText(/Website deve ter formato válido/)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Multi-location functionality', () => {
    beforeEach(async () => {
      renderWithRouter(<RegisterPage />);

      // Navigate to step 2
      fireEvent.click(screen.getByText('Próximo Passo'));
      await waitFor(() => {
        expect(screen.getByText('Detalhes do Restaurante')).toBeInTheDocument();
      });

      // Change to multi-location
      const businessTypeSelect = screen.getByLabelText(/Tipo de Negócio/);
      fireEvent.change(businessTypeSelect, { target: { value: 'multi' } });

      // Navigate to step 3
      fireEvent.click(screen.getByText('Próximo Passo'));
      await waitFor(() => {
        expect(screen.getByText('Localizações e Horários')).toBeInTheDocument();
      });
    });

    it('shows location tabs for multi-location business', () => {
      expect(screen.getByText('Localização Principal')).toBeInTheDocument();
      expect(screen.getByText('+ Adicionar Localização')).toBeInTheDocument();
      expect(screen.getByLabelText(/Nome da Localização para URL do Menu/)).toBeInTheDocument();
    });

    it('can add new locations', async () => {
      fireEvent.click(screen.getByText('+ Adicionar Localização'));

      await waitFor(() => {
        expect(screen.getByText('Localização 2')).toBeInTheDocument();
      });
    });

    it('can remove locations (but not the last one)', async () => {
      // Add a second location first
      fireEvent.click(screen.getByText('+ Adicionar Localização'));

      await waitFor(() => {
        expect(screen.getByText('Localização 2')).toBeInTheDocument();
      });

      // Try to remove location (should have remove button)
      const removeButtons = screen.getAllByText('×');
      expect(removeButtons).toHaveLength(1); // Only on the second location
    });

    it('validates location URL name for multi-location', async () => {
      const locationUrlInput = screen.getByLabelText(/Nome da Localização para URL do Menu/);
      fireEvent.change(locationUrlInput, { target: { value: '' } });
      fireEvent.click(screen.getByText('Próximo Passo'));

      await waitFor(() => {
        expect(screen.getByText(/Nome para URL da localização é obrigatório/)).toBeInTheDocument();
      });
    });

    it('shows location-specific URL preview', async () => {
      const locationUrlInput = screen.getByLabelText(/Nome da Localização para URL do Menu/);
      fireEvent.change(locationUrlInput, { target: { value: 'centro' } });

      await waitFor(() => {
        expect(screen.getByText(/centro\.aaa\.alacarteapp\.com\/menu/)).toBeInTheDocument();
      });
    });
  });

  describe('CEP Lookup functionality', () => {
    beforeEach(async () => {
      renderWithRouter(<RegisterPage />);

      // Navigate to step 3
      fireEvent.click(screen.getByText('Próximo Passo'));
      fireEvent.click(screen.getByText('Próximo Passo'));
      await waitFor(() => {
        expect(screen.getByText('Localizações e Horários')).toBeInTheDocument();
      });
    });

    it('formats CEP input correctly', async () => {
      const cepInput = screen.getByLabelText(/CEP/);
      fireEvent.change(cepInput, { target: { value: '12345678' } });

      await waitFor(() => {
        expect(cepInput.value).toBe('12345-678');
      });
    });

    it('performs CEP lookup on valid CEP', async () => {
      const mockCepData = {
        logradouro: 'Rua das Flores',
        localidade: 'São Paulo',
        uf: 'SP',
      };

      fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockCepData),
      });

      const cepInput = screen.getByLabelText(/CEP/);
      fireEvent.change(cepInput, { target: { value: '01310-100' } });
      fireEvent.blur(cepInput);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01310100/json/');
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Rua das Flores')).toBeInTheDocument();
        expect(screen.getByDisplayValue('São Paulo')).toBeInTheDocument();
        expect(screen.getByDisplayValue('SP')).toBeInTheDocument();
      });
    });

    it('shows error for invalid CEP', async () => {
      fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ erro: true }),
      });

      const cepInput = screen.getByLabelText(/CEP/);
      fireEvent.change(cepInput, { target: { value: '00000-000' } });
      fireEvent.blur(cepInput);

      await waitFor(() => {
        expect(screen.getByText('CEP não encontrado')).toBeInTheDocument();
      });
    });

    it('handles CEP lookup timeout', async () => {
      fetch.mockImplementationOnce(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 6000))
      );

      const cepInput = screen.getByLabelText(/CEP/);
      fireEvent.change(cepInput, { target: { value: '01310-100' } });
      fireEvent.blur(cepInput);

      await waitFor(
        () => {
          expect(screen.getByText('Erro ao buscar CEP')).toBeInTheDocument();
        },
        { timeout: 7000 }
      );
    });
  });

  describe('Operating Hours', () => {
    beforeEach(async () => {
      renderWithRouter(<RegisterPage />);

      // Navigate to step 3
      fireEvent.click(screen.getByText('Próximo Passo'));
      fireEvent.click(screen.getByText('Próximo Passo'));
      await waitFor(() => {
        expect(screen.getByText('Horários de Funcionamento')).toBeInTheDocument();
      });
    });

    it('renders all days of the week', () => {
      const days = [
        'Segunda-feira',
        'Terça-feira',
        'Quarta-feira',
        'Quinta-feira',
        'Sexta-feira',
        'Sábado',
        'Domingo',
        'Feriados',
      ];

      days.forEach((day) => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('allows toggling closed status', async () => {
      const mondayClosedCheckbox = screen.getByLabelText(/Segunda-feira.*Fechado/);
      fireEvent.click(mondayClosedCheckbox);

      await waitFor(() => {
        expect(mondayClosedCheckbox).toBeChecked();
      });
    });

    it('hides time inputs when day is closed', async () => {
      const mondayClosedCheckbox = screen.getByLabelText(/Segunda-feira.*Fechado/);
      fireEvent.click(mondayClosedCheckbox);

      await waitFor(() => {
        const timeInputs = screen.queryAllByDisplayValue('09:00');
        expect(timeInputs.length).toBeLessThan(7); // Should be fewer time inputs
      });
    });
  });

  describe('Features and Plan Selection', () => {
    beforeEach(async () => {
      renderWithRouter(<RegisterPage />);

      // Navigate to step 4
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('Próximo Passo'));
        await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
      }

      await waitFor(() => {
        expect(screen.getByText('Recursos e Seleção de Plano')).toBeInTheDocument();
      });
    });

    it('shows all available features', () => {
      expect(screen.getByText('Menu Digital e Pedidos QR')).toBeInTheDocument();
      expect(screen.getByText('Portal do Garçom')).toBeInTheDocument();
      expect(screen.getByText('Pedidos por Mesa')).toBeInTheDocument();
      expect(screen.getByText('Integração de Pagamento')).toBeInTheDocument();
      expect(screen.getByText('Integração Impressora Cozinha')).toBeInTheDocument();
      expect(screen.getByText('Programa de Fidelidade')).toBeInTheDocument();
      expect(screen.getByText('Análises Avançadas')).toBeInTheDocument();
    });

    it('has digital menu as required feature', () => {
      const digitalMenuCheckbox = screen.getByLabelText(/Menu Digital e Pedidos QR/);
      expect(digitalMenuCheckbox).toBeChecked();
      expect(digitalMenuCheckbox).toBeDisabled();
    });

    it('allows toggling optional features', async () => {
      const waiterPortalCheckbox = screen.getByLabelText(/Portal do Garçom/);
      fireEvent.click(waiterPortalCheckbox);

      await waitFor(() => {
        expect(waiterPortalCheckbox).toBeChecked();
      });
    });

    it('shows plan recommendation', () => {
      expect(screen.getByText('Plano Recomendado')).toBeInTheDocument();
      expect(screen.getByText('Plano Inicial')).toBeInTheDocument();
      expect(screen.getByText('R$29/mês')).toBeInTheDocument();
    });

    it('updates plan recommendation based on features', async () => {
      // Select multiple features to trigger professional plan
      const features = [
        'Portal do Garçom',
        'Pedidos por Mesa',
        'Integração de Pagamento',
        'Integração Impressora Cozinha',
      ];

      for (const feature of features) {
        const checkbox = screen.getByLabelText(new RegExp(feature));
        fireEvent.click(checkbox);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      await waitFor(() => {
        expect(screen.getByText('Plano Profissional')).toBeInTheDocument();
        expect(screen.getByText('R$79/mês')).toBeInTheDocument();
      });
    });
  });

  describe('Payment and Billing', () => {
    beforeEach(async () => {
      renderWithRouter(<RegisterPage />);

      // Navigate to step 5
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByText('Próximo Passo'));
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await waitFor(() => {
        expect(screen.getByText('Pagamento e Cobrança')).toBeInTheDocument();
      });
    });

    it('renders payment form fields', () => {
      expect(screen.getByLabelText(/Nome no Cartão/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Número do Cartão/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Data de Validade/)).toBeInTheDocument();
      expect(screen.getByLabelText(/CVV/)).toBeInTheDocument();
    });

    it('shows billing address toggle', () => {
      expect(
        screen.getByLabelText(/Endereço de cobrança igual ao endereço do restaurante/)
      ).toBeInTheDocument();
    });

    it('shows billing address fields when toggle is off', async () => {
      const toggle = screen.getByLabelText(/Endereço de cobrança igual ao endereço do restaurante/);
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(screen.getByText('Endereço de Cobrança')).toBeInTheDocument();
      });
    });

    it('shows marketing consent checkbox', () => {
      expect(screen.getByLabelText(/Gostaria de receber atualizações/)).toBeInTheDocument();
    });

    it('shows plan summary', () => {
      expect(screen.getByText('Resumo do Plano')).toBeInTheDocument();
      expect(screen.getByText(/Recursos:.*selecionados/)).toBeInTheDocument();
    });

    it('shows security notice', () => {
      expect(
        screen.getByText(/Suas informações de pagamento são criptografadas/)
      ).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('scrolls to top when navigating between steps', async () => {
      renderWithRouter(<RegisterPage />);

      fireEvent.click(screen.getByText('Próximo Passo'));

      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      });
    });

    it('allows going back to previous step', async () => {
      renderWithRouter(<RegisterPage />);

      // Go to step 2
      fireEvent.click(screen.getByText('Próximo Passo'));
      await waitFor(() => {
        expect(screen.getByText('Detalhes do Restaurante')).toBeInTheDocument();
      });

      // Go back to step 1
      fireEvent.click(screen.getByText('Anterior'));
      await waitFor(() => {
        expect(screen.getByText('Informações da Conta')).toBeInTheDocument();
      });
    });

    it('clears errors when going back', async () => {
      renderWithRouter(<RegisterPage />);

      // Create an error by trying to proceed with empty required field
      fireEvent.change(screen.getByLabelText(/Nome Completo/), { target: { value: '' } });
      fireEvent.click(screen.getByText('Próximo Passo'));

      await waitFor(() => {
        expect(screen.getByText(/Por favor, corrija/)).toBeInTheDocument();
      });

      // Navigate to step 2 first
      fireEvent.change(screen.getByLabelText(/Nome Completo/), { target: { value: 'Test Name' } });
      fireEvent.click(screen.getByText('Próximo Passo'));

      // Go back
      fireEvent.click(screen.getByText('Anterior'));

      await waitFor(() => {
        expect(screen.queryByText(/Por favor, corrija/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      renderWithRouter(<RegisterPage />);

      // Navigate to final step
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByText('Próximo Passo'));
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await waitFor(() => {
        expect(screen.getByText('Concluir Registro')).toBeInTheDocument();
      });
    });

    it('shows submit button on final step', () => {
      expect(screen.getByText('Concluir Registro')).toBeInTheDocument();
    });

    it('calls register function on successful submission', async () => {
      mockRegister.mockResolvedValueOnce({});

      // Fill required payment fields
      fireEvent.change(screen.getByLabelText(/Nome no Cartão/), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText(/Número do Cartão/), {
        target: { value: '4111111111111111' },
      });
      fireEvent.change(screen.getByLabelText(/Data de Validade/), { target: { value: '12/25' } });
      fireEvent.change(screen.getByLabelText(/CVV/), { target: { value: '123' } });

      fireEvent.click(screen.getByText('Concluir Registro'));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'restaurant',
            ownerName: 'Flavio Ferreira',
            email: 'flavio_luiz_ferreira@hotmail.com',
            subscriptionPlan: 'starter',
          })
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('shows error on submission failure', async () => {
      mockRegister.mockRejectedValueOnce(new Error('Registration failed'));

      // Fill required payment fields
      fireEvent.change(screen.getByLabelText(/Nome no Cartão/), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText(/Número do Cartão/), {
        target: { value: '4111111111111111' },
      });
      fireEvent.change(screen.getByLabelText(/Data de Validade/), { target: { value: '12/25' } });
      fireEvent.change(screen.getByLabelText(/CVV/), { target: { value: '123' } });

      fireEvent.click(screen.getByText('Concluir Registro'));

      await waitFor(() => {
        expect(screen.getByText('Registration failed')).toBeInTheDocument();
      });
    });

    it('validates required fields before submission', async () => {
      // Don't fill payment fields
      fireEvent.click(screen.getByText('Concluir Registro'));

      await waitFor(() => {
        expect(screen.getByText(/Por favor, corrija.*campos obrigatórios/)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('Validation Helpers', () => {
    it('validates Brazilian phone numbers correctly', () => {
      renderWithRouter(<RegisterPage />);

      const phoneInput = screen.getByLabelText(/Telefone/);

      // Valid mobile numbers
      fireEvent.change(phoneInput, { target: { value: '11987654321' } });
      fireEvent.blur(phoneInput);
      expect(screen.queryByText(/Telefone deve ter formato válido/)).not.toBeInTheDocument();

      // Valid landline
      fireEvent.change(phoneInput, { target: { value: '1133334444' } });
      fireEvent.blur(phoneInput);
      expect(screen.queryByText(/Telefone deve ter formato válido/)).not.toBeInTheDocument();
    });

    it('validates email addresses correctly', () => {
      renderWithRouter(<RegisterPage />);

      const emailInput = screen.getByLabelText(/Email/);

      // Valid email
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.blur(emailInput);
      expect(screen.queryByText(/Email deve ter um formato válido/)).not.toBeInTheDocument();

      // Invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid.email' } });
      fireEvent.blur(emailInput);
      expect(screen.getByText(/Email deve ter um formato válido/)).toBeInTheDocument();
    });

    it('validates restaurant URL names correctly', async () => {
      renderWithRouter(<RegisterPage />);

      // Navigate to step 2
      fireEvent.click(screen.getByText('Próximo Passo'));

      await waitFor(() => {
        const urlInput = screen.getByLabelText(/Nome para URL do Menu/);

        // Valid URL name
        fireEvent.change(urlInput, { target: { value: 'meu-restaurante-123' } });
        fireEvent.blur(urlInput);
        expect(screen.queryByText(/Nome deve ter 3-50 caracteres/)).not.toBeInTheDocument();

        // Invalid URL name (too short)
        fireEvent.change(urlInput, { target: { value: 'a' } });
        fireEvent.blur(urlInput);
        expect(screen.getByText(/Nome deve ter 3-50 caracteres/)).toBeInTheDocument();
      });
    });
  });

  describe('URL Formatting', () => {
    it('formats restaurant URL name as user types', async () => {
      renderWithRouter(<RegisterPage />);

      // Navigate to step 2
      fireEvent.click(screen.getByText('Próximo Passo'));

      await waitFor(() => {
        const urlInput = screen.getByLabelText(/Nome para URL do Menu/);
        fireEvent.change(urlInput, { target: { value: 'Meu Restaurante!' } });

        expect(urlInput.value).toBe('meu-restaurante-');
      });
    });

    it('cleans up URL name on blur', async () => {
      renderWithRouter(<RegisterPage />);

      // Navigate to step 2
      fireEvent.click(screen.getByText('Próximo Passo'));

      await waitFor(() => {
        const urlInput = screen.getByLabelText(/Nome para URL do Menu/);
        fireEvent.change(urlInput, { target: { value: '-meu-restaurante-' } });
        fireEvent.blur(urlInput);

        expect(urlInput.value).toBe('meu-restaurante');
      });
    });
  });
});
