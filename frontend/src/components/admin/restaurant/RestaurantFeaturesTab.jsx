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
import UnsavedChangesModal from '../../common/UnsavedChangesModal';

const RestaurantFeaturesTab = ({ onSave }) => {
  const dispatch = useDispatch();
  const { profile, editingTabs, editData, fieldErrors, touchedFields } = useSelector(
    (state) => state.restaurant
  );

  const [showCancelModal, setShowCancelModal] = useState(false);

  const tabId = 'features';
  const isEditing = editingTabs[tabId] || false;
  const currentData = isEditing ? editData[tabId] : profile;

  // Features from register.jsx step 4
  const features = [
    {
      id: 'digital_menu',
      name: 'Menu Digital e Pedidos QR',
      required: true,
      description: 'Recurso essencial básico',
    },
    {
      id: 'waiter_portal',
      name: 'Portal do Garçom',
      description: 'Interface de pedidos para funcionários',
    },
    {
      id: 'seat_ordering',
      name: 'Pedidos por Mesa',
      description: 'Identificação de itens por assento',
    },
    {
      id: 'payment_integration',
      name: 'Integração de Pagamento',
      description: 'Processamento de pagamento no app',
    },
    {
      id: 'kitchen_printer',
      name: 'Integração Impressora em Estação',
      description: 'Conectividade direta com impressora',
    },
    {
      id: 'loyalty_program',
      name: 'Programa de Fidelidade',
      description: 'Sistema de pontos e recompensas',
    },
    {
      id: 'analytics',
      name: 'Análises Avançadas',
      description: 'Relatórios detalhados e insights',
    },
  ];

  const subscriptionPlans = {
    starter: {
      name: 'Plano Inicial',
      price: 29,
      description: 'Recursos básicos para unidades únicas',
    },
    professional: {
      name: 'Plano Profissional',
      price: 79,
      description: 'Recursos aprimorados para restaurantes movimentados',
    },
    enterprise: {
      name: 'Plano Empresarial',
      price: 149,
      description: 'Solução completa para redes de restaurantes',
    },
  };

  const handleStartEditing = () => {
    dispatch(startTabEditing({ tabId, data: profile }));
  };

  const hasUnsavedChanges = () => {
    if (!isEditing || !currentData || !profile) return false;

    // Check if selected_features have changed
    const currentFeatures = JSON.stringify(currentData.selected_features || ['digital_menu']);
    const originalFeatures = JSON.stringify(profile.selected_features || ['digital_menu']);

    // Check if subscription_plan has changed
    const currentPlan = currentData.subscription_plan || 'starter';
    const originalPlan = profile.subscription_plan || 'starter';

    return currentFeatures !== originalFeatures || currentPlan !== originalPlan;
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

  const handleFeatureToggle = (featureId) => {
    if (!isEditing) return;

    const currentFeatures = currentData?.selected_features || [];
    const newFeatures = currentFeatures.includes(featureId)
      ? currentFeatures.filter((f) => f !== featureId)
      : [...currentFeatures, featureId];

    dispatch(updateTabEditData({ tabId, field: 'selected_features', value: newFeatures }));
    dispatch(setFieldTouched({ field: 'selected_features' }));

    // Validate that digital_menu is always selected (required)
    if (featureId === 'digital_menu' && !newFeatures.includes('digital_menu')) {
      dispatch(
        setFieldError({
          field: 'selected_features',
          error: 'Menu Digital é um recurso obrigatório',
        })
      );
    } else {
      dispatch(clearFieldError({ field: 'selected_features' }));
    }
  };

  const handlePlanChange = (planId) => {
    if (!isEditing) return;

    dispatch(updateTabEditData({ tabId, field: 'subscription_plan', value: planId }));
    dispatch(setFieldTouched({ field: 'subscription_plan' }));
  };

  // Calculate recommended plan based on features
  const getRecommendedPlan = () => {
    const totalFeatures = currentData?.selected_features?.length || 0;
    const isMultiLocation = currentData?.business_type === 'multi';

    if (isMultiLocation || totalFeatures >= 6) return 'enterprise';
    if (totalFeatures >= 4) return 'professional';
    return 'starter';
  };

  const currentPlan = currentData?.subscription_plan || getRecommendedPlan();
  const selectedFeatures = currentData?.selected_features || ['digital_menu'];

  if (!currentData) {
    return (
      <div className="tab-content-loading">
        <p>Carregando configurações de recursos...</p>
      </div>
    );
  }

  return (
    <div className="restaurant-features-tab">
      {/* Features Selection Section */}
      <div className="tab-section">
        <div className="section-header">
          <h3 className="section-title">
            Recursos Selecionados
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

        <div className="features-grid">
          {features.map((feature) => {
            const isSelected = selectedFeatures.includes(feature.id);
            const isRequired = feature.required;

            return (
              <button
                key={feature.id}
                type="button"
                className={`feature-card ${isSelected ? 'selected' : ''} ${
                  isRequired ? 'required' : ''
                } ${!isEditing ? 'disabled' : ''}`}
                onClick={() => !isRequired && handleFeatureToggle(feature.id)}
                disabled={!isEditing || isRequired}
              >
                <div className="feature-header">
                  <div className="feature-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !isRequired && handleFeatureToggle(feature.id)}
                      disabled={!isEditing || isRequired}
                    />
                    {isRequired && <span className="required-badge">Obrigatório</span>}
                  </div>
                  <h4 className="feature-name">{feature.name}</h4>
                </div>
                <p className="feature-description">{feature.description}</p>
              </button>
            );
          })}
        </div>

        {fieldErrors.selected_features && touchedFields.selected_features && (
          <div className="field-error">{fieldErrors.selected_features}</div>
        )}
      </div>

      {/* Subscription Plan Section */}
      <div className="tab-section">
        <h3 className="section-title">Plano de Assinatura</h3>

        <div className="plan-recommendation">
          <h4>Plano Recomendado: {subscriptionPlans[getRecommendedPlan()].name}</h4>
          <p>
            Baseado nos recursos selecionados ({selectedFeatures.length} recursos) e tipo de
            negócio.
          </p>
        </div>

        <div className="plans-grid">
          {Object.entries(subscriptionPlans).map(([planId, plan]) => (
            <button
              key={planId}
              type="button"
              className={`plan-card ${currentPlan === planId ? 'selected' : ''} ${
                !isEditing ? 'disabled' : ''
              }`}
              onClick={() => handlePlanChange(planId)}
              disabled={!isEditing}
            >
              <div className="plan-header">
                <div className="plan-radio">
                  <input
                    type="radio"
                    name="subscription_plan"
                    value={planId}
                    checked={currentPlan === planId}
                    onChange={() => handlePlanChange(planId)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="plan-info">
                  <h4 className="plan-name">{plan.name}</h4>
                  <div className="plan-price">R$ {plan.price}/mês</div>
                </div>
              </div>
              <p className="plan-description">{plan.description}</p>
              {planId === getRecommendedPlan() && (
                <div className="recommended-badge">Recomendado</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Features Summary */}
      <div className="tab-section">
        <h3 className="section-title">Resumo de Configuração</h3>

        <div className="features-summary">
          <div className="summary-item">
            <strong>Recursos Ativos:</strong>
            <span>
              {selectedFeatures.length} de {features.length} disponíveis
            </span>
          </div>
          <div className="summary-item">
            <strong>Plano Atual:</strong>
            <span className="plan-current">
              {subscriptionPlans[currentPlan].name} - R$ {subscriptionPlans[currentPlan].price}/mês
            </span>
          </div>
          <div className="summary-item">
            <strong>Recursos Obrigatórios:</strong>
            <span className="required-count">
              {features.filter((f) => f.required && selectedFeatures.includes(f.id)).length} ativos
            </span>
          </div>
        </div>
      </div>

      {!isEditing && (
        <div className="view-mode-info">
          <p className="info-text">
            <span className="info-icon">ℹ️</span>
            Clique em &ldquo;Editar&rdquo; para modificar os recursos e configurações do plano.
          </p>
        </div>
      )}

      {/* Cancel confirmation modal */}
      <UnsavedChangesModal
        isOpen={showCancelModal}
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelModal}
        message="Você tem alterações não salvas nos recursos e planos. Deseja descartar as alterações?"
      />
    </div>
  );
};

RestaurantFeaturesTab.propTypes = {
  onSave: PropTypes.func,
};

export default RestaurantFeaturesTab;
