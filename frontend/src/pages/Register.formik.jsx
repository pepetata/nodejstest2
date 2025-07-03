import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../hooks/useAuth';
import '../styles/Auth.scss';
import '../styles/register.scss';

// Validation helper functions
const validateInternationalPhone = (phone) => {
  if (!phone) return false;

  // Remove all non-digit characters except + at the beginning
  const cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    // International format with country code
    const numbersOnly = cleaned.substring(1);

    if (numbersOnly.startsWith('1')) {
      // US/Canada: +1 XXX XXX XXXX (10 digits after country code)
      const withoutCountryCode = numbersOnly.substring(1);
      return (
        withoutCountryCode.length === 10 && /^[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(withoutCountryCode)
      );
    } else if (numbersOnly.startsWith('55')) {
      // Brazil: +55 XX XXXXX-XXXX or +55 XX XXXX-XXXX
      const withoutCountryCode = numbersOnly.substring(2);
      return (
        (withoutCountryCode.length === 10 && /^[1-9][1-9]\d{8}$/.test(withoutCountryCode)) ||
        (withoutCountryCode.length === 11 && /^[1-9][1-9][1-9]\d{8}$/.test(withoutCountryCode))
      );
    } else if (numbersOnly.startsWith('52')) {
      // Mexico: +52 XX XXXX XXXX (10 digits after country code) or +52 1 XX XXXX XXXX (11 digits)
      const withoutCountryCode = numbersOnly.substring(2);
      return (
        (withoutCountryCode.length === 10 && /^[1-9]\d{9}$/.test(withoutCountryCode)) ||
        (withoutCountryCode.length === 11 && /^1[1-9]\d{9}$/.test(withoutCountryCode))
      );
    } else {
      // Generic international number validation (ITU-T E.164 compliant)
      return numbersOnly.length >= 7 && numbersOnly.length <= 15;
    }
  } else {
    // Local format (no country code) - assume Brazilian format for backwards compatibility
    const numbersOnly = cleaned;

    if (numbersOnly.length === 10) {
      // Brazilian landline: XX XXXX-XXXX (area code + 8 digits)
      return /^[1-9][1-9]\d{8}$/.test(numbersOnly);
    } else if (numbersOnly.length === 11) {
      // Brazilian mobile: XX XXXXX-XXXX (area code + 9 digits)
      return /^[1-9][1-9][1-9]\d{8}$/.test(numbersOnly);
    } else {
      // For other local formats, allow 7-15 digits
      return numbersOnly.length >= 7 && numbersOnly.length <= 15 && /^\d+$/.test(numbersOnly);
    }
  }
};

