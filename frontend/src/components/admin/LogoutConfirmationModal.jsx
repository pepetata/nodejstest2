import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '../../styles/admin/logoutModal.scss';

const LogoutConfirmationModal = ({ show, onConfirm, onCancel }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (show && modalRef.current) {
      modalRef.current.focus();
    }
  }, [show]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!show) return null;

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={modalRef}
      className="logout-modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      tabIndex={-1}
    >
      <div className="logout-modal-content" role="document">
        <div className="logout-modal-header">
          <h3 id="logout-modal-title" className="logout-modal-title">
            Confirmar Saída
          </h3>
          <button onClick={onCancel} className="logout-modal-close" aria-label="Fechar modal">
            ×
          </button>
        </div>

        <div className="logout-modal-body">
          <div className="logout-confirmation-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <p className="logout-confirmation-message">Tem certeza de que deseja sair do sistema?</p>
          <p className="logout-instruction-text">
            Você será redirecionado para a página inicial do aplicativo.
          </p>
        </div>

        <div className="logout-modal-footer">
          <button onClick={onCancel} className="logout-btn logout-btn-cancel">
            Cancelar
          </button>
          <button onClick={onConfirm} className="logout-btn logout-btn-confirm">
            Sair do Sistema
          </button>
        </div>
      </div>
    </div>
  );
};

LogoutConfirmationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default LogoutConfirmationModal;
