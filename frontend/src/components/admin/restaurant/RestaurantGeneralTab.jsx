import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateTabEditData,
  startTabEditing,
  cancelTabEditing,
  setFieldError,
  setFieldTouched,
  clearFieldError,
} from '../../../store/restaurantSlice';
import {
  validateRestaurantName,
  validateUrlName,
  validateWebsite,
  validateDescription,
  validatePhone,
  validateWhatsApp,
} from '../../../utils/restaurantValidation';
import FormField from '../../common/FormField';
import UnsavedChangesModal from '../../common/UnsavedChangesModal';

const RestaurantGeneralTab = ({ onSave }) => {
  const dispatch = useDispatch();
  const { profile, editingTabs, editData, fieldErrors, touchedFields } = useSelector(
    (state) => state.restaurant
  );

  const [showCancelModal, setShowCancelModal] = useState(false);

  const tabId = 'general';
  const isEditing = editingTabs[tabId] || false;
  const currentData = isEditing ? editData[tabId] : profile;

  const cuisineTypes = [
    'American',
    'Italian',
    'Mexican',
    'Chinese',
    'Japanese',
    'Thai',
    'Indian',
    'French',
    'Mediterranean',
    'Greek',
    'Korean',
    'Vietnamese',
    'Pizza',
    'Burgers',
    'Seafood',
    'Steakhouse',
    'Vegetarian',
    'Vegan',
    'Fast Food',
    'Cafe',
    'Bakery',
    'Bar & Grill',
    'Other',
  ];

  const businessTypes = [
    { value: 'single', label: 'Localização Única' },
    { value: 'multi', label: 'Múltiplas unidades' },
  ];

  const handleFieldChange = (field, value) => {
    if (!isEditing) return;

    dispatch(updateTabEditData({ tabId, field, value }));
    dispatch(setFieldTouched({ field }));

    // Validate field
    let error = null;
    switch (field) {
      case 'restaurant_name':
        error = validateRestaurantName(value);
        break;
      case 'restaurant_url_name':
        error = validateUrlName(value);
        break;
      case 'website':
        error = validateWebsite(value);
        break;
      case 'description':
        error = validateDescription(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      case 'whatsapp':
        error = validateWhatsApp(value);
        break;
      default:
        break;
    }

    if (error) {
      dispatch(setFieldError({ field, error }));
    } else {
      dispatch(clearFieldError({ field }));
    }
  };

  const handleStartEditing = () => {
    dispatch(startTabEditing({ tabId, data: profile }));
  };

  const hasUnsavedChanges = () => {
    if (!isEditing || !currentData || !profile) return false;

    // Compare current edit data with original profile data
    const fieldsToCheck = [
      'restaurant_name',
      'business_type',
      'cuisine_type',
      'website',
      'description',
      'phone',
      'whatsapp',
    ];

    return fieldsToCheck.some((field) => {
      const currentValue = currentData[field] || '';
      const originalValue = profile[field] || '';
      return currentValue !== originalValue;
    });
  };

  const handleCancelEditing = () => {
    if (hasUnsavedChanges()) {
      setShowCancelModal(true);
    } else {
      dispatch(cancelTabEditing({ tabId }));
    }
  };

  const handleConfirmCancel = () => {
    dispatch(cancelTabEditing({ tabId }));
    setShowCancelModal(false);
  };

  const handleCancelModal = () => {
    setShowCancelModal(false);
  };

  const handleSave = () => {
    if (onSave && currentData) {
      onSave(currentData);
      dispatch(cancelTabEditing({ tabId }));
    }
  };

  if (!currentData) {
    return (
      <div className="tab-content-loading">
        <p>Carregando informações do restaurante...</p>
      </div>
    );
  }

  return (
    <div className="restaurant-general-tab">
      <div className="tab-section">
        <div className="section-header">
          <h3 className="section-title">
            Informações Básicas
            <div className="tab-edit-controls">
              {!isEditing ? (
                <button className="btn btn-primary" onClick={handleStartEditing}>
                  ✏️ Editar
                </button>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={handleCancelEditing}>
                    ✕ Cancelar
                  </button>
                  <button className="btn btn-success" onClick={handleSave}>
                    💾 Salvar
                  </button>
                </>
              )}
            </div>
          </h3>
        </div>

        <div className="form-grid">
          <FormField
            label="Nome do Restaurante"
            name="restaurant_name"
            type="text"
            value={currentData.restaurant_name || ''}
            onChange={(e) => handleFieldChange('restaurant_name', e.target.value)}
            error={fieldErrors.restaurant_name}
            touched={touchedFields.restaurant_name}
            disabled={!isEditing}
            required
            placeholder="Ex: Pizzaria Bella Vista"
          />

          <FormField
            label="URL do Restaurante"
            name="restaurant_url_name"
            type="text"
            value={currentData.restaurant_url_name || ''}
            onChange={(e) => handleFieldChange('restaurant_url_name', e.target.value.toLowerCase())}
            error={fieldErrors.restaurant_url_name}
            touched={touchedFields.restaurant_url_name}
            disabled={true} // Always disabled - URL cannot be changed
            required
            placeholder="ex: bella-vista"
            helper="A URL do restaurante não pode ser alterada após a criação"
          />
        </div>

        <div className="form-grid">
          <FormField
            label="Tipo de Negócio"
            name="business_type"
            type="select"
            value={currentData.business_type || 'single'}
            onChange={(e) => handleFieldChange('business_type', e.target.value)}
            disabled={!isEditing}
            options={businessTypes}
            required
          />

          <FormField
            label="Tipo de Culinária"
            name="cuisine_type"
            type="select"
            value={currentData.cuisine_type || ''}
            onChange={(e) => handleFieldChange('cuisine_type', e.target.value)}
            disabled={!isEditing}
            options={cuisineTypes.map((type) => ({ value: type, label: type }))}
            placeholder="Selecione o tipo de culinária"
          />
        </div>

        <FormField
          label="Website (Opcional)"
          name="website"
          type="url"
          value={currentData.website || ''}
          onChange={(e) => handleFieldChange('website', e.target.value)}
          error={fieldErrors.website}
          touched={touchedFields.website}
          disabled={!isEditing}
          placeholder="https://www.seurestaurante.com"
        />

        <FormField
          label="Descrição (Opcional)"
          name="description"
          type="textarea"
          value={currentData.description || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          error={fieldErrors.description}
          touched={touchedFields.description}
          disabled={!isEditing}
          placeholder="Descreva seu restaurante..."
          rows={4}
          maxLength={500}
        />
      </div>

      <div className="tab-section">
        <h3 className="section-title">
          <span className="section-icon">📞</span>
          Contato
        </h3>

        <div className="form-grid">
          <FormField
            label="Telefone Principal"
            name="phone"
            type="tel"
            value={currentData.phone || ''}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            error={fieldErrors.phone}
            touched={touchedFields.phone}
            disabled={!isEditing}
            required
            placeholder="(11) 99999-9999"
          />

          <FormField
            label="WhatsApp"
            name="whatsapp"
            type="tel"
            value={currentData.whatsapp || ''}
            onChange={(e) => handleFieldChange('whatsapp', e.target.value)}
            error={fieldErrors.whatsapp}
            touched={touchedFields.whatsapp}
            disabled={!isEditing}
            required
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      {!isEditing && (
        <div className="view-mode-info">
          <p className="info-text">
            <span className="info-icon">ℹ️</span>
            Clique em &quot;Editar&quot; para modificar essas informações.
          </p>
        </div>
      )}

      {/* Cancel confirmation modal */}
      <UnsavedChangesModal
        isOpen={showCancelModal}
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelModal}
        message="Você tem alterações não salvas nesta aba. Deseja descartar as alterações?"
      />
    </div>
  );
};

RestaurantGeneralTab.propTypes = {
  onSave: PropTypes.func,
};

export default RestaurantGeneralTab;
