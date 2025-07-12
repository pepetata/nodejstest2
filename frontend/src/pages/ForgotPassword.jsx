import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import userService from '../services/userService';
import AppNavbar from '../components/common/Navbar';
import '../styles/login.scss';

const ForgotPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = location.state?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      await userService.forgotPassword(email);
      setShowModal(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Erro ao solicitar redefinição de senha.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppNavbar />
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Esqueceu a senha?</h1>
          <p className="auth-subtitle">
            Digite seu e-mail para receber o link de redefinição de senha.
          </p>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                placeholder="Digite seu e-mail"
                autoFocus
              />
            </div>
            <div className="form-group">
              <button
                type="submit"
                disabled={loading}
                className="menu-btn btn btn-primary btn-sm login-entrar-btn"
              >
                {loading ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
            </div>
            <div className="auth-footer">
              <p>
                Lembrou sua senha?{' '}
                <Link to="/login" className="auth-link">
                  Entrar
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Modal for reset link sent */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Verifique seu e-mail</h2>
            <p>
              Se um usuário com este e-mail existir, você receberá um link para redefinir sua senha.
              <br />
              Siga as instruções no e-mail para criar uma nova senha.
            </p>
            <button
              onClick={() => {
                setShowModal(false);
                navigate('/');
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ForgotPassword;
