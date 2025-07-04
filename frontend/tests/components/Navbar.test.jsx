import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../src/components/common/Navbar';
import { AuthContext } from '../../src/contexts/AuthContext';

// Mock useNavigate and useParams
const mockNavigate = vi.fn();
const mockUseParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

// Helper function to render Navbar with AuthContext and Router
const renderNavbar = (authValue, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={authValue}>
        <Navbar />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

// Default auth context values
const defaultAuthUnauthenticated = {
  user: null,
  isAuthenticated: false,
  logout: vi.fn(),
};

const defaultAuthAuthenticated = {
  user: { name: 'João Silva', email: 'joao@example.com' },
  isAuthenticated: true,
  logout: vi.fn(),
};

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset useParams mock to return no slug by default
    mockUseParams.mockReturnValue({});
  });

  describe('Basic Rendering', () => {
    it('renders the navbar with logo', () => {
      renderNavbar(defaultAuthUnauthenticated);
      
      const logo = screen.getByAltText('A la carte');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/images/logo.png');
    });

    it('renders home button', () => {
      renderNavbar(defaultAuthUnauthenticated);
      
      const homeButtons = screen.getAllByText('Home');
      expect(homeButtons.length).toBeGreaterThan(0);
      // Check that at least one home button links to home
      const homeLink = homeButtons.find((btn) => btn.closest('a')?.getAttribute('href') === '/');
      expect(homeLink).toBeInTheDocument();
    });

    it('does not render on admin portals', () => {
      renderNavbar(defaultAuthUnauthenticated, ['/admin/dashboard']);
      
      const navbar = screen.queryByRole('navigation');
      expect(navbar).not.toBeInTheDocument();
    });

    it('does not render on waiter portals', () => {
      renderNavbar(defaultAuthUnauthenticated, ['/waiter/orders']);
      
      const navbar = screen.queryByRole('navigation');
      expect(navbar).not.toBeInTheDocument();
    });

    it('does not render on KDS portals', () => {
      renderNavbar(defaultAuthUnauthenticated, ['/kds/kitchen']);
      
      const navbar = screen.queryByRole('navigation');
      expect(navbar).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated User', () => {
    it('shows login and register buttons when not authenticated', () => {
      renderNavbar(defaultAuthUnauthenticated);
      
      const loginButton = screen.getByText('Entrar');
      const registerButton = screen.getByText('Registrar');
      
      expect(loginButton).toBeInTheDocument();
      expect(registerButton).toBeInTheDocument();
      expect(loginButton.closest('a')).toHaveAttribute('href', '/login');
      expect(registerButton.closest('a')).toHaveAttribute('href', '/register');
    });

    it('hides register button on register page', () => {
      renderNavbar(defaultAuthUnauthenticated, ['/register']);
      
      const loginButton = screen.getByText('Entrar');
      const registerButton = screen.queryByText('Registrar');
      
      expect(loginButton).toBeInTheDocument();
      expect(registerButton).not.toBeInTheDocument();
    });

    it('shows register button on other pages containing "register" in path', () => {
      renderNavbar(defaultAuthUnauthenticated, ['/some-register-info']);
      
      const registerButton = screen.getByText('Registrar');
      expect(registerButton).toBeInTheDocument();
    });
  });

  describe('Authenticated User', () => {
    it('shows welcome message and logout for authenticated user', () => {
      renderNavbar(defaultAuthAuthenticated);
      
      const welcomeMessage = screen.getByText(/Welcome, João Silva - Logout/);
      expect(welcomeMessage).toBeInTheDocument();
      
      const loginButton = screen.queryByText('Entrar');
      const registerButton = screen.queryByText('Registrar');
      expect(loginButton).not.toBeInTheDocument();
      expect(registerButton).not.toBeInTheDocument();
    });

    it('shows default welcome message when user name is not available', () => {
      const authWithoutName = {
        user: { email: 'test@example.com' },
        isAuthenticated: true,
        logout: vi.fn(),
      };
      
      renderNavbar(authWithoutName);
      
      const welcomeMessage = screen.getByText(/Welcome, User - Logout/);
      expect(welcomeMessage).toBeInTheDocument();
    });

    it('calls logout function when logout is clicked', async () => {
      const mockLogout = vi.fn();
      const authValue = {
        ...defaultAuthAuthenticated,
        logout: mockLogout,
      };
      
      renderNavbar(authValue);
      
      const logoutLink = screen.getByText(/Welcome, João Silva - Logout/);
      fireEvent.click(logoutLink);
      
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('navigates to login after logout (without restaurant slug)', async () => {
      const mockLogout = vi.fn().mockResolvedValue();
      const authValue = {
        ...defaultAuthAuthenticated,
        logout: mockLogout,
      };
      
      renderNavbar(authValue);
      
      const logoutLink = screen.getByText(/Welcome, João Silva - Logout/);
      fireEvent.click(logoutLink);
      
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Restaurant Context', () => {
    it('navigates to restaurant-specific login after logout with restaurant slug', async () => {
      // Mock useParams to return a restaurant slug
      mockUseParams.mockReturnValue({ restaurantSlug: 'restaurante-teste' });
      
      const mockLogout = vi.fn().mockResolvedValue();
      const authValue = {
        ...defaultAuthAuthenticated,
        logout: mockLogout,
      };
      
      renderNavbar(authValue);
      
      const logoutLink = screen.getByText(/Welcome, João Silva - Logout/);
      fireEvent.click(logoutLink);
      
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/restaurante-teste/login');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('renders navbar toggle button', () => {
      renderNavbar(defaultAuthUnauthenticated);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('has proper ARIA attributes for accessibility', () => {
      renderNavbar(defaultAuthUnauthenticated);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
      expect(toggleButton).toHaveAttribute('aria-controls', 'main-navbar-nav');
      
      const collapsibleContent = screen.getByRole('navigation').querySelector('#main-navbar-nav');
      expect(collapsibleContent).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies correct CSS classes to navbar', () => {
      renderNavbar(defaultAuthUnauthenticated);
      
      const navbar = screen.getByRole('navigation');
      expect(navbar).toHaveClass('py-2', 'navbar-bg-logo');
    });

    it('applies correct classes to buttons', () => {
      renderNavbar(defaultAuthUnauthenticated);
      
      const loginButton = screen.getByText('Entrar');
      const registerButton = screen.getByText('Registrar');
      
      expect(loginButton).toHaveClass('menu-btn');
      expect(registerButton).toHaveClass('menu-btn');
    });

    it('applies logo classes correctly', () => {
      renderNavbar(defaultAuthUnauthenticated);
      
      const logo = screen.getByAltText('A la carte');
      expect(logo).toHaveClass('logo-img');
      
      const logoContainer = logo.closest('.navbar-logo');
      expect(logoContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user object gracefully', () => {
      const authWithNullUser = {
        user: null,
        isAuthenticated: true,
        logout: vi.fn(),
      };
      
      renderNavbar(authWithNullUser);
      
      const welcomeMessage = screen.getByText(/Welcome, User - Logout/);
      expect(welcomeMessage).toBeInTheDocument();
    });

    it('handles logout errors gracefully', async () => {
      const mockLogout = vi.fn().mockRejectedValue(new Error('Logout failed'));
      const authValue = {
        ...defaultAuthAuthenticated,
        logout: mockLogout,
      };
      
      renderNavbar(authValue);
      
      const logoutLink = screen.getByText(/Welcome, João Silva - Logout/);
      
      // With error handling, navigation should still happen even if logout fails
      fireEvent.click(logoutLink);
      
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
      
      // Should still navigate even if logout fails
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('handles complex restaurant slugs in URL', async () => {
      // Mock useParams to return a complex restaurant slug
      mockUseParams.mockReturnValue({ restaurantSlug: 'restaurante-do-chef-antonio' });
      
      const mockLogout = vi.fn().mockResolvedValue();
      const authValue = {
        ...defaultAuthAuthenticated,
        logout: mockLogout,
      };
      
      renderNavbar(authValue);
      
      const logoutLink = screen.getByText(/Welcome, João Silva - Logout/);
      fireEvent.click(logoutLink);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/restaurante-do-chef-antonio/login');
      });
    });
  });

  describe('Link Navigation', () => {
    it('logo links to home page', () => {
      renderNavbar(defaultAuthUnauthenticated);
      
      const logoLink = screen.getByAltText('A la carte').closest('a');
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('home button links to home page', () => {
      renderNavbar(defaultAuthUnauthenticated);
      
      const homeButtons = screen.getAllByText('Home');
      const homeLink = homeButtons.find((btn) => btn.closest('a')?.getAttribute('href') === '/');
      expect(homeLink).toBeInTheDocument();
    });
  });
});
