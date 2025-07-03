import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Auth.scss';
import '../styles/register.scss';

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Account Information
    ownerName: 'Flavio Ferreira',
    email: 'flavio_luiz_ferreira@hotmail.com',
    password: '12345678',
    confirmPassword: '12345678',
    phone: '11234567890',
    whatsapp: '',

    // Step 2: Restaurant Details
    restaurantName: 'a',
    restaurantUrlName: '',
    businessType: 'single', // single or multi-location
    cuisineType: 'American',
    website: '',
    description: '',

    // Step 3: Location & Hours
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

    // Step 4: Features & Plan Selection
    selectedFeatures: ['digital_menu'], // Core feature always included
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
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const cepAsyncError = useRef('');

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
      name: 'Integração Impressora Cozinha',
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

  // Calculate recommended plan based on features and business type
  const getRecommendedPlan = () => {
    const featureCount = formData.selectedFeatures.length;
    const isMultiLocation = formData.businessType === 'multi';

    if (isMultiLocation || featureCount >= 6) return 'enterprise';
    if (featureCount >= 4) return 'professional';
    return 'starter';
  };

  // Enhanced validation functions
  const validateEmail = (email) => {
    // More comprehensive email validation
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional validation to ensure proper domain structure
    const domain = email.split('@')[1];

    // Domain must have at least one dot and valid TLD
    if (!domain || !domain.includes('.')) {
      return false;
    }

    // Domain parts validation
    const domainParts = domain.split('.');

    // Must have at least 2 parts (domain.tld)
    if (domainParts.length < 2) {
      return false;
    }

    // Each part must be at least 1 character and contain valid characters
    for (const part of domainParts) {
      if (!part || part.length < 1 || !/^[a-zA-Z0-9-]+$/.test(part)) {
        return false;
      }
      // Parts cannot start or end with hyphen
      if (part.startsWith('-') || part.endsWith('-')) {
        return false;
      }
    }

    // TLD (last part) should be at least 2 characters and only letters
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
      return false;
    }

    return true;
  };

  const validateBrazilianPhone = (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Brazilian phone patterns:
    // Mobile: 11 digits (11 9 8888-7777) - with 9th digit
    // Mobile: 11 digits (11 1 2345-1234) - old format still valid in some areas
    // Landline: 10 digits (11 3333-4444)
    // With country code: +55 11 9 8888-7777 (13 digits) or +55 11 3333-4444 (12 digits)

    if (cleaned.length === 10) {
      // Landline: XX XXXX-XXXX (area code + 8 digits)
      return /^[1-9][1-9]\d{8}$/.test(cleaned);
    } else if (cleaned.length === 11) {
      // Mobile: XX XXXXX-XXXX (area code + 9 digits)
      // Can start with 9 (new format) or 1-8 (old format still valid)
      return /^[1-9][1-9][1-9]\d{8}$/.test(cleaned);
    } else if (cleaned.length === 12 && cleaned.startsWith('55')) {
      // International landline: +55 XX XXXX-XXXX
      const withoutCountryCode = cleaned.substring(2);
      return /^[1-9][1-9]\d{8}$/.test(withoutCountryCode);
    } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
      // International mobile: +55 XX XXXXX-XXXX
      const withoutCountryCode = cleaned.substring(2);
      return /^[1-9][1-9][1-9]\d{8}$/.test(withoutCountryCode);
    }

    return false;
  };

  const validateWebsite = (url) => {
    if (!url) return true; // Optional field

    try {
      const urlObj = new URL(url);
      // Check if it's http or https and has a valid domain
      return (
        (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') &&
        urlObj.hostname.includes('.')
      );
    } catch {
      // Try with https prefix if no protocol provided
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

    // URL name should be lowercase, alphanumeric, and hyphens only
    // Must start and end with alphanumeric character
    // Length between 3-50 characters
    const urlPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

    return (
      urlName.length >= 3 &&
      urlName.length <= 50 &&
      urlPattern.test(urlName) &&
      !urlName.includes('--') // No consecutive hyphens
    );
  };

  const formatRestaurantUrlName = (value) => {
    // Convert to lowercase and replace invalid characters
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/-+/g, '-'); // Replace multiple consecutive hyphens with single hyphen
    // Note: Don't remove leading/trailing hyphens during typing - only validate on blur
  };

  const validateCEP = (cep) => {
    // Remove all non-digit characters
    const cleaned = cep.replace(/\D/g, '');
    // Brazilian CEP has exactly 8 digits
    return cleaned.length === 8 && /^\d{8}$/.test(cleaned);
  };

  const handleCEPLookup = async (cep) => {
    const cleanedCEP = cep.replace(/\D/g, '');

    if (cleanedCEP.length === 8) {
      let timeoutId;
      cepAsyncError.current = 'Buscando CEP...';

      // Mark field as touched and show loading message
      setTouchedFields((prev) => ({
        ...prev,
        'address.zipCode': true,
      }));

      setFieldErrors((prev) => ({
        ...prev,
        'address.zipCode': 'Buscando CEP...',
      }));

      try {
        const timeoutPromise = new Promise(
          (_, reject) =>
            (timeoutId = setTimeout(() => reject(new Error('Tempo de resposta excedido')), 5000))
        );

        const fetchPromise = fetch(`https://viacep.com.br/ws/${cleanedCEP}/json/`).then((res) =>
          res.json()
        );

        const data = await Promise.race([fetchPromise, timeoutPromise]);

        if (!data.erro) {
          // Auto-fill address fields
          setFormData((prev) => ({
            ...prev,
            address: {
              ...prev.address,
              street: data.logradouro || '',
              city: data.localidade || '',
              state: data.uf || '',
              streetNumber: '', // Clear street number when CEP changes
              complement: '', // Clear complement when CEP changes
            },
          }));

          // Clear error
          cepAsyncError.current = '';
          setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors['address.zipCode'];
            return newErrors;
          });
        } else {
          cepAsyncError.current = 'CEP não encontrado';
          setFieldErrors((prev) => ({
            ...prev,
            'address.zipCode': 'CEP não encontrado',
          }));
        }
      } catch (err) {
        cepAsyncError.current = 'Erro ao buscar CEP';
        setFieldErrors((prev) => ({
          ...prev,
          'address.zipCode': 'Erro ao buscar CEP',
        }));
      } finally {
        clearTimeout(timeoutId);
      }
    }
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle CEP field specially to clear async errors and format
    if (name === 'address.zipCode') {
      cepAsyncError.current = '';
      // Clear CEP error when user starts typing
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors['address.zipCode'];
        return newErrors;
      });

      // Format CEP as user types
      const formattedValue = formatCEP(value);
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          zipCode: formattedValue,
        },
      }));
      return;
    }

    // Handle restaurant URL name formatting
    if (name === 'restaurantUrlName') {
      const formattedValue = formatRestaurantUrlName(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
      return;
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;

    // Mark field as touched
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Handle restaurant URL name cleanup on blur
    if (name === 'restaurantUrlName' && value) {
      // Clean up leading/trailing hyphens only on blur
      const cleanedValue = value.replace(/^-+|-+$/g, '');
      if (cleanedValue !== value) {
        setFormData((prev) => ({
          ...prev,
          [name]: cleanedValue,
        }));
      }
    }

    // Handle CEP lookup for zipCode field
    if (name === 'address.zipCode' && value) {
      // Clear any previous CEP error when user starts typing
      cepAsyncError.current = '';
      await handleCEPLookup(value);
    } else {
      // Validate the specific field for other fields
      validateField(name);
    }
  };

  const validateField = (fieldName) => {
    const errors = { ...fieldErrors };

    // Clear previous error for this field
    delete errors[fieldName];

    // Validate based on field name
    switch (fieldName) {
      case 'ownerName':
        if (!formData.ownerName?.trim()) {
          errors.ownerName = 'Nome completo é obrigatório';
        }
        break;
      case 'email':
        if (!formData.email?.trim()) {
          errors.email = 'Email é obrigatório';
        } else if (!validateEmail(formData.email)) {
          errors.email = 'Email deve ter um formato válido (ex: usuario@dominio.com)';
        }
        break;
      case 'password':
        if (!formData.password) {
          errors.password = 'Senha é obrigatória';
        } else if (formData.password.length < 8) {
          errors.password = 'A senha deve ter pelo menos 8 caracteres';
        }
        break;
      case 'confirmPassword':
        if (!formData.confirmPassword) {
          errors.confirmPassword = 'Confirmação de senha é obrigatória';
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'As senhas não coincidem';
        }
        break;
      case 'phone':
        if (!formData.phone?.trim()) {
          errors.phone = 'Número de telefone é obrigatório';
        } else if (!validateBrazilianPhone(formData.phone)) {
          errors.phone =
            'Telefone deve ter formato válido (ex: 11 99999-9999, 11 12345-1234, (11) 3333-4444)';
        }
        break;
      case 'whatsapp':
        if (formData.whatsapp?.trim() && !validateBrazilianPhone(formData.whatsapp)) {
          errors.whatsapp = 'WhatsApp deve ter formato válido (ex: 11 99999-9999, 11 12345-1234)';
        }
        break;
      case 'restaurantName':
        if (!formData.restaurantName?.trim()) {
          errors.restaurantName = 'Nome do restaurante é obrigatório';
        }
        break;
      case 'restaurantUrlName':
        if (!formData.restaurantUrlName?.trim()) {
          errors.restaurantUrlName = 'Nome para URL é obrigatório';
        } else if (!validateRestaurantUrlName(formData.restaurantUrlName)) {
          errors.restaurantUrlName =
            'Nome deve ter 3-50 caracteres, apenas letras, números e hífens';
        }
        break;
      case 'cuisineType':
        if (!formData.cuisineType) {
          errors.cuisineType = 'Tipo de culinária é obrigatório';
        }
        break;
      case 'website':
        if (formData.website?.trim() && !validateWebsite(formData.website)) {
          errors.website = 'Website deve ter formato válido (ex: https://www.exemplo.com)';
        }
        break;
      case 'address.street':
        if (!formData.address.street?.trim()) {
          errors['address.street'] = 'Endereço é obrigatório';
        }
        break;
      case 'address.streetNumber':
        if (!formData.address.streetNumber?.trim()) {
          errors['address.streetNumber'] = 'Número é obrigatório';
        }
        break;
      case 'address.city':
        if (!formData.address.city?.trim()) {
          errors['address.city'] = 'Cidade é obrigatória';
        }
        break;
      case 'address.state':
        if (!formData.address.state?.trim()) {
          errors['address.state'] = 'Estado é obrigatório';
        }
        break;
      case 'address.zipCode':
        if (!formData.address.zipCode?.trim()) {
          errors['address.zipCode'] = 'CEP é obrigatório';
        } else if (!validateCEP(formData.address.zipCode)) {
          errors['address.zipCode'] = 'CEP deve ter 8 dígitos (ex: 12345-123)';
        }
        break;
      case 'paymentInfo.cardNumber':
        if (!formData.paymentInfo.cardNumber?.trim()) {
          errors['paymentInfo.cardNumber'] = 'Número do cartão é obrigatório';
        }
        break;
      case 'paymentInfo.expiryDate':
        if (!formData.paymentInfo.expiryDate?.trim()) {
          errors['paymentInfo.expiryDate'] = 'Data de vencimento é obrigatória';
        }
        break;
      case 'paymentInfo.cvv':
        if (!formData.paymentInfo.cvv?.trim()) {
          errors['paymentInfo.cvv'] = 'CVV é obrigatório';
        }
        break;
      case 'paymentInfo.cardholderName':
        if (!formData.paymentInfo.cardholderName?.trim()) {
          errors['paymentInfo.cardholderName'] = 'Nome do portador é obrigatório';
        }
        break;
      case 'billingAddress.street':
        if (!formData.billingAddress.sameAsRestaurant && !formData.billingAddress.street?.trim()) {
          errors['billingAddress.street'] = 'Endereço de cobrança é obrigatório';
        }
        break;
      case 'billingAddress.streetNumber':
        if (
          !formData.billingAddress.sameAsRestaurant &&
          !formData.billingAddress.streetNumber?.trim()
        ) {
          errors['billingAddress.streetNumber'] = 'Número de cobrança é obrigatório';
        }
        break;
      case 'billingAddress.city':
        if (!formData.billingAddress.sameAsRestaurant && !formData.billingAddress.city?.trim()) {
          errors['billingAddress.city'] = 'Cidade de cobrança é obrigatória';
        }
        break;
      case 'billingAddress.state':
        if (!formData.billingAddress.sameAsRestaurant && !formData.billingAddress.state?.trim()) {
          errors['billingAddress.state'] = 'Estado de cobrança é obrigatório';
        }
        break;
      case 'billingAddress.zipCode':
        if (!formData.billingAddress.sameAsRestaurant && !formData.billingAddress.zipCode?.trim()) {
          errors['billingAddress.zipCode'] = 'CEP de cobrança é obrigatório';
        }
        break;
      default:
        break;
    }

    setFieldErrors(errors);
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleFeatureToggle = (featureId) => {
    if (featureId === 'digital_menu') return; // Can't uncheck required feature

    setFormData((prev) => {
      const newFeatures = prev.selectedFeatures.includes(featureId)
        ? prev.selectedFeatures.filter((f) => f !== featureId)
        : [...prev.selectedFeatures, featureId];

      return {
        ...prev,
        selectedFeatures: newFeatures,
        subscriptionPlan: getRecommendedPlan(),
      };
    });
  };

  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 1:
        if (!formData.ownerName?.trim()) {
          errors.ownerName = 'Nome completo é obrigatório';
        }
        if (!formData.email?.trim()) {
          errors.email = 'Email é obrigatório';
        } else if (!validateEmail(formData.email)) {
          errors.email = 'Email deve ter um formato válido (ex: usuario@dominio.com)';
        }
        if (!formData.password) {
          errors.password = 'Senha é obrigatória';
        } else if (formData.password.length < 8) {
          errors.password = 'A senha deve ter pelo menos 8 caracteres';
        }
        if (!formData.confirmPassword) {
          errors.confirmPassword = 'Confirmação de senha é obrigatória';
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'As senhas não coincidem';
        }
        if (!formData.phone?.trim()) {
          errors.phone = 'Número de telefone é obrigatório';
        } else if (!validateBrazilianPhone(formData.phone)) {
          errors.phone =
            'Telefone deve ter formato válido (ex: 11 99999-9999, 11 12345-1234, (11) 3333-4444)';
        }
        if (formData.whatsapp?.trim() && !validateBrazilianPhone(formData.whatsapp)) {
          errors.whatsapp = 'WhatsApp deve ter formato válido (ex: 11 99999-9999, 11 12345-1234)';
        }
        break;

      case 2:
        if (!formData.restaurantName?.trim()) {
          errors.restaurantName = 'Nome do restaurante é obrigatório';
        }
        if (!formData.restaurantUrlName?.trim()) {
          errors.restaurantUrlName = 'Nome para URL é obrigatório';
        } else if (!validateRestaurantUrlName(formData.restaurantUrlName)) {
          errors.restaurantUrlName =
            'Nome deve ter 3-50 caracteres, apenas letras, números e hífens';
        }
        if (!formData.cuisineType) {
          errors.cuisineType = 'Tipo de culinária é obrigatório';
        }
        if (formData.website?.trim() && !validateWebsite(formData.website)) {
          errors.website = 'Website deve ter formato válido (ex: https://www.exemplo.com)';
        }
        break;

      case 3:
        if (!formData.address.zipCode?.trim()) {
          errors['address.zipCode'] = 'CEP é obrigatório';
        }
        if (!formData.address.street?.trim()) {
          errors['address.street'] = 'Endereço é obrigatório';
        }
        if (!formData.address.streetNumber?.trim()) {
          errors['address.streetNumber'] = 'Número é obrigatório';
        }
        if (!formData.address.city?.trim()) {
          errors['address.city'] = 'Cidade é obrigatória';
        }
        if (!formData.address.state?.trim()) {
          errors['address.state'] = 'Estado é obrigatório';
        }
        break;

      case 4:
        // Features validation is handled automatically
        break;

      case 5:
        if (!formData.paymentInfo.cardNumber?.trim()) {
          errors['paymentInfo.cardNumber'] = 'Número do cartão é obrigatório';
        }
        if (!formData.paymentInfo.expiryDate?.trim()) {
          errors['paymentInfo.expiryDate'] = 'Data de vencimento é obrigatória';
        }
        if (!formData.paymentInfo.cvv?.trim()) {
          errors['paymentInfo.cvv'] = 'CVV é obrigatório';
        }
        if (!formData.paymentInfo.cardholderName?.trim()) {
          errors['paymentInfo.cardholderName'] = 'Nome do portador é obrigatório';
        }

        if (!formData.billingAddress.sameAsRestaurant) {
          if (!formData.billingAddress.zipCode?.trim()) {
            errors['billingAddress.zipCode'] = 'CEP de cobrança é obrigatório';
          }
          if (!formData.billingAddress.street?.trim()) {
            errors['billingAddress.street'] = 'Endereço de cobrança é obrigatório';
          }
          if (!formData.billingAddress.streetNumber?.trim()) {
            errors['billingAddress.streetNumber'] = 'Número de cobrança é obrigatório';
          }
          if (!formData.billingAddress.city?.trim()) {
            errors['billingAddress.city'] = 'Cidade de cobrança é obrigatória';
          }
          if (!formData.billingAddress.state?.trim()) {
            errors['billingAddress.state'] = 'Estado de cobrança é obrigatório';
          }
          if (!formData.billingAddress.zipCode?.trim()) {
            errors['billingAddress.zipCode'] = 'CEP de cobrança é obrigatório';
          }
        }
        break;

      default:
        break;
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Set a general error message
      const errorCount = Object.keys(errors).length;
      setError(
        `Por favor, corrija ${errorCount} campo${errorCount > 1 ? 's' : ''} obrigatório${errorCount > 1 ? 's' : ''}`
      );
      return false;
    }

    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError('');
    setFieldErrors({});
    setTouchedFields({});
  };

  // Helper function to check if a field has an error and has been touched
  const hasFieldError = (fieldName) => {
    return (
      fieldErrors[fieldName] && (touchedFields[fieldName] || Object.keys(fieldErrors).length > 0)
    );
  };

  // Helper function to get error class for form elements
  const getFieldErrorClass = (fieldName) => {
    return hasFieldError(fieldName) ? 'error' : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateStep(5)) return;

    try {
      // Call the register function from AuthContext with restaurant data
      await register({
        type: 'restaurant',
        ...formData,
        subscriptionPlan: getRecommendedPlan(),
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Falha no registro. Por favor, tente novamente.');
    }
  };

  const renderProgressBar = () => (
    <div className="progress-container mb-4">
      <div className="progress-bar" style={{ '--progress': currentStep }}>
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className={`progress-step ${currentStep >= step ? 'active' : ''}`}>
            <div className="step-number">{step}</div>
            <div className="step-label">
              {step === 1 && 'Conta'}
              {step === 2 && 'Restaurante'}
              {step === 3 && 'Localização'}
              {step === 4 && 'Recursos'}
              {step === 5 && 'Pagamento'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h3 className="step-title">Informações da Conta</h3>
      <p className="step-description">Vamos começar com suas informações pessoais</p>

      <div className={`form-group ${getFieldErrorClass('ownerName')}`}>
        <label htmlFor="ownerName" className="form-label">
          Nome Completo *
        </label>
        <input
          type="text"
          id="ownerName"
          name="ownerName"
          value={formData.ownerName}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('ownerName')}`}
          placeholder="Digite seu nome completo"
          required
        />
        {hasFieldError('ownerName') && <div className="field-error">{fieldErrors.ownerName}</div>}
      </div>

      <div className={`form-group ${getFieldErrorClass('email')}`}>
        <label htmlFor="email" className="form-label">
          Endereço de Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('email')}`}
          placeholder="Digite seu email"
          required
        />
        {hasFieldError('email') && <div className="field-error">{fieldErrors.email}</div>}
      </div>

      <div className={`form-group ${getFieldErrorClass('phone')}`}>
        <label htmlFor="phone" className="form-label">
          Número de Telefone *
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('phone')}`}
          placeholder="(11) 99999-9999 ou 11 12345-1234"
          required
        />
        {hasFieldError('phone') && <div className="field-error">{fieldErrors.phone}</div>}
      </div>

      <div className={`form-group ${getFieldErrorClass('whatsapp')}`}>
        <label htmlFor="whatsapp" className="form-label">
          WhatsApp (Opcional)
        </label>
        <input
          type="tel"
          id="whatsapp"
          name="whatsapp"
          value={formData.whatsapp}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('whatsapp')}`}
          placeholder="(11) 99999-9999 ou 11 12345-1234"
        />
        {hasFieldError('whatsapp') && <div className="field-error">{fieldErrors.whatsapp}</div>}
      </div>

      <div className={`form-group ${getFieldErrorClass('password')}`}>
        <label htmlFor="password" className="form-label">
          Senha *
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('password')}`}
          placeholder="Digite sua senha"
          required
        />
        {hasFieldError('password') && <div className="field-error">{fieldErrors.password}</div>}
      </div>

      <div className={`form-group ${getFieldErrorClass('confirmPassword')}`}>
        <label htmlFor="confirmPassword" className="form-label">
          Confirmar Senha *
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('confirmPassword')}`}
          placeholder="Confirme sua senha"
          required
        />
        {hasFieldError('confirmPassword') && (
          <div className="field-error">{fieldErrors.confirmPassword}</div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 className="step-title">Detalhes do Restaurante</h3>
      <p className="step-description">Conte-nos sobre seu restaurante</p>

      <div className={`form-group ${getFieldErrorClass('restaurantName')}`}>
        <label htmlFor="restaurantName" className="form-label">
          Nome do Restaurante *
        </label>
        <input
          type="text"
          id="restaurantName"
          name="restaurantName"
          value={formData.restaurantName}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('restaurantName')}`}
          placeholder="Digite o nome do seu restaurante"
          required
        />
        {hasFieldError('restaurantName') && (
          <div className="field-error">{fieldErrors.restaurantName}</div>
        )}
      </div>

      <div className={`form-group ${getFieldErrorClass('restaurantUrlName')}`}>
        <label htmlFor="restaurantUrlName" className="form-label">
          Nome para URL do Menu *
        </label>
        <input
          type="text"
          id="restaurantUrlName"
          name="restaurantUrlName"
          value={formData.restaurantUrlName}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('restaurantUrlName')}`}
          placeholder="nome-do-restaurante"
          required
        />
        <div className="field-help">
          Seus clientes acessarão o menu através do QR Code na URL:{' '}
          <strong>
            {formData.restaurantUrlName || '[nome-do-restaurante]'}.alacarteapp.com/menu
          </strong>
        </div>
        {hasFieldError('restaurantUrlName') && (
          <div className="field-error">{fieldErrors.restaurantUrlName}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="businessType" className="form-label">
          Tipo de Negócio *
        </label>
        <select
          id="businessType"
          name="businessType"
          value={formData.businessType}
          onChange={handleChange}
          className="form-input"
          required
        >
          <option value="single">Localização Única</option>
          <option value="multi">Rede Multi-Localização</option>
        </select>
      </div>

      <div className={`form-group ${getFieldErrorClass('cuisineType')}`}>
        <label htmlFor="cuisineType" className="form-label">
          Tipo de Culinária *
        </label>
        <select
          id="cuisineType"
          name="cuisineType"
          value={formData.cuisineType}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('cuisineType')}`}
          required
        >
          <option value="">Selecione o tipo de culinária</option>
          {cuisineTypes.map((cuisine) => (
            <option key={cuisine} value={cuisine}>
              {cuisine}
            </option>
          ))}
        </select>
        {hasFieldError('cuisineType') && (
          <div className="field-error">{fieldErrors.cuisineType}</div>
        )}
      </div>

      <div className={`form-group ${getFieldErrorClass('website')}`}>
        <label htmlFor="website" className="form-label">
          Website (Opcional)
        </label>
        <input
          type="url"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('website')}`}
          placeholder="https://www.seurestaurante.com"
        />
        {hasFieldError('website') && <div className="field-error">{fieldErrors.website}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Descrição do Restaurante
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-input"
          placeholder="Breve descrição do seu restaurante (ajuda com SEO e descoberta de clientes)"
          rows="3"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 className="step-title">Localização e Horários</h3>
      <p className="step-description">Comece inserindo seu CEP para preenchimento automático</p>

      {/* CEP Field - First Field */}
      <div className={`form-group ${getFieldErrorClass('address.zipCode')}`}>
        <label htmlFor="address.zipCode" className="form-label">
          CEP *
        </label>
        <input
          type="text"
          id="address.zipCode"
          name="address.zipCode"
          value={formData.address.zipCode}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('address.zipCode')}`}
          placeholder="12345-123"
          maxLength="9"
          required
        />
        {hasFieldError('address.zipCode') && (
          <div className="field-error">{fieldErrors['address.zipCode']}</div>
        )}
      </div>

      {/* Street, Number and Complement */}
      <div className="form-row">
        <div className={`form-group ${getFieldErrorClass('address.street')}`} style={{ flex: '3' }}>
          <label htmlFor="address.street" className="form-label">
            Logradouro *
          </label>
          <input
            type="text"
            id="address.street"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${getFieldErrorClass('address.street')}`}
            placeholder="Nome da rua/avenida"
            readOnly={!!formData.address.zipCode && !hasFieldError('address.zipCode')}
            tabIndex={!!formData.address.zipCode && !hasFieldError('address.zipCode') ? -1 : 0}
            required
          />
          {hasFieldError('address.street') && (
            <div className="field-error">{fieldErrors['address.street']}</div>
          )}
        </div>

        <div
          className={`form-group ${getFieldErrorClass('address.streetNumber')}`}
          style={{ flex: '1' }}
        >
          <label htmlFor="address.streetNumber" className="form-label">
            Número *
          </label>
          <input
            type="text"
            id="address.streetNumber"
            name="address.streetNumber"
            value={formData.address.streetNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${getFieldErrorClass('address.streetNumber')}`}
            placeholder="123"
            required
          />
          {hasFieldError('address.streetNumber') && (
            <div className="field-error">{fieldErrors['address.streetNumber']}</div>
          )}
        </div>
      </div>

      <div className={`form-group ${getFieldErrorClass('address.complement')}`}>
        <label htmlFor="address.complement" className="form-label">
          Complemento (Opcional)
        </label>
        <input
          type="text"
          id="address.complement"
          name="address.complement"
          value={formData.address.complement}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('address.complement')}`}
          placeholder="Apartamento, bloco, sala, etc."
        />
        {hasFieldError('address.complement') && (
          <div className="field-error">{fieldErrors['address.complement']}</div>
        )}
      </div>

      {/* City and State - Read-only after CEP lookup */}
      <div className="form-row">
        <div className={`form-group ${getFieldErrorClass('address.city')}`}>
          <label htmlFor="address.city" className="form-label">
            Cidade *
          </label>
          <input
            type="text"
            id="address.city"
            name="address.city"
            value={formData.address.city}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${getFieldErrorClass('address.city')}`}
            placeholder="Cidade"
            readOnly={!!formData.address.zipCode && !hasFieldError('address.zipCode')}
            tabIndex={!!formData.address.zipCode && !hasFieldError('address.zipCode') ? -1 : 0}
            required
          />
          {hasFieldError('address.city') && (
            <div className="field-error">{fieldErrors['address.city']}</div>
          )}
        </div>

        <div className={`form-group ${getFieldErrorClass('address.state')}`}>
          <label htmlFor="address.state" className="form-label">
            Estado *
          </label>
          <input
            type="text"
            id="address.state"
            name="address.state"
            value={formData.address.state}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${getFieldErrorClass('address.state')}`}
            placeholder="Estado"
            readOnly={!!formData.address.zipCode && !hasFieldError('address.zipCode')}
            tabIndex={!!formData.address.zipCode && !hasFieldError('address.zipCode') ? -1 : 0}
            required
          />
          {hasFieldError('address.state') && (
            <div className="field-error">{fieldErrors['address.state']}</div>
          )}
        </div>
      </div>

      <div className="operating-hours">
        <h4 className="form-label">Horários de Funcionamento</h4>
        {Object.keys(formData.operatingHours).map((day) => {
          const dayTranslations = {
            monday: 'Segunda-feira',
            tuesday: 'Terça-feira',
            wednesday: 'Quarta-feira',
            thursday: 'Quinta-feira',
            friday: 'Sexta-feira',
            saturday: 'Sábado',
            sunday: 'Domingo',
            holidays: 'Feriados',
          };

          return (
            <div key={day} className="hours-row">
              <div className="day-label">{dayTranslations[day]}</div>
              <div className="hours-inputs">
                <input
                  type="checkbox"
                  id={`${day}-closed`}
                  checked={formData.operatingHours[day].closed}
                  onChange={(e) => handleOperatingHoursChange(day, 'closed', e.target.checked)}
                />
                <label htmlFor={`${day}-closed`}>Fechado</label>
                {!formData.operatingHours[day].closed && (
                  <>
                    <input
                      type="time"
                      value={formData.operatingHours[day].open}
                      onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                      className="form-input time-input"
                    />
                    <span>até</span>
                    <input
                      type="time"
                      value={formData.operatingHours[day].close}
                      onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                      className="form-input time-input"
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h3 className="step-title">Recursos e Seleção de Plano</h3>
      <p className="step-description">Escolha os recursos que você precisa</p>

      <div className="features-grid">
        {features.map((feature) => (
          <div
            key={feature.id}
            className={`feature-card ${
              formData.selectedFeatures.includes(feature.id) ? 'selected' : ''
            } ${feature.required ? 'required' : ''}`}
          >
            <div className="feature-header">
              <input
                type="checkbox"
                id={feature.id}
                checked={formData.selectedFeatures.includes(feature.id)}
                onChange={() => handleFeatureToggle(feature.id)}
                disabled={feature.required}
              />
              <label htmlFor={feature.id} className="feature-name">
                {feature.name}
                {feature.required && <span className="required-badge"> (Required)</span>}
              </label>
            </div>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="plan-recommendation">
        <h4>Plano Recomendado</h4>
        <div className="plan-card recommended">
          <h5>{subscriptionPlans[getRecommendedPlan()].name}</h5>
          <div className="plan-price">R${subscriptionPlans[getRecommendedPlan()].price}/mês</div>
          <p>{subscriptionPlans[getRecommendedPlan()].description}</p>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h3 className="step-title">Pagamento e Cobrança</h3>
      <p className="step-description">Configuração segura de pagamento para sua assinatura</p>

      <div className={`form-group ${getFieldErrorClass('paymentInfo.cardholderName')}`}>
        <label htmlFor="paymentInfo.cardholderName" className="form-label">
          Nome no Cartão *
        </label>
        <input
          type="text"
          id="paymentInfo.cardholderName"
          name="paymentInfo.cardholderName"
          value={formData.paymentInfo.cardholderName}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('paymentInfo.cardholderName')}`}
          placeholder="Nome no cartão"
          required
        />
        {hasFieldError('paymentInfo.cardholderName') && (
          <div className="field-error">{fieldErrors['paymentInfo.cardholderName']}</div>
        )}
      </div>

      <div className={`form-group ${getFieldErrorClass('paymentInfo.cardNumber')}`}>
        <label htmlFor="paymentInfo.cardNumber" className="form-label">
          Número do Cartão *
        </label>
        <input
          type="text"
          id="paymentInfo.cardNumber"
          name="paymentInfo.cardNumber"
          value={formData.paymentInfo.cardNumber}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`form-input ${getFieldErrorClass('paymentInfo.cardNumber')}`}
          placeholder="1234 5678 9012 3456"
          required
        />
        {hasFieldError('paymentInfo.cardNumber') && (
          <div className="field-error">{fieldErrors['paymentInfo.cardNumber']}</div>
        )}
      </div>

      <div className="form-row">
        <div className={`form-group ${getFieldErrorClass('paymentInfo.expiryDate')}`}>
          <label htmlFor="paymentInfo.expiryDate" className="form-label">
            Data de Validade *
          </label>
          <input
            type="text"
            id="paymentInfo.expiryDate"
            name="paymentInfo.expiryDate"
            value={formData.paymentInfo.expiryDate}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${getFieldErrorClass('paymentInfo.expiryDate')}`}
            placeholder="MM/AA"
            required
          />
          {hasFieldError('paymentInfo.expiryDate') && (
            <div className="field-error">{fieldErrors['paymentInfo.expiryDate']}</div>
          )}
        </div>

        <div className={`form-group ${getFieldErrorClass('paymentInfo.cvv')}`}>
          <label htmlFor="paymentInfo.cvv" className="form-label">
            CVV *
          </label>
          <input
            type="text"
            id="paymentInfo.cvv"
            name="paymentInfo.cvv"
            value={formData.paymentInfo.cvv}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-input ${getFieldErrorClass('paymentInfo.cvv')}`}
            placeholder="123"
            required
          />
          {hasFieldError('paymentInfo.cvv') && (
            <div className="field-error">{fieldErrors['paymentInfo.cvv']}</div>
          )}
        </div>
      </div>

      <div className="form-group">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="billingAddress.sameAsRestaurant"
            name="billingAddress.sameAsRestaurant"
            checked={formData.billingAddress.sameAsRestaurant}
            onChange={handleChange}
          />
          <label htmlFor="billingAddress.sameAsRestaurant">
            Endereço de cobrança igual ao endereço do restaurante
          </label>
        </div>
      </div>

      {!formData.billingAddress.sameAsRestaurant && (
        <>
          <h4>Endereço de Cobrança</h4>
          <div className={`form-group ${getFieldErrorClass('billingAddress.street')}`}>
            <label htmlFor="billingAddress.street" className="form-label">
              Endereço *
            </label>
            <input
              type="text"
              id="billingAddress.street"
              name="billingAddress.street"
              value={formData.billingAddress.street}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${getFieldErrorClass('billingAddress.street')}`}
              placeholder="Rua da Cobrança, 123"
              required
            />
            {hasFieldError('billingAddress.street') && (
              <div className="field-error">{fieldErrors['billingAddress.street']}</div>
            )}
          </div>

          <div className="form-row">
            <div className={`form-group ${getFieldErrorClass('billingAddress.city')}`}>
              <label htmlFor="billingAddress.city" className="form-label">
                Cidade *
              </label>
              <input
                type="text"
                id="billingAddress.city"
                name="billingAddress.city"
                value={formData.billingAddress.city}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${getFieldErrorClass('billingAddress.city')}`}
                placeholder="Cidade"
                required
              />
              {hasFieldError('billingAddress.city') && (
                <div className="field-error">{fieldErrors['billingAddress.city']}</div>
              )}
            </div>

            <div className={`form-group ${getFieldErrorClass('billingAddress.state')}`}>
              <label htmlFor="billingAddress.state" className="form-label">
                Estado *
              </label>
              <input
                type="text"
                id="billingAddress.state"
                name="billingAddress.state"
                value={formData.billingAddress.state}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${getFieldErrorClass('billingAddress.state')}`}
                placeholder="Estado"
                required
              />
              {hasFieldError('billingAddress.state') && (
                <div className="field-error">{fieldErrors['billingAddress.state']}</div>
              )}
            </div>

            <div className={`form-group ${getFieldErrorClass('billingAddress.zipCode')}`}>
              <label htmlFor="billingAddress.zipCode" className="form-label">
                CEP *
              </label>
              <input
                type="text"
                id="billingAddress.zipCode"
                name="billingAddress.zipCode"
                value={formData.billingAddress.zipCode}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${getFieldErrorClass('billingAddress.zipCode')}`}
                placeholder="12345-678"
                required
              />
              {hasFieldError('billingAddress.zipCode') && (
                <div className="field-error">{fieldErrors['billingAddress.zipCode']}</div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="form-group">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="marketingConsent"
            name="marketingConsent"
            checked={formData.marketingConsent}
            onChange={handleChange}
          />
          <label htmlFor="marketingConsent">
            Gostaria de receber atualizações de marketing e ofertas especiais
          </label>
        </div>
      </div>

      <div className="plan-summary">
        <h4>Resumo do Plano</h4>
        <div className="summary-item">
          <span>Plano: {subscriptionPlans[getRecommendedPlan()].name}</span>
          <span>R$ {subscriptionPlans[getRecommendedPlan()].price}/mês</span>
        </div>
        <div className="summary-item">
          <span>Recursos: {formData.selectedFeatures.length} selecionados</span>
        </div>
      </div>

      <div className="security-notice">
        <p>
          🔒 Suas informações de pagamento são criptografadas e seguras. Usamos conformidade PCI
          padrão da indústria.
        </p>
      </div>
    </div>
  );
  return (
    <div className="auth-container">
      <div className="auth-card restaurant-registration">
        <h2 className="auth-title">Registre Seu Restaurante</h2>
        <p className="subtitle">
          Junte-se à plataforma à la carte e modernize a experiência do seu restaurante
        </p>

        {renderProgressBar()}

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={currentStep === 5 ? handleSubmit : (e) => e.preventDefault()}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          <div className="form-actions">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="auth-button secondary">
                Anterior
              </button>
            )}

            {currentStep < 5 ? (
              <button type="button" onClick={nextStep} className="auth-button primary">
                Próximo Passo
              </button>
            ) : (
              <button type="submit" className="auth-button primary">
                Concluir Registro
              </button>
            )}
          </div>

          {currentStep === 1 && (
            <div className="auth-footer">
              <p>
                Já tem uma conta?{' '}
                <Link to="/login" className="auth-link">
                  Entrar
                </Link>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
