import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({ message = 'Carregando...' }) => {
  return (
    <div className="loading-container">
      <div className="spinner-icon">🔄</div>
      <p>{message}</p>
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
};

export default LoadingSpinner;
