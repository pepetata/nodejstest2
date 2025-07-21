import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  setSelectedLocationIndex,
  updateTabEditData,
  startTabEditing,
  cancelTabEditing,
  setFieldError,
  setFieldTouched,
  clearFieldError,
} from '../../../store/restaurantSlice';
import {
  validateLocationName,
  validateLocationUrlName,
  validatePhone,
  validateWhatsApp,
  validateZipCode,
  validateStreet,
  validateStreetNumber,
  validateCity,
  validateState,
} from '../../../utils/restaurantValidation';
import FormField from '../../common/FormField';
import OperatingHoursForm from '../../common/OperatingHoursForm.jsx';
// import FeaturesSelector from '../../common/FeaturesSelector';
import UnsavedChangesModal from '../../common/UnsavedChangesModal';

const RestaurantLocationsTab = ({ onSave }) => {
  const dispatch = useDispatch();
  const { locations, selectedLocationIndex, editingTabs, editData, fieldErrors, touchedFields } =
    useSelector((state) => state.restaurant);

  const [showCancelModal, setShowCancelModal] = useState(false);

  const tabId = 'locations';
  const isEditing = editingTabs[tabId] || false;
  const currentLocation = isEditing
    ? editData[tabId]?.[selectedLocationIndex]
    : locations[selectedLocationIndex];

  const handleLocationSelect = (index) => {
    dispatch(setSelectedLocationIndex(index));
  };

  const handleStartEditing = () => {
    dispatch(startTabEditing({ tabId, data: locations }));
  };

  const hasUnsavedChanges = () => {
    if (!isEditing || !editData[tabId] || !locations) return false;

    // Compare current edit data with original locations data
    return JSON.stringify(editData[tabId]) !== JSON.stringify(locations);
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

  const formatCEP = (value) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '');

    // Apply CEP mask: 12345-123 (8 digits total)
    if (numbers.length <= 5) {
      return numbers;
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
    }
  };

  const handleCEPLookup = async (cep) => {
    const cleanedCEP = cep.replace(/\D/g, '');

    if (cleanedCEP.length === 8) {
      console.log('Looking up CEP:', cleanedCEP);

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCEP}/json/`);
        const data = await response.json();

        if (!data.erro) {
          console.log('CEP data found:', data);

          // Auto-fill address fields for current location
          dispatch(
            updateTabEditData({
              tabId,
              field: `${selectedLocationIndex}.address.address_street`,
              value: data.logradouro || '',
            })
          );

          dispatch(
            updateTabEditData({
              tabId,
              field: `${selectedLocationIndex}.address.address_city`,
              value: data.localidade || '',
            })
          );

          dispatch(
            updateTabEditData({
              tabId,
              field: `${selectedLocationIndex}.address.address_state`,
              value: data.uf || '',
            })
          );

          // Clear any CEP error
          dispatch(
            clearFieldError({ field: `location_${selectedLocationIndex}_address.address_zip_code` })
          );
        } else {
          console.log('CEP not found');
          dispatch(
            setFieldError({
              field: `location_${selectedLocationIndex}_address.address_zip_code`,
              error: 'CEP não encontrado',
            })
          );
        }
      } catch (error) {
        console.error('Error looking up CEP:', error);
        dispatch(
          setFieldError({
            field: `location_${selectedLocationIndex}_address.address_zip_code`,
            error: 'Erro ao buscar CEP',
          })
        );
      }
    }
  };

  const handleCancelModal = () => {
    setShowCancelModal(false);
  };

  const handleSave = () => {
    if (onSave && editData[tabId]) {
      onSave(editData[tabId]);
      dispatch(cancelTabEditing({ tabId }));
    }
  };

  const handleFieldChange = (field, value) => {
    if (!isEditing) return;

    dispatch(
      updateTabEditData({
        tabId,
        field: `${selectedLocationIndex}.${field}`,
        value,
      })
    );

    dispatch(setFieldTouched({ field: `location_${selectedLocationIndex}_${field}` }));

    // Validate field
    let error = null;
    switch (field) {
      case 'name':
        error = validateLocationName(value);
        break;
      case 'url_name':
        error = validateLocationUrlName(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      case 'whatsapp':
        error = validateWhatsApp(value);
        break;
      case 'address.address_zip_code': {
        // Format CEP as user types
        const formattedValue = formatCEP(value);
        dispatch(
          updateTabEditData({
            tabId,
            field: `${selectedLocationIndex}.${field}`,
            value: formattedValue,
          })
        );
        dispatch(setFieldTouched({ field: `location_${selectedLocationIndex}_${field}` }));
        error = validateZipCode(formattedValue);

        // If CEP is complete (8 digits), lookup address info
        const cleanedCEP = formattedValue.replace(/\D/g, '');
        if (cleanedCEP.length === 8) {
          handleCEPLookup(formattedValue);
        }
        break;
      }
      case 'address.address_street':
        dispatch(
          updateTabEditData({
            tabId,
            field: `${selectedLocationIndex}.${field}`,
            value,
          })
        );
        dispatch(setFieldTouched({ field: `location_${selectedLocationIndex}_${field}` }));
        error = validateStreet(value);
        break;
      case 'address.address_street_number':
        dispatch(
          updateTabEditData({
            tabId,
            field: `${selectedLocationIndex}.${field}`,
            value,
          })
        );
        dispatch(setFieldTouched({ field: `location_${selectedLocationIndex}_${field}` }));
        error = validateStreetNumber(value);
        break;
      case 'address.address_complement':
        dispatch(
          updateTabEditData({
            tabId,
            field: `${selectedLocationIndex}.${field}`,
            value,
          })
        );
        dispatch(setFieldTouched({ field: `location_${selectedLocationIndex}_${field}` }));
        // No validation for complement (optional field)
        break;
      case 'address.address_city':
        dispatch(
          updateTabEditData({
            tabId,
            field: `${selectedLocationIndex}.${field}`,
            value,
          })
        );
        dispatch(setFieldTouched({ field: `location_${selectedLocationIndex}_${field}` }));
        error = validateCity(value);
        break;
      case 'address.address_state':
        dispatch(
          updateTabEditData({
            tabId,
            field: `${selectedLocationIndex}.${field}`,
            value,
          })
        );
        dispatch(setFieldTouched({ field: `location_${selectedLocationIndex}_${field}` }));
        error = validateState(value);
        break;
      default:
        // Handle all other fields with normal logic
        dispatch(
          updateTabEditData({
            tabId,
            field: `${selectedLocationIndex}.${field}`,
            value,
          })
        );
        dispatch(setFieldTouched({ field: `location_${selectedLocationIndex}_${field}` }));
        break;
    }

    const fieldKey = `location_${selectedLocationIndex}_${field}`;
    if (error) {
      dispatch(setFieldError({ field: fieldKey, error }));
    } else {
      dispatch(clearFieldError({ field: fieldKey }));
    }
  };

  const handleOperatingHoursChange = (day, timeType, value) => {
    if (!isEditing) return;

    console.log('Operating hours change:', { day, timeType, value, selectedLocationIndex });
    const field = `operating_hours.${day}.${timeType}`;
    const fullFieldPath = `${selectedLocationIndex}.${field}`;
    console.log('Field path for operating hours:', fullFieldPath);

    // Dispatch directly to make sure it gets to Redux
    dispatch(
      updateTabEditData({
        tabId,
        field: fullFieldPath,
        value,
      })
    );
    dispatch(setFieldTouched({ field: `location_${selectedLocationIndex}_${field}` }));

    console.log('Operating hours updated in Redux for field:', fullFieldPath);
  };

  // Used by FeaturesSelector component (currently commented out)
  const _handleFeatureToggle = (featureId) => {
    if (!isEditing) return;

    const currentFeatures = currentLocation?.selected_features || [];
    const newFeatures = currentFeatures.includes(featureId)
      ? currentFeatures.filter((f) => f !== featureId)
      : [...currentFeatures, featureId];

    handleFieldChange('selected_features', newFeatures);
  };

  if (!locations || locations.length === 0) {
    return (
      <div className="tab-content-empty">
        <div className="empty-state">
          <span className="empty-icon">📍</span>
          <h3>Nenhuma localização encontrada</h3>
          <p>Não foi possível carregar as unidades do restaurante.</p>
        </div>
      </div>
    );
  }

  if (!currentLocation) {
    return (
      <div className="tab-content-loading">
        <p>Carregando informações da Unidade...</p>
      </div>
    );
  }

  return (
    <div className="restaurant-locations-tab">
      {/* Location Selector */}
      {locations.length > 1 && (
        <div className="location-selector">
          <h3 className="section-title">Selecionar Localização</h3>
          <div className="location-list">
            {locations.map((location, index) => (
              <button
                key={location.id || index}
                className={`location-item ${selectedLocationIndex === index ? 'active' : ''}`}
                onClick={() => handleLocationSelect(index)}
                disabled={isEditing}
              >
                <div className="location-info">
                  <h4>{location.name}</h4>
                  <p>
                    {location.address?.address_street}, {location.address?.address_city}
                  </p>
                  {location.is_primary && <span className="primary-badge">Principal</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Location Details */}
      <div className="tab-section">
        <h3 className="section-title">
          Informações da Unidade
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

        <div className="form-grid">
          <FormField
            label="Nome da Unidade"
            name="name"
            type="text"
            value={currentLocation.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            error={fieldErrors[`location_${selectedLocationIndex}_name`]}
            touched={touchedFields[`location_${selectedLocationIndex}_name`]}
            disabled={!isEditing}
            required
            placeholder="Ex: Unidade Centro"
          />

          <FormField
            label="URL da Unidade"
            name="url_name"
            type="text"
            value={currentLocation.url_name || ''}
            onChange={(e) => handleFieldChange('url_name', e.target.value.toLowerCase())}
            error={fieldErrors[`location_${selectedLocationIndex}_url_name`]}
            touched={touchedFields[`location_${selectedLocationIndex}_url_name`]}
            disabled={!isEditing}
            required
            placeholder="centro"
            helper="URL para esta localização específica"
          />
        </div>

        <div className="form-grid">
          <FormField
            label="Telefone"
            name="phone"
            type="tel"
            value={currentLocation.phone || ''}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            error={fieldErrors[`location_${selectedLocationIndex}_phone`]}
            touched={touchedFields[`location_${selectedLocationIndex}_phone`]}
            disabled={!isEditing}
            required
            placeholder="(11) 99999-9999"
          />

          <FormField
            label="WhatsApp"
            name="whatsapp"
            type="tel"
            value={currentLocation.whatsapp || ''}
            onChange={(e) => handleFieldChange('whatsapp', e.target.value)}
            error={fieldErrors[`location_${selectedLocationIndex}_whatsapp`]}
            touched={touchedFields[`location_${selectedLocationIndex}_whatsapp`]}
            disabled={!isEditing}
            required
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="tab-section">
        <h3 className="section-title">Endereço</h3>

        <div className="form-grid">
          <FormField
            label="CEP"
            name="address_zip_code"
            type="text"
            value={currentLocation.address?.address_zip_code || ''}
            onChange={(e) => handleFieldChange('address.address_zip_code', e.target.value)}
            onBlur={(e) => {
              const value = e.target.value;
              const cleanedCEP = value.replace(/\D/g, '');
              if (cleanedCEP.length === 8) {
                handleCEPLookup(value);
              }
            }}
            error={fieldErrors[`location_${selectedLocationIndex}_address.address_zip_code`]}
            touched={touchedFields[`location_${selectedLocationIndex}_address.address_zip_code`]}
            disabled={!isEditing}
            required
            placeholder="00000-000"
            maxLength={9}
          />

          <FormField
            label="Rua"
            name="address_street"
            type="text"
            value={currentLocation.address?.address_street || ''}
            onChange={(e) => handleFieldChange('address.address_street', e.target.value)}
            error={fieldErrors[`location_${selectedLocationIndex}_address.address_street`]}
            touched={touchedFields[`location_${selectedLocationIndex}_address.address_street`]}
            disabled={true} // Always read-only
            required
            placeholder="Rua das Flores"
          />
        </div>

        <div className="form-grid">
          <FormField
            label="Número"
            name="address_street_number"
            type="text"
            value={currentLocation.address?.address_street_number || ''}
            onChange={(e) => handleFieldChange('address.address_street_number', e.target.value)}
            error={fieldErrors[`location_${selectedLocationIndex}_address.address_street_number`]}
            touched={
              touchedFields[`location_${selectedLocationIndex}_address.address_street_number`]
            }
            disabled={!isEditing}
            required
            placeholder="123"
          />

          <FormField
            label="Complemento (Opcional)"
            name="address_complement"
            type="text"
            value={currentLocation.address?.address_complement || ''}
            onChange={(e) => handleFieldChange('address.address_complement', e.target.value)}
            disabled={!isEditing}
            placeholder="Apto 45, Bloco B"
          />
        </div>

        <div className="form-grid">
          <FormField
            label="Cidade"
            name="address_city"
            type="text"
            value={currentLocation.address?.address_city || ''}
            onChange={(e) => handleFieldChange('address.address_city', e.target.value)}
            error={fieldErrors[`location_${selectedLocationIndex}_address.address_city`]}
            touched={touchedFields[`location_${selectedLocationIndex}_address.address_city`]}
            disabled={true} // Always read-only
            required
            placeholder="São Paulo"
          />

          <FormField
            label="Estado"
            name="address_state"
            type="text"
            value={currentLocation.address?.address_state || ''}
            onChange={(e) =>
              handleFieldChange('address.address_state', e.target.value.toUpperCase())
            }
            error={fieldErrors[`location_${selectedLocationIndex}_address.address_state`]}
            touched={touchedFields[`location_${selectedLocationIndex}_address.address_state`]}
            disabled={true} // Always read-only
            required
            placeholder="SP"
            maxLength={2}
          />
        </div>
      </div>

      {/* Operating Hours Section */}
      <div className="tab-section">
        <h3 className="section-title">Horários de Funcionamento</h3>

        <OperatingHoursForm
          operatingHours={currentLocation.operating_hours || {}}
          onChange={handleOperatingHoursChange}
          disabled={!isEditing}
          errors={fieldErrors}
          touched={touchedFields}
          locationIndex={selectedLocationIndex}
        />
      </div>

      {/* Features Section */}
      {/* <div className="tab-section">
        <h3 className="section-title">Recursos e Funcionalidades</h3>

        <FeaturesSelector
          selectedFeatures={currentLocation.selected_features || []}
          onFeatureToggle={_handleFeatureToggle}
          disabled={!isEditing}
        />
      </div> */}

      {!isEditing && (
        <div className="view-mode-info">
          <p className="info-text">
            <span className="info-icon">ℹ️</span>
            Clique em &quot;Editar&quot; para modificar as informações desta localização.
          </p>
        </div>
      )}

      {/* Cancel confirmation modal */}
      <UnsavedChangesModal
        isOpen={showCancelModal}
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelModal}
        message="Você tem alterações não salvas nas unidades. Deseja descartar as alterações?"
      />
    </div>
  );
};

RestaurantLocationsTab.propTypes = {
  onSave: PropTypes.func,
};

export default RestaurantLocationsTab;
