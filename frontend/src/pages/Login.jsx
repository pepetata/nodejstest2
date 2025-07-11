import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PropTypes from 'prop-types';
import '../styles/Auth.scss';
import RememberMeTooltip from '../components/common/RememberMeTooltip';

const LoginPage = ({ subdomain }) => {
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const { login, error: authError } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(formData.email, formData.password);
    setIsLoading(false);
    if (!success) {
      // error will be set by useEffect above
    }
  };

  return (
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

          <div
            className="form-group"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={rememberMe}
                onChange={handleRememberMe}
                style={{ marginRight: 6 }}
              />
              <label htmlFor="rememberMe" style={{ marginBottom: 0 }}>
                Lembrar de mim
              </label>
              <RememberMeTooltip />
            </div>
            <Link to="/forgot-password" className="auth-link" style={{ fontSize: '0.95em' }}>
              Esqueceu a senha?
            </Link>
          </div>

          <div className="form-group">
            <button type="submit" disabled={isLoading} className="auth-button">
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>

          <div className="auth-footer">
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/register" className="auth-link">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

LoginPage.propTypes = {
  subdomain: PropTypes.string,
};

export default LoginPage;
