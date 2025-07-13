import React, { useState } from 'react';
import PropTypes from 'prop-types';
import userService from '../../services/userService';
import '../../styles/Auth.scss';

const PendingConfirmationModal = ({ isOpen, onClose, email }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null); // 'success', 'error', or null
  const [resendMessage, setResendMessage] = useState('');

  const handleResendConfirmation = async () => {
    setIsResending(true);
    setResendStatus(null);
    setResendMessage('');

    try {
      await userService.resendConfirmation({ email });
      setResendStatus('success');
      setResendMessage(
        'E-mail de confirmação reenviado com sucesso! Verifique sua caixa de entrada.'
      );
    } catch (error) {
      setResendStatus('error');
      setResendMessage(
        error.response?.data?.error || 'Erro ao reenviar e-mail de confirmação. Tente novamente.'
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    setResendStatus(null);
    setResendMessage('');
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
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
          <button className="modal-close" onClick={handleClose} aria-label="Fechar">
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
            Sua conta ainda não foi confirmada. Para acessar o sistema, você precisa confirmar seu
            e-mail através do link enviado para:
          </p>

          <div className="email-display">
            <strong>{email}</strong>
          </div>

          <p className="instruction-text">
            Verifique sua caixa de entrada e também a pasta de spam. Se você não recebeu o e-mail,
            clique no botão abaixo para reenviar.
          </p>

          {resendMessage && (
            <div
              className={`alert ${resendStatus === 'success' ? 'success-alert' : 'error-alert'}`}
            >
              {resendMessage}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="auth-button secondary" onClick={handleClose}>
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
  );
};

PendingConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  email: PropTypes.string.isRequired,
};

export default PendingConfirmationModal;
