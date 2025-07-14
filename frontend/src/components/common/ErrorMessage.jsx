import React from 'react';
import PropTypes from 'prop-types';

const ErrorMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="error-message">
      <span className="error-icon">❌</span>
      <span className="error-text">{message}</span>
      {onClose && (
        <button type="button" className="close-btn" onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string,
  onClose: PropTypes.func,
};

export default ErrorMessage;
