import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchRestaurantProfile,
  fetchRestaurantLocations,
  setActiveTab,
  cancelTabEditing,
  updateRestaurantProfile,
  updateRestaurantLocation,
  clearAllErrors,
} from '../../../store/restaurantSlice';
import RestaurantGeneralTab from '../../../components/admin/restaurant/RestaurantGeneralTab';
import RestaurantLocationsTab from '../../../components/admin/restaurant/RestaurantLocationsTab';
import RestaurantFeaturesTab from '../../../components/admin/restaurant/RestaurantFeaturesTab';
import RestaurantMediaTab from '../../../components/admin/restaurant/RestaurantMediaTab';
import RestaurantPaymentTab from '../../../components/admin/restaurant/RestaurantPaymentTab';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import SuccessMessage from '../../../components/common/SuccessMessage';
import UnsavedChangesModal from '../../../components/common/UnsavedChangesModal';
import '../../../styles/AdminRestaurantProfile.css';
import '../../../styles/admin/adminPage.scss';

const AdminRestaurantProfilePage = () => {
  const dispatch = useDispatch();
  const { restaurant } = useSelector((state) => state.auth);
  const {
    profile,
    locations,
    activeTab,
    selectedLocationIndex,
    editingTabs,
    editData,
    hasUnsavedChanges,
    loading,
    error,
  } = useSelector((state) => state.restaurant);

  const [successMessage, setSuccessMessage] = useState('');
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    console.log('AdminRestaurantProfilePage - restaurant data:', restaurant);
    console.log('AdminRestaurantProfilePage - profile loading state:', loading);
    console.log('AdminRestaurantProfilePage - profile data:', profile);

    // Load restaurant data when component mounts
    if (restaurant?.id) {
      console.log('Fetching restaurant profile for ID:', restaurant.id);
      dispatch(fetchRestaurantProfile(restaurant.id));
      dispatch(fetchRestaurantLocations(restaurant.id));
    } else {
      console.log('No restaurant ID found in auth store');
    }

    // Clear any previous errors
    dispatch(clearAllErrors());

    return () => {
      // Clean up on unmount
      dispatch(clearAllErrors());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, restaurant?.id]);

  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Show error if no restaurant is found
  if (!restaurant?.id) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Perfil do Restaurante</h1>
        </div>
        <div className="admin-page-content">
          <ErrorMessage
            message="Nenhum restaurante encontrado. Você precisa estar logado como administrador de um restaurante."
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'general',
      name: 'Informações Gerais',
      // icon: '🏪',
      // description: 'Dados básicos do restaurante',
    },
    {
      id: 'locations',
      name: 'Localizações',
      // icon: '📍',
      // description: 'Endereços e horários de funcionamento',
    },
    {
      id: 'media',
      name: 'Imagens e Vídeos',
      // icon: '📷',
      // description: 'Logo, favicon e mídias do restaurante',
    },
    {
      id: 'features',
      name: 'Recursos e Plano',
      // icon: '⚙️',
      // description: 'Funcionalidades e configuração do plano',
    },
    {
      id: 'payment',
      name: 'Dados de Pagamento',
      // icon: '💳',
      // description: 'Configurações de cobrança e faturamento',
    },
  ];

  // Check if any tab has unsaved changes
  const hasAnyUnsavedChanges = () => {
    return Object.values(hasUnsavedChanges).some(Boolean);
  };

  // Handle tab change with unsaved changes check
  const handleTabChange = (tabId) => {
    if (hasAnyUnsavedChanges()) {
      setPendingTabChange(tabId);
      setShowUnsavedModal(true);
    } else {
      dispatch(setActiveTab(tabId));
    }
  };

  // Confirm discard changes
  const handleDiscardChanges = () => {
    // Cancel all editing tabs
    Object.keys(editingTabs).forEach((tabId) => {
      if (editingTabs[tabId]) {
        dispatch(cancelTabEditing({ tabId }));
      }
    });

    setShowUnsavedModal(false);

    // Execute pending action
    if (pendingTabChange) {
      dispatch(setActiveTab(pendingTabChange));
      setPendingTabChange(null);
    } else if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Cancel modal
  const handleCancelModal = () => {
    setShowUnsavedModal(false);
    setPendingTabChange(null);
    setPendingAction(null);
  };

  const handleSave = async (tabId, data) => {
    try {
      const dataToSave = data || editData[tabId];
      if (!dataToSave) return;

      if (tabId === 'general') {
        await dispatch(
          updateRestaurantProfile({
            restaurantId: restaurant.id,
            data: {
              restaurant_name: dataToSave.restaurant_name,
              business_type: dataToSave.business_type,
              cuisine_type: dataToSave.cuisine_type,
              website: dataToSave.website,
              description: dataToSave.description,
              phone: dataToSave.phone,
              whatsapp: dataToSave.whatsapp,
            },
          })
        ).unwrap();
        setSuccessMessage('Informações gerais atualizadas com sucesso!');
      } else if (tabId === 'locations') {
        const selectedLocation = locations[selectedLocationIndex];
        const locationData = dataToSave[selectedLocationIndex];
        if (selectedLocation && locationData) {
          // Debug: Log the location data being saved
          console.log('Raw dataToSave:', JSON.stringify(dataToSave, null, 2));
          console.log('Selected location index:', selectedLocationIndex);
          console.log('Saving location data:', JSON.stringify(locationData, null, 2));
          console.log('Operating hours in locationData:', locationData.operating_hours);

          // Ensure selected_features is always an array
          let selectedFeatures = locationData.selected_features;

          if (!Array.isArray(selectedFeatures)) {
            if (selectedFeatures && typeof selectedFeatures === 'object') {
              // Convert object like {"0": "digital_menu"} to array ["digital_menu"]
              selectedFeatures = Object.values(selectedFeatures);
            } else {
              // Fallback to default
              selectedFeatures = ['digital_menu'];
            }
          }

          const cleanLocationData = {
            ...locationData,
            selected_features: selectedFeatures,
          };

          console.log(
            'Clean location data being sent to API:',
            JSON.stringify(cleanLocationData, null, 2)
          );

          await dispatch(
            updateRestaurantLocation({
              restaurantId: restaurant.id,
              locationId: selectedLocation.id,
              data: cleanLocationData,
            })
          ).unwrap();
          setSuccessMessage('Localização atualizada com sucesso!');
        }
      } else if (tabId === 'features') {
        await dispatch(
          updateRestaurantProfile({
            restaurantId: restaurant.id,
            data: {
              selected_features: dataToSave.selected_features,
              subscription_plan: dataToSave.subscription_plan,
            },
          })
        ).unwrap();
        setSuccessMessage('Recursos e plano atualizados com sucesso!');
      }

      // Cancel editing for this tab after successful save
      dispatch(cancelTabEditing({ tabId }));
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <RestaurantGeneralTab onSave={(data) => handleSave('general', data)} />;
      case 'locations':
        return <RestaurantLocationsTab onSave={(data) => handleSave('locations', data)} />;
      case 'features':
        return <RestaurantFeaturesTab onSave={(data) => handleSave('features', data)} />;
      case 'media':
        return <RestaurantMediaTab onSave={(data) => handleSave('media', data)} />;
      case 'payment':
        return <RestaurantPaymentTab onSave={(data) => handleSave('payment', data)} />;
      default:
        return <RestaurantGeneralTab onSave={(data) => handleSave('general', data)} />;
    }
  };

  if (loading.profile || loading.locations) {
    console.log('AdminRestaurantProfilePage - Loading state:', {
      profileLoading: loading.profile,
      locationsLoading: loading.locations,
      restaurant: restaurant,
      profile: profile,
      locations: locations,
      error: error,
    });
    console.log('AdminRestaurantProfilePage - Full restaurant state:', {
      profile,
      locations,
      activeTab,
      selectedLocationIndex,
      editingTabs,
      editData,
      hasUnsavedChanges,
      loading,
      error,
    });
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Perfil do Restaurante</h1>
        </div>
        <div className="admin-page-content">
          <LoadingSpinner message="Carregando dados do restaurante..." />
        </div>
      </div>
    );
  }

  if (error.profile || error.locations) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Perfil do Restaurante</h1>
        </div>
        <div className="admin-page-content">
          <ErrorMessage
            message={error.profile || error.locations}
            onRetry={() => {
              dispatch(fetchRestaurantProfile(restaurant.id));
              dispatch(fetchRestaurantLocations(restaurant.id));
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title-section">
          <h1 className="admin-page-title">Perfil do Restaurante</h1>
          <p className="admin-page-subtitle">
            Gerencie as informações do seu restaurante, localizações, mídia e dados de pagamento.
          </p>
        </div>
      </div>

      {successMessage && (
        <SuccessMessage message={successMessage} onClose={() => setSuccessMessage('')} />
      )}

      {error.updating && (
        <ErrorMessage message={error.updating} onClose={() => dispatch(clearAllErrors())} />
      )}

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onConfirm={handleDiscardChanges}
        onCancel={handleCancelModal}
        message="Você tem alterações não salvas. Deseja descartar as alterações?"
      />

      <div className="restaurant-profile-container">
        {/* Tab Navigation */}
        <div className="restaurant-profile-tabs">
          <div className="tab-list">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
                disabled={loading.updating}
              >
                <span className="tab-icon">{tab.icon}</span>
                <div className="tab-content">
                  <span className="tab-name">{tab.name}</span>
                  {/* <span className="tab-description">{tab.description}</span> */}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="restaurant-profile-content">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default AdminRestaurantProfilePage;
