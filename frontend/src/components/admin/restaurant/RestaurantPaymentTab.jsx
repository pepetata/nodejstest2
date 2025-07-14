import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateEditData,
  setFieldError,
  setFieldTouched,
  clearFieldError,
} from '../../../store/restaurantSlice';
import {
  validateCNPJ,
  validateEmail,
  validatePhone,
  validateBankAccount,
  validatePixKey,
} from '../../../utils/restaurantValidation';
import FormField from '../../common/FormField';

const RestaurantPaymentTab = () => {
  const dispatch = useDispatch();
  const { restaurantData, editData, isEditing, fieldErrors, touchedFields } = useSelector(
    (state) => state.restaurant
  );

  const currentData = isEditing ? editData : restaurantData;
  const paymentData = currentData?.payment || {};
  const billingData = currentData?.billing || {};

  const handleFieldChange = (section, field, value) => {
    if (!isEditing) return;

    dispatch(
      updateEditData({
        field: `${section}.${field}`,
        value,
      })
    );

    const fieldKey = `${section}_${field}`;
    dispatch(setFieldTouched({ field: fieldKey }));

    // Validate field
    let error = null;
    switch (field) {
      case 'cnpj':
        error = validateCNPJ(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      case 'bank_account':
        error = validateBankAccount(value);
        break;
      case 'pix_key':
        error = validatePixKey(value);
        break;
      default:
        if (!value && ['company_name', 'bank_name', 'account_holder'].includes(field)) {
          error = 'Este campo é obrigatório';
        }
        break;
    }

    if (error) {
      dispatch(setFieldError({ field: fieldKey, error }));
    } else {
      dispatch(clearFieldError({ field: fieldKey }));
    }
  };

  const handlePaymentMethodToggle = (method) => {
    if (!isEditing) return;

    const currentMethods = paymentData.accepted_methods || [];
    const newMethods = currentMethods.includes(method)
      ? currentMethods.filter((m) => m !== method)
      : [...currentMethods, method];

    handleFieldChange('payment', 'accepted_methods', newMethods);
  };

  const paymentMethods = [
    { id: 'credit_card', label: 'Cartão de Crédito', icon: '💳' },
    { id: 'debit_card', label: 'Cartão de Débito', icon: '💳' },
    { id: 'cash', label: 'Dinheiro', icon: '💵' },
    { id: 'pix', label: 'PIX', icon: '🔄' },
    { id: 'bank_transfer', label: 'Transferência Bancária', icon: '🏦' },
    { id: 'meal_voucher', label: 'Vale Refeição', icon: '🎫' },
    { id: 'food_voucher', label: 'Vale Alimentação', icon: '🍽️' },
  ];

  const banks = [
    'Banco do Brasil',
    'Bradesco',
    'Caixa Econômica Federal',
    'Itaú',
    'Santander',
    'BTG Pactual',
    'Inter',
    'Nubank',
    'C6 Bank',
    'Banco Original',
    'Banco Safra',
    'Sicoob',
    'Sicredi',
    'Outros',
  ];

  return (
    <div className="restaurant-payment-tab">
      {/* Payment Methods Section */}
      <div className="tab-section">
        <h3 className="section-title">
          <span className="section-icon">💳</span>
          Métodos de Pagamento Aceitos
        </h3>

        <div className="payment-methods-grid">
          {paymentMethods.map((method) => (
            <label key={method.id} className="payment-method-item">
              <input
                type="checkbox"
                checked={(paymentData.accepted_methods || []).includes(method.id)}
                onChange={() => handlePaymentMethodToggle(method.id)}
                disabled={!isEditing}
              />
              <div className="method-content">
                <span className="method-icon">{method.icon}</span>
                <span className="method-label">{method.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Payment Configuration */}
      <div className="tab-section">
        <h3 className="section-title">
          <span className="section-icon">⚙️</span>
          Configurações de Pagamento
        </h3>

        <div className="form-grid">
          <FormField
            label="Taxa de Entrega Padrão (R$)"
            name="default_delivery_fee"
            type="number"
            step="0.01"
            min="0"
            value={paymentData.default_delivery_fee || ''}
            onChange={(e) =>
              handleFieldChange('payment', 'default_delivery_fee', parseFloat(e.target.value) || 0)
            }
            disabled={!isEditing}
            placeholder="5.00"
          />

          <FormField
            label="Valor Mínimo para Entrega (R$)"
            name="minimum_order_value"
            type="number"
            step="0.01"
            min="0"
            value={paymentData.minimum_order_value || ''}
            onChange={(e) =>
              handleFieldChange('payment', 'minimum_order_value', parseFloat(e.target.value) || 0)
            }
            disabled={!isEditing}
            placeholder="25.00"
          />
        </div>

        <div className="form-grid">
          <FormField
            label="Tempo de Entrega Estimado (min)"
            name="estimated_delivery_time"
            type="number"
            min="1"
            value={paymentData.estimated_delivery_time || ''}
            onChange={(e) =>
              handleFieldChange('payment', 'estimated_delivery_time', parseInt(e.target.value) || 0)
            }
            disabled={!isEditing}
            placeholder="45"
          />

          <FormField
            label="Taxa de Serviço (%)"
            name="service_fee_percentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={paymentData.service_fee_percentage || ''}
            onChange={(e) =>
              handleFieldChange(
                'payment',
                'service_fee_percentage',
                parseFloat(e.target.value) || 0
              )
            }
            disabled={!isEditing}
            placeholder="10.00"
          />
        </div>
      </div>

      {/* PIX Configuration */}
      <div className="tab-section">
        <h3 className="section-title">
          <span className="section-icon">🔄</span>
          Configuração PIX
        </h3>

        <div className="form-grid">
          <FormField
            label="Chave PIX"
            name="pix_key"
            type="text"
            value={paymentData.pix_key || ''}
            onChange={(e) => handleFieldChange('payment', 'pix_key', e.target.value)}
            error={fieldErrors.payment_pix_key}
            touched={touchedFields.payment_pix_key}
            disabled={!isEditing}
            placeholder="email@exemplo.com, telefone ou CPF/CNPJ"
            helper="Chave PIX para recebimento de pagamentos"
          />

          <div className="form-field">
            <label className="field-label">Tipo de Chave PIX</label>
            <select
              value={paymentData.pix_key_type || 'email'}
              onChange={(e) => handleFieldChange('payment', 'pix_key_type', e.target.value)}
              disabled={!isEditing}
              className="field-input"
            >
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="random">Chave Aleatória</option>
            </select>
          </div>
        </div>
      </div>

      {/* Billing Information */}
      <div className="tab-section">
        <h3 className="section-title">
          <span className="section-icon">🧾</span>
          Dados de Faturamento
        </h3>

        <div className="form-grid">
          <FormField
            label="Razão Social"
            name="company_name"
            type="text"
            value={billingData.company_name || ''}
            onChange={(e) => handleFieldChange('billing', 'company_name', e.target.value)}
            error={fieldErrors.billing_company_name}
            touched={touchedFields.billing_company_name}
            disabled={!isEditing}
            required
            placeholder="Empresa LTDA"
          />

          <FormField
            label="CNPJ"
            name="cnpj"
            type="text"
            value={billingData.cnpj || ''}
            onChange={(e) => handleFieldChange('billing', 'cnpj', e.target.value)}
            error={fieldErrors.billing_cnpj}
            touched={touchedFields.billing_cnpj}
            disabled={!isEditing}
            required
            placeholder="00.000.000/0001-00"
            maxLength={18}
          />
        </div>

        <div className="form-grid">
          <FormField
            label="E-mail para Faturamento"
            name="email"
            type="email"
            value={billingData.email || ''}
            onChange={(e) => handleFieldChange('billing', 'email', e.target.value)}
            error={fieldErrors.billing_email}
            touched={touchedFields.billing_email}
            disabled={!isEditing}
            required
            placeholder="financeiro@empresa.com"
          />

          <FormField
            label="Telefone Comercial"
            name="phone"
            type="tel"
            value={billingData.phone || ''}
            onChange={(e) => handleFieldChange('billing', 'phone', e.target.value)}
            error={fieldErrors.billing_phone}
            touched={touchedFields.billing_phone}
            disabled={!isEditing}
            required
            placeholder="(11) 3333-4444"
          />
        </div>
      </div>

      {/* Bank Information */}
      <div className="tab-section">
        <h3 className="section-title">
          <span className="section-icon">🏦</span>
          Dados Bancários
        </h3>

        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Banco *</label>
            <select
              value={billingData.bank_name || ''}
              onChange={(e) => handleFieldChange('billing', 'bank_name', e.target.value)}
              disabled={!isEditing}
              className="field-input"
              required
            >
              <option value="">Selecione o banco</option>
              {banks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>

          <FormField
            label="Agência"
            name="bank_agency"
            type="text"
            value={billingData.bank_agency || ''}
            onChange={(e) => handleFieldChange('billing', 'bank_agency', e.target.value)}
            disabled={!isEditing}
            required
            placeholder="0001"
          />
        </div>

        <div className="form-grid">
          <FormField
            label="Conta"
            name="bank_account"
            type="text"
            value={billingData.bank_account || ''}
            onChange={(e) => handleFieldChange('billing', 'bank_account', e.target.value)}
            error={fieldErrors.billing_bank_account}
            touched={touchedFields.billing_bank_account}
            disabled={!isEditing}
            required
            placeholder="12345-6"
          />

          <FormField
            label="Titular da Conta"
            name="account_holder"
            type="text"
            value={billingData.account_holder || ''}
            onChange={(e) => handleFieldChange('billing', 'account_holder', e.target.value)}
            error={fieldErrors.billing_account_holder}
            touched={touchedFields.billing_account_holder}
            disabled={!isEditing}
            required
            placeholder="Nome do titular"
          />
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">Tipo de Conta</label>
            <select
              value={billingData.account_type || 'checking'}
              onChange={(e) => handleFieldChange('billing', 'account_type', e.target.value)}
              disabled={!isEditing}
              className="field-input"
            >
              <option value="checking">Conta Corrente</option>
              <option value="savings">Conta Poupança</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="tab-section">
        <h3 className="section-title">
          <span className="section-icon">📊</span>
          Resumo de Configuração
        </h3>

        <div className="payment-summary">
          <div className="summary-item">
            <strong>Métodos Aceitos:</strong>
            <span>
              {(paymentData.accepted_methods || []).length} de {paymentMethods.length} métodos
            </span>
          </div>

          <div className="summary-item">
            <strong>PIX Configurado:</strong>
            <span className={paymentData.pix_key ? 'status-active' : 'status-inactive'}>
              {paymentData.pix_key ? '✅ Sim' : '❌ Não'}
            </span>
          </div>

          <div className="summary-item">
            <strong>Dados Bancários:</strong>
            <span className={billingData.bank_account ? 'status-active' : 'status-inactive'}>
              {billingData.bank_account ? '✅ Completos' : '❌ Incompletos'}
            </span>
          </div>

          <div className="summary-item">
            <strong>Faturamento:</strong>
            <span className={billingData.cnpj ? 'status-active' : 'status-inactive'}>
              {billingData.cnpj ? '✅ Configurado' : '❌ Pendente'}
            </span>
          </div>
        </div>
      </div>

      {!isEditing && (
        <div className="view-mode-info">
          <p className="info-text">
            <span className="info-icon">ℹ️</span>
            Clique em "Editar" para modificar os dados de pagamento e faturamento.
          </p>
        </div>
      )}
    </div>
  );
};

export default RestaurantPaymentTab;
