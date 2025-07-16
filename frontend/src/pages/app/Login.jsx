import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, logout } from '../../store/authSlice';
import PropTypes from 'prop-types';
import '../../styles/login.scss';
import RememberMeTooltip from '../../components/common/RememberMeTooltip';
import userService from '../../services/userService';
import RouteGuard from '../../components/auth/RouteGuard';

const LoginPage = ({ subdomain: _subdomain }) => {
  const { restaurantSlug } = useParams();
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPendingModal, setShowPendingModal] = React.useState(false);
  const [pendingEmail, setPendingEmail] = React.useState('');
  const [showEmailSentModal, setShowEmailSentModal] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [resendError, setResendError] = React.useState('');

  // Debug modal state changes
  React.useEffect(() => {
    console.log('Modal state changed:', { showPendingModal, pendingEmail });
  }, [showPendingModal, pendingEmail]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authError = useSelector((state) => state.auth.error);
  const authStatus = useSelector((state) => state.auth.status);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  // Auto-logout any existing user when navigating to login page
  React.useEffect(() => {
    const performLogout = async () => {
      try {
        // Clear authentication data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('persist:auth');
        localStorage.removeItem('persist:root');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        // Dispatch logout action to clear Redux state
        dispatch(logout());
      } catch (error) {
        console.error('Error during auto-logout:', error);
      }
    };

    performLogout();
  }, [dispatch]); // Run once when component mounts

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(''); // Clear error as user types
  };

  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
  };

  const handleClosePendingModal = () => {
    setShowPendingModal(false);
    setPendingEmail('');
    setResendError('');
  };

  const handleEmailSentSuccess = () => {
    // Close pending modal and show email sent modal
    setShowPendingModal(false);
    setShowEmailSentModal(true);
  };

  const handleCloseEmailSentModal = () => {
    setShowEmailSentModal(false);
    setPendingEmail(''); // Clear the email when closing success modal
  };

  const handleResendConfirmation = async () => {
    setIsResending(true);
    setResendError('');

    try {
      await userService.resendConfirmation({ email: pendingEmail });
      // Call the success callback to show the email sent modal
      handleEmailSentSuccess();
    } catch (error) {
      // Extract error message properly - handle nested error objects
      let errorMsg = 'Erro ao reenviar e-mail de confirmação. Tente novamente.';

      if (error.response?.data) {
        if (typeof error.response.data.error === 'string') {
          errorMsg = error.response.data.error;
        } else if (error.response.data.error?.message) {
          errorMsg = error.response.data.error.message;
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }

      setResendError(errorMsg);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(''); // Clear any previous errors

    try {
      const resultAction = await dispatch(
        login({ email: formData.email, password: formData.password, rememberMe })
      );

      // If login was successful, redirect to admin page
      if (login.fulfilled.match(resultAction)) {
        // Get the user's restaurant subdomain from the login response
        const userRestaurantSubdomain = resultAction.payload?.restaurant?.url;

        console.log('Login successful, payload:', resultAction.payload); // Debug
        console.log('User restaurant subdomain:', userRestaurantSubdomain); // Debug

        if (userRestaurantSubdomain) {
          // User has a restaurant associated, redirect to their restaurant subdomain admin
          const token = resultAction.payload.token;
          const redirectUrl = `http://${userRestaurantSubdomain}.localhost:3000/admin?token=${encodeURIComponent(token)}&auth=true`;
          console.log('Redirecting to:', redirectUrl); // Debug
          window.location.href = redirectUrl;
        } else if (restaurantSlug) {
          // Fallback: if we have a restaurant slug (user is on restaurant page), redirect to restaurant admin
          navigate(`/${restaurantSlug}/admin`);
        } else {
          // No restaurant association, redirect to home
          navigate('/');
        }
      } else if (login.rejected.match(resultAction)) {
        // Check if it's a pending confirmation error
        const errorPayload = resultAction.payload;
        console.log('Login rejected, error payload:', errorPayload); // Debug

        if (errorPayload && errorPayload.code === 'PENDING_CONFIRMATION') {
          console.log('PENDING_CONFIRMATION detected, showing modal'); // Debug
          // Show the pending confirmation modal
          setPendingEmail(errorPayload.email || formData.email);
          setShowPendingModal(true);
        } else {
          console.log('Not a PENDING_CONFIRMATION error, showing regular error'); // Debug
          // Handle other login errors normally
          setError(errorPayload?.error || 'Erro no login. Tente novamente.');
        }
      }
    } catch (err) {
      setError('Erro no login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RouteGuard>
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Login</h1>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Enter your password"
              />
            </div>

            <div className="form-group form-group-flex">
              <div className="remember-me-flex">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={rememberMe}
                  onChange={handleRememberMe}
                  className="remember-me-checkbox"
                />
                <label htmlFor="rememberMe" className="remember-me-label">
                  Lembrar de mim
                </label>
                <RememberMeTooltip />
              </div>
              <Link
                to="/forgot-password"
                className="auth-link forgot-link"
                state={{ email: formData.email }}
              >
                Esqueceu a senha?
              </Link>
            </div>

            <div className="form-group">
              <button
                type="submit"
                disabled={isLoading || authStatus === 'loading'}
                className="menu-btn btn btn-primary btn-sm login-entrar-btn"
              >
                {isLoading || authStatus === 'loading' ? 'Logging in...' : 'Entrar'}
              </button>
            </div>
          </form>
          <div className="auth-footer">
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/register" className="auth-link">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Pending Confirmation Modal */}
      {showPendingModal && (
        <div
          className="modal-overlay"
          onClick={handleClosePendingModal}
          onKeyDown={(e) => e.key === 'Escape' && handleClosePendingModal()}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="modal-header">
              <h2 className="modal-title">Confirmação de E-mail Necessária</h2>
              <button className="modal-close" onClick={handleClosePendingModal} aria-label="Fechar">
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="confirmation-icon">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 8L10.8906 13.2604C11.5624 13.7083 12.4376 13.7083 13.1094 13.2604L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p className="confirmation-message">
                Sua conta ainda não foi confirmada. Para acessar o sistema, você precisa confirmar
                seu e-mail através do link enviado para:
              </p>

              <div className="email-display">
                <strong>{pendingEmail}</strong>
              </div>

              <p className="instruction-text">
                Verifique sua caixa de entrada e também a pasta de spam. Se você não recebeu o
                e-mail, clique no botão abaixo para reenviar.
              </p>

              {resendError && <div className="alert error-alert">{resendError}</div>}
            </div>

            <div className="modal-footer">
              <button className="auth-button secondary" onClick={handleClosePendingModal}>
                Fechar
              </button>
              <button
                className="auth-button primary"
                onClick={handleResendConfirmation}
                disabled={isResending}
              >
                {isResending ? 'Reenviando...' : 'Reenviar E-mail'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Sent Success Modal */}
      {showEmailSentModal && (
        <div
          className="modal-overlay"
          onClick={handleCloseEmailSentModal}
          onKeyDown={(e) => e.key === 'Escape' && handleCloseEmailSentModal()}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="modal-header">
              <h2 className="modal-title">E-mail Enviado com Sucesso!</h2>
              <button
                className="modal-close"
                onClick={handleCloseEmailSentModal}
                aria-label="Fechar"
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="confirmation-icon success-icon">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p className="confirmation-message">
                O e-mail de confirmação foi reenviado com sucesso para:
              </p>

              <div className="email-display">
                <strong>{pendingEmail}</strong>
              </div>

              <p className="instruction-text">
                Verifique sua caixa de entrada e também a pasta de spam. Clique no link de
                confirmação no e-mail para ativar sua conta.
              </p>
            </div>

            <div className="modal-footer">
              <button className="auth-button primary" onClick={handleCloseEmailSentModal}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </RouteGuard>
  );
};

LoginPage.propTypes = {
  subdomain: PropTypes.string,
};

export default LoginPage;
