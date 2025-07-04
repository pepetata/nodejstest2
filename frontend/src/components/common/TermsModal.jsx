import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { termosDeServico } from '../../documents/termos-de-servico';
import '../../styles/TermsModal.scss';

const TermsModal = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAccept = () => {
    onAccept();
    onClose();
  };

  try {
    return (
      <div
        className="terms-modal-backdrop"
        onClick={handleBackdropClick}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        aria-label="Close terms modal"
        tabIndex={0}
      >
        <div className="terms-modal">
          <div className="terms-modal-header">
            <h2>Termos de Serviço e Contrato de Assinatura</h2>
            <button className="terms-modal-close" onClick={onClose} aria-label="Fechar">
              ×
            </button>
          </div>

          <div className="terms-modal-content">
            <div className="terms-content">
              <ReactMarkdown>{termosDeServico}</ReactMarkdown>
            </div>
          </div>

          <div className="terms-modal-footer">
            <div className="terms-modal-actions">
              <button className="terms-button secondary" onClick={onClose}>
                Cancelar
              </button>
              <button className="terms-button primary" onClick={handleAccept}>
                Li e Aceito os Termos
              </button>
            </div>

            <div className="terms-modal-notice">
              <p>
                ⚖️ Ao aceitar, você concorda com todos os termos e condições descritos acima. Este
                documento possui validade legal.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering TermsModal:', error);
    return (
      <div
        className="terms-modal-backdrop"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        aria-label="Close terms modal"
        tabIndex={0}
      >
        <div className="terms-modal">
          <div className="terms-modal-header">
            <h2>Erro</h2>
            <button className="terms-modal-close" onClick={onClose} aria-label="Fechar">
              ×
            </button>
          </div>
          <div className="terms-modal-content">
            <p>Ocorreu um erro ao carregar os termos. Por favor, tente novamente.</p>
          </div>
          <div className="terms-modal-footer">
            <button className="terms-button secondary" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }
};

TermsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
};

export default TermsModal;
