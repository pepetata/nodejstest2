import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import '../../styles/Auth.scss';

const EmailSentModal = ({ isOpen, onClose, email }) => {
  const navigate = useNavigate();

  const handleOk = () => {
    onClose();
    navigate('/');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleOk();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleOk}
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
          <h2 className="modal-title">E-mail Enviado com Sucesso!</h2>
          <button className="modal-close" onClick={handleOk} aria-label="Fechar">
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
            <strong>{email}</strong>
          </div>

          <p className="instruction-text">
            Verifique sua caixa de entrada e também a pasta de spam. Clique no link de confirmação
            no e-mail para ativar sua conta.
          </p>
        </div>

        <div className="modal-footer">
          <button className="auth-button primary" onClick={handleOk}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

EmailSentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  email: PropTypes.string.isRequired,
};

export default EmailSentModal;