const validateWebsite = (url) => {
  if (!url) return true; // Optional field

  try {
    const urlObj = new URL(url);
    return (
      (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') && urlObj.hostname.includes('.')
    );
  } catch {
    try {
      const urlWithHttps = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(urlWithHttps);
      return (
        (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') &&
        urlObj.hostname.includes('.')
      );
    } catch {
      return false;
    }
  }
};

const validateRestaurantUrlName = (urlName) => {
  if (!urlName) return false;

  const urlPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return (
    urlName.length >= 3 &&
    urlName.length <= 50 &&
    urlPattern.test(urlName) &&
    !urlName.includes('--')
  );
};

const validateCEP = (cep) => {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.length === 8 && /^\d{8}$/.test(cleaned);
};

// Helper function to create conditional validation schema
const createValidationSchema = (currentStep, businessType) => {
  const baseLocationSchema = Yup.object({
    name:
      businessType === 'multi'
        ? Yup.string().required('Nome da localização é obrigatório')
        : Yup.string(),
    urlName:
      businessType === 'multi'
        ? Yup.string()
            .required('Nome da localização para URL é obrigatório')
            .test(
              'valid-url-name',
              'Nome deve ter 3-50 caracteres, apenas letras, números e hífens',
              validateRestaurantUrlName
            )
        : Yup.string(),
    phone: Yup.string()
      .required('Telefone da localização é obrigatório')
      .test(
        'valid-phone',
        'Telefone deve ter formato válido (ex: (11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234)',
        validateInternationalPhone
      ),
    whatsapp: Yup.string().test(
      'valid-whatsapp',
      'WhatsApp deve ter formato válido (ex: (11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234)',
      (value) => !value || validateInternationalPhone(value)
    ),
    address: Yup.object({
      zipCode: Yup.string()
        .required('CEP é obrigatório')
        .test('valid-cep', 'CEP deve ter 8 dígitos (ex: 12345-123)', validateCEP),
      street: Yup.string(),
      streetNumber: Yup.string().required('Número é obrigatório'),
      complement: Yup.string(),
      city: Yup.string(),
      state: Yup.string(),
    }),
    operatingHours: Yup.object(),
    selectedFeatures: Yup.array(),
  });

  const step1Schema = Yup.object({
    ownerName: Yup.string().required('Nome do proprietário é obrigatório'),
    email: Yup.string().email('Email deve ter formato válido').required('Email é obrigatório'),
    password: Yup.string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres')
      .required('Senha é obrigatória'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Senhas devem coincidir')
      .required('Confirmação de senha é obrigatória'),
    phone: Yup.string()
      .required('Telefone é obrigatório')
      .test(
        'valid-phone',
        'Telefone deve ter formato válido (ex: (11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234)',
        validateInternationalPhone
      ),
    whatsapp: Yup.string().test(
      'valid-whatsapp',
      'WhatsApp deve ter formato válido (ex: (11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234)',
      (value) => !value || validateInternationalPhone(value)
    ),
  });

  const step2Schema = Yup.object({
    restaurantName: Yup.string().required('Nome do restaurante é obrigatório'),
    restaurantUrlName: Yup.string()
      .required('Nome para URL é obrigatório')
      .test(
        'valid-url-name',
        'Nome deve ter 3-50 caracteres, apenas letras, números e hífens',
        validateRestaurantUrlName
      ),
    businessType: Yup.string().required(),
    cuisineType: Yup.string().required('Tipo de culinária é obrigatório'),
    website: Yup.string().test(
      'valid-website',
      'Website deve ter formato válido (ex: https://www.exemplo.com)',
      (value) => !value || validateWebsite(value)
    ),
    description: Yup.string(),
  });

  const step3Schema = Yup.object({
    locations: Yup.array().of(baseLocationSchema).min(1, 'Pelo menos uma localização é necessária'),
  });

  const step4Schema = Yup.object({
    subscriptionPlan: Yup.string().required(),
  });

  const step5Schema = Yup.object({
    paymentInfo: Yup.object({
      cardNumber: Yup.string().required('Número do cartão é obrigatório'),
      expiryDate: Yup.string().required('Data de vencimento é obrigatória'),
      cvv: Yup.string().required('CVV é obrigatório'),
      cardholderName: Yup.string().required('Nome do portador é obrigatório'),
    }),
    billingAddress: Yup.object({
      zipCode: Yup.string().when('sameAsRestaurant', {
        is: false,
        then: (schema) => schema.required('CEP de cobrança é obrigatório'),
        otherwise: (schema) => schema,
      }),
      street: Yup.string().when('sameAsRestaurant', {
        is: false,
        then: (schema) => schema.required('Endereço de cobrança é obrigatório'),
        otherwise: (schema) => schema,
      }),
      streetNumber: Yup.string().when('sameAsRestaurant', {
        is: false,
        then: (schema) => schema.required('Número de cobrança é obrigatório'),
        otherwise: (schema) => schema,
      }),
      city: Yup.string().when('sameAsRestaurant', {
        is: false,
        then: (schema) => schema.required('Cidade de cobrança é obrigatória'),
        otherwise: (schema) => schema,
      }),
      state: Yup.string().when('sameAsRestaurant', {
        is: false,
        then: (schema) => schema.required('Estado de cobrança é obrigatório'),
        otherwise: (schema) => schema,
      }),
      sameAsRestaurant: Yup.boolean(),
    }),
    marketingConsent: Yup.boolean(),
  });

  // Return schema based on current step
  switch (currentStep) {
    case 1:
      return step1Schema;
    case 2:
      return step2Schema;
    case 3:
      return step3Schema;
    case 4:
      return step4Schema;
    case 5:
      return step5Schema;
    default:
      return Yup.object();
  }
};

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const cepAsyncError = useRef('');

  // Initial form values
  const initialValues = {
    // Step 1: Account Information
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    whatsapp: '',

    // Step 2: Restaurant Details
    restaurantName: '',
    restaurantUrlName: '',
    businessType: 'single',
    cuisineType: 'American',
    website: '',
    description: '',

    // Step 3: Locations & Hours
    locations: [
      {
        id: 1,
        name: 'Localização Principal',
        urlName: '',
        phone: '',
        whatsapp: '',
        address: {
          zipCode: '',
          street: '',
          streetNumber: '',
          complement: '',
          city: '',
          state: '',
        },
        operatingHours: {
          monday: { open: '09:00', close: '22:00', closed: false },
          tuesday: { open: '09:00', close: '22:00', closed: false },
          wednesday: { open: '09:00', close: '22:00', closed: false },
          thursday: { open: '09:00', close: '22:00', closed: false },
          friday: { open: '09:00', close: '22:00', closed: false },
          saturday: { open: '09:00', close: '22:00', closed: false },
          sunday: { open: '09:00', close: '22:00', closed: false },
          holidays: { open: '10:00', close: '20:00', closed: false },
        },
        selectedFeatures: ['digital_menu'],
      },
    ],

    // Step 4: Features & Plan Selection
    subscriptionPlan: 'starter',

    // Step 5: Payment & Billing
    paymentInfo: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
    },
    billingAddress: {
      zipCode: '',
      street: '',
      streetNumber: '',
      complement: '',
      city: '',
      state: '',
      sameAsRestaurant: true,
    },
    marketingConsent: false,
  };

  // Initialize Formik
  const formik = useFormik({
    initialValues,
    validationSchema: createValidationSchema(currentStep, initialValues.businessType),
    onSubmit: async (values) => {
      if (currentStep < 5) {
        handleNext();
      } else {
        await handleSubmit(values);
      }
    },
    enableReinitialize: true,
  });

  // Scroll to top when component mounts or step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('registerFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        formik.setValues(parsedData);

        const savedStep = localStorage.getItem('registerCurrentStep');
        if (savedStep) {
          setCurrentStep(parseInt(savedStep, 10));
        }
      } catch (error) {
        console.warn('Failed to load saved form data:', error);
      }
    }
  }, []);

  // Auto-save form data to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('registerFormData', JSON.stringify(formik.values));
      localStorage.setItem('registerCurrentStep', currentStep.toString());
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formik.values, currentStep]);

  // Update validation schema when business type or step changes
  useEffect(() => {
    formik.setFieldValue(
      'validationSchema',
      createValidationSchema(currentStep, formik.values.businessType)
    );
  }, [currentStep, formik.values.businessType]);

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
      description: 'Recursos básicos para localizações únicas',
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

  // Helper functions
  const formatRestaurantUrlName = (value) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
  };

  const getRecommendedPlan = () => {
    const totalFeatures = formik.values.locations.reduce((total, location) => {
      return total + location.selectedFeatures.length;
    }, 0);
    const isMultiLocation = formik.values.businessType === 'multi';
    const locationCount = formik.values.locations.length;

    if (isMultiLocation || locationCount > 1 || totalFeatures >= 6) return 'enterprise';
    if (totalFeatures >= 4) return 'professional';
    return 'starter';
  };

  const handleCEPLookup = async (cep, locationIndex) => {
    const cleanedCEP = cep.replace(/\D/g, '');

    if (cleanedCEP.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCEP}/json/`);
        const data = await response.json();

        if (!data.erro) {
          // Auto-fill address fields
          const newLocations = [...formik.values.locations];
          newLocations[locationIndex] = {
            ...newLocations[locationIndex],
            address: {
              ...newLocations[locationIndex].address,
              zipCode: cep,
              street: data.logradouro || '',
              city: data.localidade || '',
              state: data.uf || '',
            },
          };
          formik.setFieldValue('locations', newLocations);
        }
      } catch (error) {
        console.warn('Failed to lookup CEP:', error);
      }
    }
  };

  // Navigation handlers
  const handleNext = async () => {
    // Validate current step
    const currentSchema = createValidationSchema(currentStep, formik.values.businessType);

    try {
      await currentSchema.validate(formik.values, { abortEarly: false });

      // If validation passes, go to next step
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (validationErrors) {
      // Mark all fields as touched to show errors
      const touchedFields = {};
      validationErrors.inner.forEach((error) => {
        touchedFields[error.path] = true;
      });
      formik.setTouched(touchedFields);

      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (values) => {
    try {
      await register(values);
      localStorage.removeItem('registerFormData');
      localStorage.removeItem('registerCurrentStep');
      navigate('/login', {
        state: { message: 'Conta criada com sucesso! Faça login para continuar.' },
      });
    } catch (error) {
      formik.setStatus(error.message || 'Erro ao criar conta. Tente novamente.');
    }
  };

  // Location management
  const addNewLocation = () => {
    if (hasCurrentLocationErrors()) {
      validateCurrentLocationFields();
      return;
    }

    const newLocation = {
      id: Date.now(),
      name: `Localização ${formik.values.locations.length + 1}`,
      urlName: '',
      phone: '',
      whatsapp: '',
      address: {
        zipCode: '',
        street: '',
        streetNumber: '',
        complement: '',
        city: '',
        state: '',
      },
      operatingHours: {
        monday: { open: '09:00', close: '22:00', closed: false },
        tuesday: { open: '09:00', close: '22:00', closed: false },
        wednesday: { open: '09:00', close: '22:00', closed: false },
        thursday: { open: '09:00', close: '22:00', closed: false },
        friday: { open: '09:00', close: '22:00', closed: false },
        saturday: { open: '09:00', close: '22:00', closed: false },
        sunday: { open: '09:00', close: '22:00', closed: false },
        holidays: { open: '10:00', close: '20:00', closed: false },
      },
      selectedFeatures: ['digital_menu'],
    };

    formik.setFieldValue('locations', [...formik.values.locations, newLocation]);
    setCurrentLocationIndex(formik.values.locations.length);
  };

  const removeLocation = (locationId) => {
    if (formik.values.locations.length <= 1) return;

    const newLocations = formik.values.locations.filter((loc) => loc.id !== locationId);
    formik.setFieldValue('locations', newLocations);

    if (currentLocationIndex >= newLocations.length) {
      setCurrentLocationIndex(newLocations.length - 1);
    }
  };

  const hasCurrentLocationErrors = () => {
    const currentLocation = formik.values.locations[currentLocationIndex];
    if (!currentLocation) return false;

    // Check for validation errors specific to current location
    const locationPath = `locations[${currentLocationIndex}]`;
    return Object.keys(formik.errors).some((key) => key.startsWith(locationPath));
  };

  const validateCurrentLocationFields = () => {
    // Force validation of current location by touching all relevant fields
    const locationPath = `locations[${currentLocationIndex}]`;
    const touchedFields = {};

    ['name', 'urlName', 'phone', 'whatsapp', 'address.zipCode', 'address.streetNumber'].forEach(
      (field) => {
        touchedFields[`${locationPath}.${field}`] = true;
      }
    );

    formik.setTouched({ ...formik.touched, ...touchedFields });
    formik.validateForm();
  };

  // Field helpers
  const getFieldError = (fieldName) => {
    const fieldPath = fieldName.startsWith('locations[')
      ? fieldName
      : fieldName.startsWith('location.')
        ? `locations[${currentLocationIndex}].${fieldName.substring(9)}`
        : fieldName;

    return formik.touched[fieldPath] && formik.errors[fieldPath];
  };

  const getFieldErrorClass = (fieldName) => {
    return getFieldError(fieldName) ? 'error' : '';
  };

  const hasFieldError = (fieldName) => {
    return !!getFieldError(fieldName);
  };

  // Rest of the component will be the same render methods...
  // I'll continue with the render methods in the next part

  return (
    <div className="auth-container">
      <div className="auth-card restaurant-registration">
        <h2 className="auth-title">Registre Seu Restaurante</h2>
        <p className="subtitle">
          Junte-se à plataforma à la carte e modernize a experiência do seu restaurante
        </p>

        {/* Progress Bar */}
        <div className="progress-container mb-4">
          <div className="progress-bar" style={{ '--progress': currentStep }}>
            {[
              { step: 1, label: 'Conta' },
              { step: 2, label: 'Restaurante' },
              { step: 3, label: 'Localização' },
              { step: 4, label: 'Recursos' },
              { step: 5, label: 'Pagamento' },
            ].map(({ step, label }) => (
              <div key={step} className={`progress-step ${step <= currentStep ? 'active' : ''}`}>
                <div className="step-number">{step}</div>
                <div className="step-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={formik.handleSubmit}>
          {formik.status && <div className="error-message">{formik.status}</div>}

          {/* Step content will be rendered here */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          {/* Navigation buttons */}
          <div className="form-actions">
            {currentStep > 1 && (
              <button type="button" className="btn btn-secondary" onClick={handlePrevious}>
                Anterior
              </button>
            )}

            <button type="submit" className="btn btn-primary" disabled={formik.isSubmitting}>
              {formik.isSubmitting
                ? 'Processando...'
                : currentStep === 5
                  ? 'Finalizar Cadastro'
                  : 'Próximo Passo'}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p>
            Já tem uma conta? <Link to="/login">Faça login</Link>
          </p>
        </div>
      </div>
    </div>
  );

  // Step render methods would continue here...
  function renderStep1() {
    return (
      <div>
        <h3 className="step-title">Informações da Conta</h3>
        <p className="step-description">Comece criando sua conta de proprietário</p>

        <div className="form-group">
          <label htmlFor="ownerName" className="form-label">
            Nome do Proprietário *
          </label>
          <input
            type="text"
            id="ownerName"
            {...formik.getFieldProps('ownerName')}
            className={`form-input ${getFieldErrorClass('ownerName')}`}
            placeholder="Seu nome completo"
            required
          />
          {hasFieldError('ownerName') && (
            <div className="field-error">{formik.errors.ownerName}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email *
          </label>
          <input
            type="email"
            id="email"
            {...formik.getFieldProps('email')}
            className={`form-input ${getFieldErrorClass('email')}`}
            placeholder="seu.email@exemplo.com"
            required
          />
          {hasFieldError('email') && <div className="field-error">{formik.errors.email}</div>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Senha *
            </label>
            <input
              type="password"
              id="password"
              {...formik.getFieldProps('password')}
              className={`form-input ${getFieldErrorClass('password')}`}
              placeholder="Mínimo 8 caracteres"
              required
            />
            {hasFieldError('password') && (
              <div className="field-error">{formik.errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmar Senha *
            </label>
            <input
              type="password"
              id="confirmPassword"
              {...formik.getFieldProps('confirmPassword')}
              className={`form-input ${getFieldErrorClass('confirmPassword')}`}
              placeholder="Repita sua senha"
              required
            />
            {hasFieldError('confirmPassword') && (
              <div className="field-error">{formik.errors.confirmPassword}</div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Telefone *
            </label>
            <input
              type="tel"
              id="phone"
              {...formik.getFieldProps('phone')}
              className={`form-input ${getFieldErrorClass('phone')}`}
              placeholder="(11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234"
              required
            />
            {hasFieldError('phone') && <div className="field-error">{formik.errors.phone}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="whatsapp" className="form-label">
              WhatsApp (Opcional)
            </label>
            <input
              type="tel"
              id="whatsapp"
              {...formik.getFieldProps('whatsapp')}
              className={`form-input ${getFieldErrorClass('whatsapp')}`}
              placeholder="(11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234"
            />
            {hasFieldError('whatsapp') && (
              <div className="field-error">{formik.errors.whatsapp}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div>
        <h3 className="step-title">Detalhes do Restaurante</h3>
        <p className="step-description">Nos conte sobre seu restaurante</p>

        <div className="form-group">
          <label htmlFor="restaurantName" className="form-label">
            Nome do Restaurante *
          </label>
          <input
            type="text"
            id="restaurantName"
            {...formik.getFieldProps('restaurantName')}
            className={`form-input ${getFieldErrorClass('restaurantName')}`}
            placeholder="Nome do seu restaurante"
            required
          />
          {hasFieldError('restaurantName') && (
            <div className="field-error">{formik.errors.restaurantName}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="restaurantUrlName" className="form-label">
            Nome para URL do Menu *
          </label>
          <input
            type="text"
            id="restaurantUrlName"
            value={formik.values.restaurantUrlName}
            onChange={(e) => {
              const formatted = formatRestaurantUrlName(e.target.value);
              formik.setFieldValue('restaurantUrlName', formatted);
            }}
            onBlur={(e) => {
              const cleanedValue = e.target.value.replace(/^-+|-+$/g, '');
              formik.setFieldValue('restaurantUrlName', cleanedValue);
              formik.setFieldTouched('restaurantUrlName', true);
            }}
            className={`form-input ${getFieldErrorClass('restaurantUrlName')}`}
            placeholder="meu-restaurante"
            required
          />
          <div className="field-help">
            Seus clientes acessarão o menu através do QR Code na URL:{' '}
            <strong>
              {formik.values.restaurantUrlName || '[nome-do-restaurante]'}.alacarteapp.com/menu
            </strong>
          </div>
          {hasFieldError('restaurantUrlName') && (
            <div className="field-error">{formik.errors.restaurantUrlName}</div>
          )}
        </div>

        {/* Business Type Selection */}
        <div className="form-group">
          <label className="form-label">Tipo de Negócio *</label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="businessType"
                value="single"
                checked={formik.values.businessType === 'single'}
                onChange={formik.handleChange}
              />
              <span className="radio-label">Restaurante único</span>
              <span className="radio-description">Uma única localização</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="businessType"
                value="multi"
                checked={formik.values.businessType === 'multi'}
                onChange={formik.handleChange}
              />
              <span className="radio-label">Rede com múltiplas localizações</span>
              <span className="radio-description">Múltiplas localizações com menus únicos</span>
            </label>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cuisineType" className="form-label">
              Tipo de Culinária *
            </label>
            <select
              id="cuisineType"
              {...formik.getFieldProps('cuisineType')}
              className={`form-input ${getFieldErrorClass('cuisineType')}`}
              required
            >
              {cuisineTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {hasFieldError('cuisineType') && (
              <div className="field-error">{formik.errors.cuisineType}</div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="website" className="form-label">
            Website (Opcional)
          </label>
          <input
            type="url"
            id="website"
            {...formik.getFieldProps('website')}
            className={`form-input ${getFieldErrorClass('website')}`}
            placeholder="https://www.seurestaurante.com"
          />
          {hasFieldError('website') && <div className="field-error">{formik.errors.website}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Descrição do Restaurante
          </label>
          <textarea
            id="description"
            {...formik.getFieldProps('description')}
            className="form-input"
            placeholder="Breve descrição do seu restaurante (ajuda com SEO e descoberta de clientes)"
            rows="3"
          />
        </div>
      </div>
    );
  }

  function renderStep3() {
    const currentLocation =
      formik.values.locations[currentLocationIndex] || formik.values.locations[0];

    return (
      <div>
        <h3 className="step-title">Localizações e Horários</h3>
        <p className="step-description">
          {formik.values.businessType === 'multi'
            ? 'Configure cada localização do seu restaurante'
            : 'Comece inserindo seu CEP para preenchimento automático'}
        </p>

        {/* Location Tabs for Multi-location */}
        {formik.values.businessType === 'multi' && (
          <div className="location-tabs">
            <div className="tabs-header">
              {formik.values.locations.map((location, index) => (
                <button
                  key={location.id}
                  type="button"
                  className={`tab-button ${index === currentLocationIndex ? 'active' : ''}`}
                  onClick={() => setCurrentLocationIndex(index)}
                >
                  {location.name}
                  {formik.values.locations.length > 1 && (
                    <button
                      type="button"
                      className="remove-location-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLocation(location.id);
                      }}
                      title="Remover localização"
                    >
                      ×
                    </button>
                  )}
                </button>
              ))}
              <button
                type="button"
                className="add-location-btn"
                onClick={addNewLocation}
                title="Adicionar nova localização"
              >
                + Adicionar Localização
              </button>
            </div>

            {/* Location Name Input */}
            <div className="form-group">
              <label htmlFor="location-name" className="form-label">
                Nome da Localização *
              </label>
              <input
                type="text"
                id="location-name"
                value={currentLocation.name}
                onChange={(e) => {
                  const newLocations = [...formik.values.locations];
                  newLocations[currentLocationIndex].name = e.target.value;
                  formik.setFieldValue('locations', newLocations);
                }}
                onBlur={() => {
                  formik.setFieldTouched(`locations[${currentLocationIndex}].name`, true);
                }}
                className={`form-input ${getFieldErrorClass(`locations[${currentLocationIndex}].name`)}`}
                placeholder="Ex: Centro, Shopping, Filial Norte"
                required
              />
              {hasFieldError(`locations[${currentLocationIndex}].name`) && (
                <div className="field-error">
                  {getFieldError(`locations[${currentLocationIndex}].name`)}
                </div>
              )}
            </div>

            {/* Location URL Name Input */}
            <div className="form-group">
              <label htmlFor="location-url-name" className="form-label">
                Nome da Localização para URL do Menu *
              </label>
              <input
                type="text"
                id="location-url-name"
                value={currentLocation.urlName}
                onChange={(e) => {
                  const formatted = formatRestaurantUrlName(e.target.value);
                  const newLocations = [...formik.values.locations];
                  newLocations[currentLocationIndex].urlName = formatted;
                  formik.setFieldValue('locations', newLocations);
                }}
                onBlur={(e) => {
                  const cleanedValue = e.target.value.replace(/^-+|-+$/g, '');
                  const newLocations = [...formik.values.locations];
                  newLocations[currentLocationIndex].urlName = cleanedValue;
                  formik.setFieldValue('locations', newLocations);
                  formik.setFieldTouched(`locations[${currentLocationIndex}].urlName`, true);
                }}
                className={`form-input ${getFieldErrorClass(`locations[${currentLocationIndex}].urlName`)}`}
                placeholder="centro, shopping, filial-norte"
                required
              />
              <div className="field-help">
                Seus clientes acessarão o menu desta localização através do QR Code na URL:{' '}
                <strong>
                  {currentLocation.urlName || '[nome-da-localização]'}.
                  {formik.values.restaurantUrlName || '[nome-do-restaurante]'}.alacarteapp.com/menu
                </strong>
              </div>
              {hasFieldError(`locations[${currentLocationIndex}].urlName`) && (
                <div className="field-error">
                  {getFieldError(`locations[${currentLocationIndex}].urlName`)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Location Contact Fields */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="location-phone" className="form-label">
              Telefone da Localização *
            </label>
            <input
              type="tel"
              id="location-phone"
              value={currentLocation.phone}
              onChange={(e) => {
                const newLocations = [...formik.values.locations];
                newLocations[currentLocationIndex].phone = e.target.value;
                formik.setFieldValue('locations', newLocations);
              }}
              onBlur={() => {
                formik.setFieldTouched(`locations[${currentLocationIndex}].phone`, true);
              }}
              className={`form-input ${getFieldErrorClass(`locations[${currentLocationIndex}].phone`)}`}
              placeholder="(11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234"
              required
            />
            {hasFieldError(`locations[${currentLocationIndex}].phone`) && (
              <div className="field-error">
                {getFieldError(`locations[${currentLocationIndex}].phone`)}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="location-whatsapp" className="form-label">
              WhatsApp da Localização (Opcional)
            </label>
            <input
              type="tel"
              id="location-whatsapp"
              value={currentLocation.whatsapp}
              onChange={(e) => {
                const newLocations = [...formik.values.locations];
                newLocations[currentLocationIndex].whatsapp = e.target.value;
                formik.setFieldValue('locations', newLocations);
              }}
              onBlur={() => {
                formik.setFieldTouched(`locations[${currentLocationIndex}].whatsapp`, true);
              }}
              className={`form-input ${getFieldErrorClass(`locations[${currentLocationIndex}].whatsapp`)}`}
              placeholder="(11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234"
            />
            {hasFieldError(`locations[${currentLocationIndex}].whatsapp`) && (
              <div className="field-error">
                {getFieldError(`locations[${currentLocationIndex}].whatsapp`)}
              </div>
            )}
          </div>
        </div>

        {/* CEP Field */}
        <div className="form-group">
          <label htmlFor="address.zipCode" className="form-label">
            CEP *
          </label>
          <input
            type="text"
            id="address.zipCode"
            value={currentLocation.address.zipCode}
            onChange={(e) => {
              const newLocations = [...formik.values.locations];
              newLocations[currentLocationIndex].address.zipCode = e.target.value;
              formik.setFieldValue('locations', newLocations);
            }}
            onBlur={async (e) => {
              formik.setFieldTouched(`locations[${currentLocationIndex}].address.zipCode`, true);
              const cep = e.target.value;
              if (validateCEP(cep)) {
                await handleCEPLookup(cep, currentLocationIndex);
              }
            }}
            className={`form-input ${getFieldErrorClass(`locations[${currentLocationIndex}].address.zipCode`)}`}
            placeholder="12345-123"
            maxLength="9"
            required
          />
          {hasFieldError(`locations[${currentLocationIndex}].address.zipCode`) && (
            <div className="field-error">
              {getFieldError(`locations[${currentLocationIndex}].address.zipCode`)}
            </div>
          )}
        </div>

        {/* Street, Number and Complement */}
        <div className="form-row">
          <div className="form-group" style={{ flex: '3' }}>
            <label htmlFor="address.street" className="form-label">
              Logradouro *
            </label>
            <input
              type="text"
              id="address.street"
              value={currentLocation.address.street}
              onChange={(e) => {
                const newLocations = [...formik.values.locations];
                newLocations[currentLocationIndex].address.street = e.target.value;
                formik.setFieldValue('locations', newLocations);
              }}
              className="form-input"
              placeholder="Nome da rua/avenida"
              readOnly={
                !!currentLocation.address.zipCode &&
                !hasFieldError(`locations[${currentLocationIndex}].address.zipCode`)
              }
            />
          </div>

          <div className="form-group" style={{ flex: '1' }}>
            <label htmlFor="address.streetNumber" className="form-label">
              Número *
            </label>
            <input
              type="text"
              id="address.streetNumber"
              value={currentLocation.address.streetNumber}
              onChange={(e) => {
                const newLocations = [...formik.values.locations];
                newLocations[currentLocationIndex].address.streetNumber = e.target.value;
                formik.setFieldValue('locations', newLocations);
              }}
              onBlur={() => {
                formik.setFieldTouched(
                  `locations[${currentLocationIndex}].address.streetNumber`,
                  true
                );
              }}
              className={`form-input ${getFieldErrorClass(`locations[${currentLocationIndex}].address.streetNumber`)}`}
              placeholder="123"
              required
            />
            {hasFieldError(`locations[${currentLocationIndex}].address.streetNumber`) && (
              <div className="field-error">
                {getFieldError(`locations[${currentLocationIndex}].address.streetNumber`)}
              </div>
            )}
          </div>

          <div className="form-group" style={{ flex: '2' }}>
            <label htmlFor="address.complement" className="form-label">
              Complemento
            </label>
            <input
              type="text"
              id="address.complement"
              value={currentLocation.address.complement}
              onChange={(e) => {
                const newLocations = [...formik.values.locations];
                newLocations[currentLocationIndex].address.complement = e.target.value;
                formik.setFieldValue('locations', newLocations);
              }}
              className="form-input"
              placeholder="Apto, Sala, etc."
            />
          </div>
        </div>

        {/* City and State */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="address.city" className="form-label">
              Cidade *
            </label>
            <input
              type="text"
              id="address.city"
              value={currentLocation.address.city}
              onChange={(e) => {
                const newLocations = [...formik.values.locations];
                newLocations[currentLocationIndex].address.city = e.target.value;
                formik.setFieldValue('locations', newLocations);
              }}
              className="form-input"
              placeholder="Nome da cidade"
              readOnly={
                !!currentLocation.address.zipCode &&
                !hasFieldError(`locations[${currentLocationIndex}].address.zipCode`)
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="address.state" className="form-label">
              Estado *
            </label>
            <input
              type="text"
              id="address.state"
              value={currentLocation.address.state}
              onChange={(e) => {
                const newLocations = [...formik.values.locations];
                newLocations[currentLocationIndex].address.state = e.target.value;
                formik.setFieldValue('locations', newLocations);
              }}
              className="form-input"
              placeholder="SP"
              readOnly={
                !!currentLocation.address.zipCode &&
                !hasFieldError(`locations[${currentLocationIndex}].address.zipCode`)
              }
            />
          </div>
        </div>
      </div>
    );
  }

  function renderStep4() {
    const currentLocation =
      formik.values.locations[currentLocationIndex] || formik.values.locations[0];
    const recommendedPlan = getRecommendedPlan();

    return (
      <div>
        <h3 className="step-title">Recursos e Plano</h3>
        <p className="step-description">
          Escolha os recursos para{' '}
          {formik.values.businessType === 'multi' ? 'esta localização' : 'seu restaurante'}
        </p>

        {/* Features Selection */}
        <div className="features-section">
          <h4>Recursos Disponíveis</h4>
          <div className="features-grid">
            {features.map((feature) => (
              <div
                key={feature.id}
                className={`feature-card ${
                  currentLocation.selectedFeatures.includes(feature.id) ? 'selected' : ''
                } ${feature.required ? 'required' : ''}`}
              >
                <label className="feature-label">
                  <input
                    type="checkbox"
                    checked={currentLocation.selectedFeatures.includes(feature.id)}
                    onChange={() => {
                      if (feature.required) return;

                      const newLocations = [...formik.values.locations];
                      const currentFeatures = newLocations[currentLocationIndex].selectedFeatures;

                      if (currentFeatures.includes(feature.id)) {
                        newLocations[currentLocationIndex].selectedFeatures =
                          currentFeatures.filter((f) => f !== feature.id);
                      } else {
                        newLocations[currentLocationIndex].selectedFeatures = [
                          ...currentFeatures,
                          feature.id,
                        ];
                      }

                      formik.setFieldValue('locations', newLocations);
                      formik.setFieldValue('subscriptionPlan', getRecommendedPlan());
                    }}
                    disabled={feature.required}
                  />
                  <span className="feature-name">{feature.name}</span>
                  {feature.required && <span className="required-badge">Obrigatório</span>}
                </label>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Selection */}
        <div className="plan-section">
          <h4>Plano de Assinatura</h4>
          <div className="plans-grid">
            {Object.entries(subscriptionPlans).map(([planId, plan]) => (
              <div
                key={planId}
                className={`plan-card ${formik.values.subscriptionPlan === planId ? 'selected' : ''} ${
                  planId === recommendedPlan ? 'recommended' : ''
                }`}
              >
                <label className="plan-label">
                  <input
                    type="radio"
                    name="subscriptionPlan"
                    value={planId}
                    checked={formik.values.subscriptionPlan === planId}
                    onChange={formik.handleChange}
                  />
                  <div className="plan-header">
                    <span className="plan-name">{plan.name}</span>
                    {planId === recommendedPlan && (
                      <span className="recommended-badge">Recomendado</span>
                    )}
                  </div>
                  <div className="plan-price">R$ {plan.price}/mês</div>
                  <p className="plan-description">{plan.description}</p>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderStep5() {
    return (
      <div>
        <h3 className="step-title">Pagamento e Cobrança</h3>
        <p className="step-description">Finalize seu cadastro com as informações de pagamento</p>

        {/* Payment Information */}
        <div className="payment-section">
          <h4>Informações do Cartão</h4>

          <div className="form-group">
            <label htmlFor="paymentInfo.cardNumber" className="form-label">
              Número do Cartão *
            </label>
            <input
              type="text"
              id="paymentInfo.cardNumber"
              {...formik.getFieldProps('paymentInfo.cardNumber')}
              className={`form-input ${getFieldErrorClass('paymentInfo.cardNumber')}`}
              placeholder="1234 5678 9012 3456"
              required
            />
            {hasFieldError('paymentInfo.cardNumber') && (
              <div className="field-error">{formik.errors.paymentInfo?.cardNumber}</div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="paymentInfo.expiryDate" className="form-label">
                Data de Vencimento *
              </label>
              <input
                type="text"
                id="paymentInfo.expiryDate"
                {...formik.getFieldProps('paymentInfo.expiryDate')}
                className={`form-input ${getFieldErrorClass('paymentInfo.expiryDate')}`}
                placeholder="MM/AA"
                required
              />
              {hasFieldError('paymentInfo.expiryDate') && (
                <div className="field-error">{formik.errors.paymentInfo?.expiryDate}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="paymentInfo.cvv" className="form-label">
                CVV *
              </label>
              <input
                type="text"
                id="paymentInfo.cvv"
                {...formik.getFieldProps('paymentInfo.cvv')}
                className={`form-input ${getFieldErrorClass('paymentInfo.cvv')}`}
                placeholder="123"
                required
              />
              {hasFieldError('paymentInfo.cvv') && (
                <div className="field-error">{formik.errors.paymentInfo?.cvv}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="paymentInfo.cardholderName" className="form-label">
              Nome do Portador *
            </label>
            <input
              type="text"
              id="paymentInfo.cardholderName"
              {...formik.getFieldProps('paymentInfo.cardholderName')}
              className={`form-input ${getFieldErrorClass('paymentInfo.cardholderName')}`}
              placeholder="Nome como aparece no cartão"
              required
            />
            {hasFieldError('paymentInfo.cardholderName') && (
              <div className="field-error">{formik.errors.paymentInfo?.cardholderName}</div>
            )}
          </div>
        </div>

        {/* Billing Address */}
        <div className="billing-section">
          <h4>Endereço de Cobrança</h4>

          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" {...formik.getFieldProps('billingAddress.sameAsRestaurant')} />
              Mesmo endereço do restaurante
            </label>
          </div>

          {!formik.values.billingAddress.sameAsRestaurant && (
            <>
              <div className="form-group">
                <label htmlFor="billingAddress.zipCode" className="form-label">
                  CEP *
                </label>
                <input
                  type="text"
                  id="billingAddress.zipCode"
                  {...formik.getFieldProps('billingAddress.zipCode')}
                  className={`form-input ${getFieldErrorClass('billingAddress.zipCode')}`}
                  placeholder="12345-123"
                  required
                />
                {hasFieldError('billingAddress.zipCode') && (
                  <div className="field-error">{formik.errors.billingAddress?.zipCode}</div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: '3' }}>
                  <label htmlFor="billingAddress.street" className="form-label">
                    Logradouro *
                  </label>
                  <input
                    type="text"
                    id="billingAddress.street"
                    {...formik.getFieldProps('billingAddress.street')}
                    className={`form-input ${getFieldErrorClass('billingAddress.street')}`}
                    placeholder="Nome da rua/avenida"
                    required
                  />
                  {hasFieldError('billingAddress.street') && (
                    <div className="field-error">{formik.errors.billingAddress?.street}</div>
                  )}
                </div>

                <div className="form-group" style={{ flex: '1' }}>
                  <label htmlFor="billingAddress.streetNumber" className="form-label">
                    Número *
                  </label>
                  <input
                    type="text"
                    id="billingAddress.streetNumber"
                    {...formik.getFieldProps('billingAddress.streetNumber')}
                    className={`form-input ${getFieldErrorClass('billingAddress.streetNumber')}`}
                    placeholder="123"
                    required
                  />
                  {hasFieldError('billingAddress.streetNumber') && (
                    <div className="field-error">{formik.errors.billingAddress?.streetNumber}</div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="billingAddress.city" className="form-label">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    id="billingAddress.city"
                    {...formik.getFieldProps('billingAddress.city')}
                    className={`form-input ${getFieldErrorClass('billingAddress.city')}`}
                    placeholder="Nome da cidade"
                    required
                  />
                  {hasFieldError('billingAddress.city') && (
                    <div className="field-error">{formik.errors.billingAddress?.city}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="billingAddress.state" className="form-label">
                    Estado *
                  </label>
                  <input
                    type="text"
                    id="billingAddress.state"
                    {...formik.getFieldProps('billingAddress.state')}
                    className={`form-input ${getFieldErrorClass('billingAddress.state')}`}
                    placeholder="SP"
                    required
                  />
                  {hasFieldError('billingAddress.state') && (
                    <div className="field-error">{formik.errors.billingAddress?.state}</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Marketing Consent */}
        <div className="consent-section">
          <label className="checkbox-label">
            <input type="checkbox" {...formik.getFieldProps('marketingConsent')} />
            Aceito receber comunicações de marketing por email
          </label>
        </div>
      </div>
    );
  }
}

export default RegisterPage;
