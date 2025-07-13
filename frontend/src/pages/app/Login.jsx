import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../store/authSlice';
import PropTypes from 'prop-types';
import '../styles/login.scss';
import RememberMeTooltip from '../../components/common/RememberMeTooltip';

const LoginPage = ({ subdomain }) => {
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const resultAction = await dispatch(
      login({ email: formData.email, password: formData.password, rememberMe })
    );
    setIsLoading(false);
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
    }
    // error will be set by useEffect above
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
  );
};

LoginPage.propTypes = {
  subdomain: PropTypes.string,
};

export default LoginPage;
