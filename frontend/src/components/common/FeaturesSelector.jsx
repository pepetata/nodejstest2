import React from 'react';
import PropTypes from 'prop-types';

const FeaturesSelector = ({ selectedFeatures = [], onFeatureToggle, disabled = false }) => {
  const features = [
    { id: 'wifi', label: 'WiFi Gratuito', icon: '📶' },
    { id: 'parking', label: 'Estacionamento', icon: '🚗' },
    { id: 'delivery', label: 'Entrega', icon: '🚚' },
    { id: 'takeout', label: 'Retirada', icon: '🥡' },
    { id: 'outdoor_seating', label: 'Área Externa', icon: '🌳' },
    { id: 'live_music', label: 'Música Ao Vivo', icon: '🎵' },
    { id: 'pet_friendly', label: 'Pet Friendly', icon: '🐕' },
    { id: 'kids_area', label: 'Espaço Kids', icon: '🎈' },
    { id: 'air_conditioning', label: 'Ar Condicionado', icon: '❄️' },
    { id: 'wheelchair_accessible', label: 'Acessível', icon: '♿' },
    { id: 'vegan_options', label: 'Opções Veganas', icon: '🌱' },
    { id: 'vegetarian_options', label: 'Opções Vegetarianas', icon: '🥗' },
  ];

  const handleFeatureClick = (featureId) => {
    if (!disabled && onFeatureToggle) {
      onFeatureToggle(featureId);
    }
  };

  return (
    <div className="features-selector">
      <div className="features-grid">
        {features.map((feature) => {
          const isSelected = selectedFeatures.includes(feature.id);
          return (
            <button
              key={feature.id}
              type="button"
              className={`feature-item ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => handleFeatureClick(feature.id)}
              disabled={disabled}
            >
              <span className="feature-icon">{feature.icon}</span>
              <span className="feature-label">{feature.label}</span>
              {isSelected && <span className="selected-indicator">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

FeaturesSelector.propTypes = {
  selectedFeatures: PropTypes.arrayOf(PropTypes.string),
  onFeatureToggle: PropTypes.func,
  disabled: PropTypes.bool,
};

export default FeaturesSelector;
