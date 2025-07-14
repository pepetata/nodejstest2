import React from 'react';
import PropTypes from 'prop-types';

const UnsavedChangesModal = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content unsaved-changes-modal">
        <div className="modal-header">
          <h3>⚠️ Alterações não salvas</h3>
        </div>

        <div className="modal-body">
          <p>{message || 'Você tem alterações não salvas. Deseja descartar as alterações?'}</p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} type="button">
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm} type="button">
            Descartar alterações
          </button>
        </div>
      </div>
    </div>
  );
};

UnsavedChangesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  message: PropTypes.string,
};

export default UnsavedChangesModal;
