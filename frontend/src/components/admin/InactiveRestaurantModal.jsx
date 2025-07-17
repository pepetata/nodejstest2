import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/admin/inactiveRestaurantModal.scss';

const InactiveRestaurantModal = ({ show, restaurantName, onClose }) => {
  console.log('InactiveRestaurantModal - show:', show, 'restaurantName:', restaurantName);

  if (!show) return null;

  return (
    <div className="inactive-restaurant-modal-overlay">
      <div className="inactive-restaurant-modal">
        <div className="inactive-restaurant-modal-header">
          <h3>Restaurante Inativo</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar modal">
            ×
          </button>
        </div>

        <div className="inactive-restaurant-modal-body">
          <div className="inactive-restaurant-icon">⚠️</div>
          <p className="inactive-restaurant-message">
            Olá! Sua conta &apos;A la carte&apos; para <strong>{restaurantName}</strong> está
            inativa. Para reativar e continuar usando nossos serviços, por favor, acesse a seção de{' '}
            <strong>Dados de Pagamento</strong> no seu Perfil do Restaurante ou entre em contato com
            nosso suporte.
          </p>
        </div>

        <div className="inactive-restaurant-modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

InactiveRestaurantModal.propTypes = {
  show: PropTypes.bool.isRequired,
  restaurantName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default InactiveRestaurantModal;
