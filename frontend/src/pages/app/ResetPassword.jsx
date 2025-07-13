import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppNavbar from '../../components/common/Navbar';
import userService from '../../services/userService';
import '../styles/login.scss';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!password || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await userService.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Erro ao redefinir a senha.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    navigate('/login');
  };

  return (
    <>
      <AppNavbar />
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Redefinir senha</h1>
          <p className="auth-subtitle">Digite sua nova senha abaixo.</p>
          {error && <div className="error-alert">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Nova senha
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                placeholder="Digite a nova senha"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirmar nova senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="form-input"
                placeholder="Confirme a nova senha"
              />
            </div>
            <div className="form-group">
              <button
                type="submit"
                disabled={loading}
                className="menu-btn btn btn-primary btn-sm login-entrar-btn"
              >
                {loading ? 'Redefinindo...' : 'Redefinir senha'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Success Modal */}
      {success && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Senha redefinida com sucesso!</h2>
            <p>Agora você pode fazer login com sua nova senha.</p>
            <button className="btn btn-primary" onClick={handleModalClose}>
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ResetPassword;
