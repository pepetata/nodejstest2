import React from 'react';
import PropTypes from 'prop-types';

const SuccessMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="success-message">
      <span className="success-icon">✅</span>
      <span className="success-text">{message}</span>
      {onClose && (
        <button type="button" className="close-btn" onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  );
};

SuccessMessage.propTypes = {
  message: PropTypes.string,
  onClose: PropTypes.func,
};

export default SuccessMessage;
