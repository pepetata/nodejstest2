import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../store/authSlice';
import PropTypes from 'prop-types';
import '../../styles/login.scss';
import RememberMeTooltip from '../../components/common/RememberMeTooltip';
import PendingConfirmationModal from '../../components/common/PendingConfirmationModal';
import EmailSentModal from '../../components/common/EmailSentModal';

const LoginPage = ({ subdomain }) => {
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPendingModal, setShowPendingModal] = React.useState(false);
  const [pendingEmail, setPendingEmail] = React.useState('');
  const [showEmailSentModal, setShowEmailSentModal] = React.useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(''); // Clear any previous errors

    try {
      const resultAction = await dispatch(
        login({ email: formData.email, password: formData.password, rememberMe })
      );

      // If login was successful, redirect to admin page with subdomain
      if (login.fulfilled.match(resultAction)) {
        // Use subdomain from props or user object
        const user = resultAction.payload.user;
        const restaurantSubdomain =
          user && user.restaurant_subdomain ? user.restaurant_subdomain : subdomain || '';
        const appHost = import.meta.env.VITE_APP_HOST || window.location.host.replace(/^.*?\./, '');
        if (restaurantSubdomain) {
          window.location.href = `//${restaurantSubdomain}.${appHost}/admin`;
        } else {
          navigate('/admin');
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
    <>
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
      <PendingConfirmationModal
        isOpen={showPendingModal}
        onClose={handleClosePendingModal}
        onEmailSentSuccess={handleEmailSentSuccess}
        email={pendingEmail}
      />

      {/* Email Sent Success Modal */}
      <EmailSentModal
        isOpen={showEmailSentModal}
        onClose={handleCloseEmailSentModal}
        email={pendingEmail}
      />
    </>
  );
};

LoginPage.propTypes = {
  subdomain: PropTypes.string,
};

export default LoginPage;
