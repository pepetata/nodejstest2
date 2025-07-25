import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TermsModal from '../../components/common/TermsModal';
import restaurantService from '../../services/restaurantService';
import '../../styles/Auth.scss';
import '../../styles/register.scss';

function RegisterPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Account Information
    ownerName: 'Flavio Ferreira',
    email: 'flavio_luiz_ferreira@hotmail.com',
    password: '12345678',
    confirmPassword: '12345678',
    phone: '11945471011',
    whatsapp: '11945471011',

    // Step 2: Restaurant Details
    restaurantName: 'Restaurante do Padre',
    restaurantUrlName: 'padre',
    businessType: 'single', // single or multi-location
    cuisineType: 'American',
    website: 'http://www.padre.com',
    description: 'nao tem',

    // Step 3: Locations & Hours (array for multi-location support)
    locations: [
      {
        id: 1,
        name: 'Unidade Principal',
        urlName: 'matriz', // URL-safe name for location
        phone: '1199999999', // Location-specific phone
        whatsapp: '1199999999', // Location-specific WhatsApp
        address: {
          zipCode: '05089-030',
          street: 'rua tal',
          streetNumber: '123',
          complement: 'cj 111',
          city: 'sampa',
          state: 'sp',
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
        selectedFeatures: ['digital_menu'], // Features per location
        is_primary: true, // Always true for single location by default
      },
    ],

    // Step 4: Features & Plan Selection (now handled per location)
    subscriptionPlan: 'starter',

    // Step 5: Payment & Billing
    paymentInfo: {
      cardNumber: 'a',
      expiryDate: 'a',
      cvv: 'a',
      cardholderName: 'a',
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
    marketingConsent: true,
    termsAccepted: true,
    privacyPolicyAccepted: true,
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const cepAsyncError = useRef('');

  // Set document title and scroll to top when component mounts
  useEffect(() => {
    document.title = 'Registre seu Restaurante';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Load saved form data from localStorage
    const savedFormData = localStorage.getItem('registerFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);

        // Also restore current step if saved
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
      localStorage.setItem('registerFormData', JSON.stringify(formData));
      localStorage.setItem('registerCurrentStep', currentStep.toString());
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep]);

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

  // Calculate recommended plan based on features and business type
  const getRecommendedPlan = () => {
    // Calculate total features across all locations
    const totalFeatures = formData.locations.reduce((total, location) => {
      return total + location.selectedFeatures.length;
    }, 0);
    const isMultiLocation = formData.businessType === 'multi';
    const locationCount = formData.locations.length;

    if (isMultiLocation || locationCount > 1 || totalFeatures >= 6) return 'enterprise';
    if (totalFeatures >= 4) return 'professional';
    return 'starter';
  };

  // Check if current location has validation errors
  const hasCurrentLocationErrors = () => {
    const currentLocation = formData.locations[currentLocationIndex];
    if (!currentLocation) return false;

    // Check required fields for the current location
    const errors = [];

    // Validate location name (for multi-location)
    if (formData.businessType === 'multi' && !currentLocation.name?.trim()) {
      errors.push('Nome da unidade é obrigatório');
    }

    // Validate location URL name (for multi-location)
    if (formData.businessType === 'multi' && !currentLocation.urlName?.trim()) {
      errors.push('Nome da unidade para URL é obrigatório');
    }

    // Validate phone
    if (!currentLocation.phone?.trim()) {
      errors.push('Telefone da unidade é obrigatório');
    } else if (!validateInternationalPhone(currentLocation.phone)) {
      errors.push('Telefone da unidade deve estar em formato válido');
    }

    // Validate WhatsApp (if provided)
    if (currentLocation.whatsapp?.trim() && !validateInternationalPhone(currentLocation.whatsapp)) {
      errors.push('WhatsApp da unidade deve estar em formato válido');
    }

    // Validate address fields
    if (!currentLocation.address?.zipCode?.trim()) {
      errors.push('CEP é obrigatório');
    }
    // if (!currentLocation.address?.street?.trim()) {
    //   errors.push('Logradouro é obrigatório');
    // }
    if (!currentLocation.address?.streetNumber?.trim()) {
      errors.push('Número é obrigatório');
    }
    // if (!currentLocation.address?.city?.trim()) {
    //   errors.push('Cidade é obrigatória');
    // }
    // if (!currentLocation.address?.state?.trim()) {
    //   errors.push('Estado é obrigatório');
    // }

    return errors.length > 0;
  };

  // Validate all fields for the current location and highlight errors
  const validateCurrentLocationFields = () => {
    const fieldsToValidate = [
      'location.phone',
      'location.whatsapp',
      'address.zipCode',
      'address.streetNumber',
    ];

    // For multi-location business, also validate location name and URL
    if (formData.businessType === 'multi') {
      fieldsToValidate.push('location.name', 'location.urlName');
    }

    // Mark all fields as touched
    const newTouchedFields = { ...touchedFields };
    fieldsToValidate.forEach((fieldName) => {
      newTouchedFields[fieldName] = true;
    });
    setTouchedFields(newTouchedFields);

    // Validate all fields using centralized validation
    const errors = { ...fieldErrors };
    fieldsToValidate.forEach((fieldName) => {
      const error = validateSingleField(fieldName);
      if (error) {
        errors[fieldName] = error;
      } else {
        delete errors[fieldName];
      }
    });

    setFieldErrors(errors);
  };

  // Helper to check for duplicate urlNames (case-insensitive, trimmed)
  const hasDuplicateLocationUrlNames = (locations) => {
    const seen = new Set();
    for (const loc of locations) {
      if (!loc.urlName) continue;
      const normalized = loc.urlName.trim().toLowerCase();
      if (seen.has(normalized)) return true;
      seen.add(normalized);
    }
    return false;
  };

  // Location management functions
  const addNewLocation = () => {
    // Validate current location and highlight any errors
    validateCurrentLocationFields();

    // Prevent adding new location if current location has errors
    if (hasCurrentLocationErrors()) {
      setError('Por favor, corrija os erros da unidade atual antes de adicionar uma nova.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Prevent duplicate location URL names in multi-location mode
    if (formData.businessType === 'multi') {
      const urlNames = formData.locations
        .map((loc) => loc.urlName?.trim().toLowerCase())
        .filter(Boolean);
      const urlNameSet = new Set(urlNames);
      if (urlNames.length !== urlNameSet.size) {
        setError('Nome da URL da unidade duplicado. Cada unidade deve ter uma URL única.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const newLocation = {
      id: Date.now(), // Simple ID generation
      name: `Localização ${formData.locations.length + 1}`,
      urlName: '', // URL-safe name for location
      phone: '', // Location-specific phone
      whatsapp: '', // Location-specific WhatsApp
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
      selectedFeatures: ['digital_menu'], // Core feature always included
      is_primary: false, // Only the first location is primary
    };

    setFormData((prev) => ({
      ...prev,
      locations: [...prev.locations, newLocation],
    }));

    // Clear any previous error message
    setError('');

    // Switch to the new location
    setCurrentLocationIndex(formData.locations.length);
  };

  const removeLocation = (locationId) => {
    if (formData.locations.length <= 1) return; // Can't remove the last location

    setFormData((prev) => ({
      ...prev,
      locations: prev.locations.filter((loc) => loc.id !== locationId),
    }));

    // Adjust current location index if needed
    if (currentLocationIndex >= formData.locations.length - 1) {
      setCurrentLocationIndex(Math.max(0, formData.locations.length - 2));
    }
  };

  const updateLocationName = (locationId, newName) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations.map((loc) =>
        loc.id === locationId ? { ...loc, name: newName } : loc
      ),
    }));
  };

  // Update location urlName with duplicate check
  const updateLocationUrlName = (locationId, newUrlName) => {
    const formattedUrlName = formatRestaurantUrlName(newUrlName);
    setFormData((prev) => {
      const updatedLocations = prev.locations.map((loc) =>
        loc.id === locationId ? { ...loc, urlName: formattedUrlName } : loc
      );
      // Check for duplicates after update
      let errorMsg = '';
      if (prev.businessType === 'multi' && hasDuplicateLocationUrlNames(updatedLocations)) {
        errorMsg = 'Nome da URL da unidade duplicado. Cada unidade deve ter uma URL única.';
      }
      setFieldErrors((fe) => ({ ...fe, 'location.urlName': errorMsg }));
      return { ...prev, locations: updatedLocations };
    });
  };

  const cleanupLocationUrlName = (locationId, urlName) => {
    const cleanedUrlName = urlName.replace(/^-+|-+$/g, '');
    setFormData((prev) => {
      const updatedLocations = prev.locations.map((loc) =>
        loc.id === locationId ? { ...loc, urlName: cleanedUrlName } : loc
      );
      // Check for duplicates after cleanup
      let errorMsg = '';
      if (prev.businessType === 'multi' && hasDuplicateLocationUrlNames(updatedLocations)) {
        errorMsg = 'Nome da URL da unidade duplicado. Cada unidade deve ter uma URL única.';
      }
      setFieldErrors((fe) => ({ ...fe, 'location.urlName': errorMsg }));
      return { ...prev, locations: updatedLocations };
    });
  };

  // Centralized validation rules
  const validationRules = {
    ownerName: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Nome completo é obrigatório';
        return null;
      },
    },
    email: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Email é obrigatório';
        if (!validateEmail(value))
          return 'Email deve ter um formato válido (ex: usuario@dominio.com)';
        return null;
      },
    },
    password: {
      required: true,
      validate: (value) => {
        if (!value) return 'Senha é obrigatória';
        if (value.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
        return null;
      },
    },
    confirmPassword: {
      required: true,
      validate: (value) => {
        if (!value) return 'Confirmação de senha é obrigatória';
        if (formData.password !== value) return 'As senhas não coincidem';
        return null;
      },
    },
    phone: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Número de telefone é obrigatório';
        if (!validateInternationalPhone(value))
          return 'Telefone deve ter formato válido (ex: (11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234)';
        return null;
      },
    },
    whatsapp: {
      required: false,
      validate: (value) => {
        if (value?.trim() && !validateInternationalPhone(value))
          return 'WhatsApp deve ter formato válido (ex: (11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234)';
        return null;
      },
    },
    restaurantName: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Nome do restaurante é obrigatório';
        return null;
      },
    },
    restaurantUrlName: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Nome para URL é obrigatório';
        if (!validateRestaurantUrlName(value))
          return 'Nome deve ter 3-50 caracteres, apenas letras, números e hífens';
        return null;
      },
    },
    cuisineType: {
      required: true,
      validate: (value) => {
        if (!value) return 'Tipo de culinária é obrigatório';
        return null;
      },
    },
    website: {
      required: false,
      validate: (value) => {
        if (value?.trim() && !validateWebsite(value))
          return 'Website deve ter formato válido (ex: https://www.exemplo.com)';
        return null;
      },
    },
    'location.name': {
      required: true,
      validate: (value) => {
        if (formData.businessType === 'multi' && !value?.trim())
          return 'Nome da unidade é obrigatório';
        return null;
      },
    },
    'location.phone': {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Telefone da unidade é obrigatório';
        if (!validateInternationalPhone(value))
          return 'Telefone deve ter formato válido (ex: (11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234)';
        return null;
      },
    },
    'location.whatsapp': {
      required: false,
      validate: (value) => {
        if (value?.trim() && !validateInternationalPhone(value))
          return 'WhatsApp deve ter formato válido (ex: (11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234)';
        return null;
      },
    },
    'location.urlName': {
      required: true,
      validate: (value) => {
        if (formData.businessType === 'multi' && !value?.trim())
          return 'Nome da unidade para URL é obrigatório';
        if (value && !validateRestaurantUrlName(value))
          return 'Nome deve ter 3-50 caracteres, apenas letras, números e hífens';
        return null;
      },
    },
    'address.zipCode': {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'CEP é obrigatório';
        if (!validateCEP(value)) return 'CEP deve ter 8 dígitos (ex: 12345-123)';
        return null;
      },
    },
    'address.streetNumber': {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Número é obrigatório';
        return null;
      },
    },
    'paymentInfo.cardNumber': {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Número do cartão é obrigatório';
        return null;
      },
    },
    'paymentInfo.expiryDate': {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Data de vencimento é obrigatória';
        return null;
      },
    },
    'paymentInfo.cvv': {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'CVV é obrigatório';
        return null;
      },
    },
    'paymentInfo.cardholderName': {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Nome do portador é obrigatório';
        return null;
      },
    },
    'billingAddress.street': {
      required: true,
      validate: (value) => {
        if (!formData.billingAddress.sameAsRestaurant && !value?.trim())
          return 'Endereço de cobrança é obrigatório';
        return null;
      },
    },
    'billingAddress.streetNumber': {
      required: true,
      validate: (value) => {
        if (!formData.billingAddress.sameAsRestaurant && !value?.trim())
          return 'Número de cobrança é obrigatório';
        return null;
      },
    },
    'billingAddress.city': {
      required: true,
      validate: (value) => {
        if (!formData.billingAddress.sameAsRestaurant && !value?.trim())
          return 'Cidade de cobrança é obrigatória';
        return null;
      },
    },
    'billingAddress.state': {
      required: true,
      validate: (value) => {
        if (!formData.billingAddress.sameAsRestaurant && !value?.trim())
          return 'Estado de cobrança é obrigatório';
        return null;
      },
    },
    'billingAddress.zipCode': {
      required: true,
      validate: (value) => {
        if (!formData.billingAddress.sameAsRestaurant && !value?.trim())
          return 'CEP de cobrança é obrigatório';
        return null;
      },
    },
  };

  // Helper function to get field value
  const getFieldValue = (fieldName) => {
    if (fieldName.startsWith('location.')) {
      const fieldPath = fieldName.substring(9);
      const currentLocation = formData.locations[currentLocationIndex];
      return currentLocation?.[fieldPath];
    }
    if (fieldName.startsWith('address.')) {
      const fieldPath = fieldName.substring(8);
      const currentLocation = formData.locations[currentLocationIndex];
      return currentLocation?.address?.[fieldPath];
    }
    if (fieldName.includes('.')) {
      const [parent, child] = fieldName.split('.');
      return formData[parent]?.[child];
    }
    return formData[fieldName];
  };

  // Centralized validation function
  const validateSingleField = (fieldName) => {
    const rule = validationRules[fieldName];
    if (!rule) return null;

    const value = getFieldValue(fieldName);
    return rule.validate(value);
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

  const validateInternationalPhone = (phone) => {
    // Remove all non-digit characters except + at the beginning
    const cleaned = phone.replace(/[^\d+]/g, '');

    // Handle various international phone formats
    if (cleaned.startsWith('+')) {
      // International format with country code
      const numbersOnly = cleaned.substring(1);

      // Common international patterns:
      // +1 (US/Canada): 10-11 digits after country code
      // +55 (Brazil): 10-11 digits after country code
      // +52 (Mexico): 10-12 digits after country code
      // +44 (UK): 10-11 digits after country code
      // +49 (Germany): 10-12 digits after country code
      // +33 (France): 9-10 digits after country code
      // +34 (Spain): 9 digits after country code
      // +39 (Italy): 9-11 digits after country code
      // +81 (Japan): 10-11 digits after country code
      // +86 (China): 11 digits after country code
      // +91 (India): 10 digits after country code

      if (numbersOnly.length < 7 || numbersOnly.length > 15) {
        return false; // ITU-T E.164 standard: max 15 digits total
      }

      // Validate specific country codes with their patterns
      if (numbersOnly.startsWith('1')) {
        // US/Canada: +1 XXX XXX XXXX (10 digits after country code)
        return numbersOnly.length === 11 && /^1[2-9]\d{9}$/.test(numbersOnly);
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
      } else if (numbersOnly.startsWith('44')) {
        // UK: +44 XXXX XXXXXX (10-11 digits after country code)
        const withoutCountryCode = numbersOnly.substring(2);
        return withoutCountryCode.length >= 10 && withoutCountryCode.length <= 11;
      } else if (numbersOnly.startsWith('49')) {
        // Germany: +49 XXX XXXXXXXX (10-12 digits after country code)
        const withoutCountryCode = numbersOnly.substring(2);
        return withoutCountryCode.length >= 10 && withoutCountryCode.length <= 12;
      } else if (numbersOnly.startsWith('33')) {
        // France: +33 X XX XX XX XX (9-10 digits after country code)
        const withoutCountryCode = numbersOnly.substring(2);
        return withoutCountryCode.length >= 9 && withoutCountryCode.length <= 10;
      } else if (numbersOnly.startsWith('34')) {
        // Spain: +34 XXX XXX XXX (9 digits after country code)
        const withoutCountryCode = numbersOnly.substring(2);
        return withoutCountryCode.length === 9;
      } else if (numbersOnly.startsWith('39')) {
        // Italy: +39 XXX XXX XXXX (9-11 digits after country code)
        const withoutCountryCode = numbersOnly.substring(2);
        return withoutCountryCode.length >= 9 && withoutCountryCode.length <= 11;
      } else if (numbersOnly.startsWith('81')) {
        // Japan: +81 XX XXXX XXXX (10-11 digits after country code)
        const withoutCountryCode = numbersOnly.substring(2);
        return withoutCountryCode.length >= 10 && withoutCountryCode.length <= 11;
      } else if (numbersOnly.startsWith('86')) {
        // China: +86 XXX XXXX XXXX (11 digits after country code)
        const withoutCountryCode = numbersOnly.substring(2);
        return withoutCountryCode.length === 11;
      } else if (numbersOnly.startsWith('91')) {
        // India: +91 XXXXX XXXXX (10 digits after country code)
        const withoutCountryCode = numbersOnly.substring(2);
        return withoutCountryCode.length === 10;
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
    if (url === null || url === undefined || url.trim() === '') return true; // Optional field
    if (typeof url !== 'string') return false;
    if (url.length > 255) return false;
    try {
      const urlObj = new URL(url);
      // Must be http or https
      return (
        (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') &&
        urlObj.hostname.includes('.')
      );
    } catch {
      return false;
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
          // Auto-fill address fields for current location
          setFormData((prev) => ({
            ...prev,
            locations: prev.locations.map((loc, index) =>
              index === currentLocationIndex
                ? {
                    ...loc,
                    address: {
                      ...loc.address,
                      street: data.logradouro || '',
                      city: data.localidade || '',
                      state: data.uf || '',
                      // streetNumber: '', // Clear street number when CEP changes
                      // complement: '', // Clear complement when CEP changes
                    },
                  }
                : loc
            ),
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

  const formatPhoneNumber = (value) => {
    // Handle international format with + prefix
    if (value.startsWith('+')) {
      // Keep the + and format only the numbers
      const numbers = value.substring(1).replace(/\D/g, '');
      if (numbers.length === 0) return '+';

      // For international numbers, apply minimal formatting to preserve readability
      if (numbers.length <= 3) {
        return `+${numbers}`;
      } else if (numbers.length <= 6) {
        return `+${numbers.slice(0, 2)} ${numbers.slice(2)}`;
      } else if (numbers.length <= 10) {
        return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4)}`;
      } else {
        return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 8)}-${numbers.slice(8, 12)}`;
      }
    }

    // Remove all non-digits for local numbers
    const numbers = value.replace(/\D/g, '');

    // Apply Brazilian phone formatting for local numbers
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle phone fields with formatting
    if (
      name === 'phone' ||
      name === 'whatsapp' ||
      name === 'location.phone' ||
      name === 'location.whatsapp'
    ) {
      const formattedValue = formatPhoneNumber(value);

      if (name.startsWith('location.')) {
        const fieldPath = name.substring(9);
        setFormData((prev) => ({
          ...prev,
          locations: prev.locations.map((loc, index) =>
            index === currentLocationIndex
              ? {
                  ...loc,
                  [fieldPath]: formattedValue,
                }
              : loc
          ),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: formattedValue,
        }));
      }
      return;
    }

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
        locations: prev.locations.map((loc, index) =>
          index === currentLocationIndex
            ? {
                ...loc,
                address: {
                  ...loc.address,
                  zipCode: formattedValue,
                },
              }
            : loc
        ),
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

    // Handle location-specific fields
    if (name.startsWith('location.')) {
      const fieldPath = name.substring(9); // Remove 'location.' prefix

      if (fieldPath.includes('.')) {
        const [parent, child] = fieldPath.split('.');
        setFormData((prev) => ({
          ...prev,
          locations: prev.locations.map((loc, index) =>
            index === currentLocationIndex
              ? {
                  ...loc,
                  [parent]: {
                    ...loc[parent],
                    [child]: type === 'checkbox' ? checked : value,
                  },
                }
              : loc
          ),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          locations: prev.locations.map((loc, index) =>
            index === currentLocationIndex
              ? {
                  ...loc,
                  [fieldPath]: type === 'checkbox' ? checked : value,
                }
              : loc
          ),
        }));
      }
      return;
    }

    // Handle legacy address fields (for backward compatibility)
    if (name.includes('.') && name.startsWith('address.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        locations: prev.locations.map((loc, index) =>
          index === currentLocationIndex
            ? {
                ...loc,
                [parent]: {
                  ...loc[parent],
                  [child]: type === 'checkbox' ? checked : value,
                },
              }
            : loc
        ),
      }));
    } else if (name.includes('.')) {
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

      // First validate the CEP format
      const cleanedCEP = value.replace(/\D/g, '');
      if (cleanedCEP.length !== 8) {
        // Show validation error for incomplete CEP
        validateField(name);
      } else {
        // If CEP has 8 digits, try to lookup
        await handleCEPLookup(value);
      }
    } else {
      // Validate the specific field for other fields
      validateField(name);
    }
  };

  const validateField = (fieldName) => {
    const error = validateSingleField(fieldName);
    const errors = { ...fieldErrors };

    if (error) {
      errors[fieldName] = error;
    } else {
      delete errors[fieldName];
    }

    setFieldErrors(errors);
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations.map((loc, index) =>
        index === currentLocationIndex
          ? {
              ...loc,
              operatingHours: {
                ...loc.operatingHours,
                [day]: {
                  ...loc.operatingHours[day],
                  [field]: value,
                },
              },
            }
          : loc
      ),
    }));
  };

  const handleFeatureToggle = (featureId) => {
    if (featureId === 'digital_menu') return; // Can't uncheck required feature

    setFormData((prev) => {
      const updatedLocations = prev.locations.map((loc, index) => {
        if (index === currentLocationIndex) {
          const newFeatures = loc.selectedFeatures.includes(featureId)
            ? loc.selectedFeatures.filter((f) => f !== featureId)
            : [...loc.selectedFeatures, featureId];

          return {
            ...loc,
            selectedFeatures: newFeatures,
          };
        }
        return loc;
      });

      return {
        ...prev,
        locations: updatedLocations,
        subscriptionPlan: getRecommendedPlan(),
      };
    });
  };

  const validateStep = (step) => {
    // Define which fields to validate for each step
    const stepFields = {
      1: ['ownerName', 'email', 'password', 'confirmPassword', 'phone', 'whatsapp'],
      2: ['restaurantName', 'restaurantUrlName', 'cuisineType', 'website'],
      3: (() => {
        const fields = ['location.phone', 'address.zipCode', 'address.streetNumber'];
        if (formData.businessType === 'multi') {
          fields.push('location.name', 'location.urlName');
        }
        return fields;
      })(),
      4: [], // Features validation is handled automatically
      5: (() => {
        const fields = [
          'paymentInfo.cardNumber',
          'paymentInfo.expiryDate',
          'paymentInfo.cvv',
          'paymentInfo.cardholderName',
        ];
        if (!formData.billingAddress.sameAsRestaurant) {
          fields.push(
            'billingAddress.zipCode',
            'billingAddress.street',
            'billingAddress.streetNumber',
            'billingAddress.city',
            'billingAddress.state'
          );
        }
        return fields;
      })(),
    };

    const fieldsToValidate = stepFields[step] || [];
    const errors = {};

    // Special handling for step 3 - check if current location exists
    if (step === 3) {
      const currentLocation = formData.locations[currentLocationIndex];
      if (!currentLocation) {
        errors.location = 'Localização é obrigatória';
        setFieldErrors(errors);
        setError('Por favor, corrija 1 campo obrigatório');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return false;
      }
    }

    // Validate each field using centralized validation
    fieldsToValidate.forEach((fieldName) => {
      const error = validateSingleField(fieldName);
      if (error) {
        errors[fieldName] = error;
      }
    });

    // Special validation for step 5 - terms acceptance
    if (step === 5 && !formData.termsAccepted) {
      errors.termsAccepted = 'Você deve aceitar os termos de serviço para continuar';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Mark all error fields as touched so they show highlighting
      const newTouchedFields = { ...touchedFields };
      Object.keys(errors).forEach((fieldName) => {
        newTouchedFields[fieldName] = true;
      });
      setTouchedFields(newTouchedFields);

      // Set a general error message
      const errorCount = Object.keys(errors).length;
      setError(
        `Por favor, corrija ${errorCount} campo${errorCount > 1 ? 's' : ''} obrigatório${errorCount > 1 ? 's' : ''}`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Focus on first error field after a brief delay
      setTimeout(focusFirstErrorField, 300);

      return false;
    }

    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      // Scroll to top when moving to next step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError('');
    setFieldErrors({});
    setTouchedFields({});
    // Scroll to top when moving to previous step
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Helper function to focus on first error field
  const focusFirstErrorField = () => {
    const firstErrorFieldName = Object.keys(fieldErrors)[0];
    if (firstErrorFieldName) {
      // Convert field name to DOM ID
      const fieldId = firstErrorFieldName.replace('.', '\\.');
      const fieldElement = document.getElementById(fieldId);
      if (fieldElement) {
        fieldElement.focus();
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check for duplicate location urlNames before submit (multi-location)
    if (formData.businessType === 'multi' && hasDuplicateLocationUrlNames(formData.locations)) {
      setError('Nome da URL da unidade duplicado. Cada unidade deve ter uma URL única.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!validateStep(5)) return;
    setIsSubmitting(true);

    try {
      // Prepare role and location assignments for the restaurant administrator
      const roleAssignments = [];

      // For restaurant administrators, they get assigned to all locations
      if (formData.businessType === 'single') {
        // Single location: assign restaurant admin to the only location
        roleAssignments.push({
          role_name: 'restaurant_administrator',
          location_assignments: [
            {
              location_index: 0, // Index in the locations array
              is_primary_location: true, // Single location is always primary
            },
          ],
        });
      } else {
        // Multi-location: assign restaurant admin to all locations
        const locationAssignments = formData.locations.map((location, index) => ({
          location_index: index,
          is_primary_location: index === 0, // First location is primary
        }));

        roleAssignments.push({
          role_name: 'restaurant_administrator',
          location_assignments: locationAssignments,
        });
      }

      const userPayload = {
        full_name: formData.ownerName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        whatsapp: formData.whatsapp, // Include WhatsApp field
        role: 'restaurant_administrator', // Backward compatibility
        status: 'pending',
        role_assignments: roleAssignments, // New role assignment structure
      };
      // Prepare locations with proper is_primary marking
      const processedLocations = formData.locations.map((location, index) => ({
        ...location,
        is_primary: index === 0, // First location is always primary
      }));

      const restaurantPayload = {
        restaurant_name: formData.restaurantName,
        restaurant_url_name: formData.restaurantUrlName,
        business_type: formData.businessType,
        cuisine_type: formData.cuisineType,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        // Ensure website is sent as a plain string (decode if needed)
        website:
          typeof formData.website === 'string'
            ? formData.website.replace(/&#x2F;/g, '/')
            : formData.website,
        description: formData.description,
        locations: processedLocations, // Use processed locations with is_primary
        status: 'pending',
        subscription_plan: getRecommendedPlan(),
        marketing_consent: formData.marketingConsent,
        terms_accepted: formData.termsAccepted,
        userPayload: userPayload,
      };

      console.log(`restaurantPayload=`, restaurantPayload);
      const restaurantRes = await restaurantService.create(restaurantPayload);
      console.log(`restaurant restaurantRes=`, restaurantRes.data.data);
      // const restaurantId = restaurantRes.data.data.id;

      // console.log(`user payload=`, userPayload);
      // await userService.register(userPayload);

      // Clear saved form data on successful registration
      localStorage.removeItem('registerFormData');
      localStorage.removeItem('registerCurrentStep');
      // Show success modal
      setShowSuccessModal(true);
      // Optionally, you can reset the form or redirect after closing the modal
    } catch (err) {
      console.log(`error returned`, err);
      let errorMessage = 'Falha no registro. Por favor, tente novamente.';
      // Check for validation errors from backend (correct path)
      if (err.response?.data?.error?.details?.validationErrors) {
        errorMessage = err.response.data.error.details.validationErrors
          .map((e) => e.message)
          .join(', ');
      } else if (err.response?.data?.error?.validationErrors) {
        // fallback for legacy or other error shape
        errorMessage = err.response.data.error.validationErrors.map((e) => e.message).join(', ');
      } else if (err.response?.data?.error?.message) {
        // fallback for legacy or other error shape
        errorMessage = err.response.data.error.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (err.message.includes('email') && err.message.includes('exists')) {
          errorMessage = 'Este email já está em uso. Tente fazer login ou use outro email.';
        } else if (err.message.includes('validation')) {
          errorMessage = 'Dados inválidos. Verifique os campos e tente novamente.';
        } else {
          errorMessage = err.message;
        }
      } else if (err.response?.data?.error) {
        // Show backend error message for known business logic errors (e.g., URL name taken)
        const backendMsg = err.response.data.error.message;
        const backendField = err.response.data.error.details?.field;
        if (backendMsg === 'URL name is already taken' || backendField === 'restaurant_url_name') {
          errorMessage = 'O nome para URL do restaurante já está em uso. Escolha outro nome.';
        } else {
          errorMessage = backendMsg;
        }
      }
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsSubmitting(false);
    }
  };

  // Progress bar rendering
  const renderProgressBar = () => (
    <div className="progress-container mb-4">
      <div className="progress-bar progress-bar-dynamic">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className={`progress-step ${currentStep >= step ? 'active' : ''}`}>
            <div className="step-number">{step}</div>
            <div className="step-label">
              <span className="label-full">
                {step === 1 && 'Conta'}
                {step === 2 && 'Restaurante'}
                {step === 3 && 'Localização'}
                {step === 4 && 'Recursos'}
                {step === 5 && 'Pagamento'}
              </span>
              <span className="label-short">
                {step === 1 && 'Conta'}
                {step === 2 && 'Rest.'}
                {step === 3 && 'Local'}
                {step === 4 && 'Recur.'}
                {step === 5 && 'Pagam.'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Step rendering functions
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
          placeholder="(11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234"
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
          placeholder="(11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234"
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
          Nome para URL do Restaurante *
        </label>
        {/* Red note: URL name cannot be changed after creation */}
        <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '6px' }}>
          Atenção: este nome não poderá ser alterado após a criação do restaurante.
        </div>
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
          <option value="single">Única unidade</option>
          <option value="multi">Várias unidades</option>
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

  const renderStep3 = () => {
    const currentLocation = formData.locations[currentLocationIndex] || formData.locations[0];

    return (
      <div>
        <h3 className="step-title">Unidades e Horários</h3>
        <p className="step-description">
          {formData.businessType === 'multi'
            ? 'Configure cada unidade do seu restaurante'
            : 'Comece inserindo seu CEP para preenchimento automático'}
        </p>

        {/* Location Tabs for Multi-location */}
        {formData.businessType === 'multi' && (
          <div className="location-tabs">
            <div className="tabs-header">
              {formData.locations.map((location, index) => (
                <button
                  key={location.id}
                  type="button"
                  className={`tab-button ${index === currentLocationIndex ? 'active' : ''}`}
                  onClick={() => setCurrentLocationIndex(index)}
                >
                  {location.name}
                  {formData.locations.length > 1 && (
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
                Nome da Unidade *
              </label>
              <input
                type="text"
                id="location-name"
                value={currentLocation.name}
                onChange={(e) => updateLocationName(currentLocation.id, e.target.value)}
                className="form-input"
                placeholder="Ex: Centro, Shopping, Filial Norte"
                required
              />
            </div>

            {/* Location URL Name Input */}
            <div className={`form-group ${getFieldErrorClass('location.urlName')}`}>
              <label htmlFor="location-url-name" className="form-label">
                Nome da Unidade para URL do Menu *
              </label>
              <input
                type="text"
                id="location-url-name"
                value={currentLocation.urlName}
                onChange={(e) => updateLocationUrlName(currentLocation.id, e.target.value)}
                onBlur={(e) => cleanupLocationUrlName(currentLocation.id, e.target.value)}
                className={`form-input ${getFieldErrorClass('location.urlName')}`}
                placeholder="centro, shopping, filial-norte"
                required
              />
              <div className="field-help">
                Seus clientes acessarão o menu desta localização através do QR Code na URL:{' '}
                <strong>
                  {currentLocation.urlName || '[nome-da-localização]'}.
                  {formData.restaurantUrlName || '[nome-do-restaurante]'}.alacarteapp.com/menu
                </strong>
              </div>
              {hasFieldError('location.urlName') && (
                <div className="field-error">{fieldErrors['location.urlName']}</div>
              )}
            </div>
          </div>
        )}

        {/* Location Contact Fields */}
        <div className="form-row">
          <div className={`form-group ${getFieldErrorClass('location.phone')}`}>
            <label htmlFor="location-phone" className="form-label">
              Telefone da Unidade *
            </label>
            <input
              type="tel"
              id="location-phone"
              name="location.phone"
              value={currentLocation.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${getFieldErrorClass('location.phone')}`}
              placeholder="(11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234"
              required
            />
            {hasFieldError('location.phone') && (
              <div className="field-error">{fieldErrors['location.phone']}</div>
            )}
          </div>

          <div className={`form-group ${getFieldErrorClass('location.whatsapp')}`}>
            <label htmlFor="location-whatsapp" className="form-label">
              WhatsApp da Unidade (Opcional)
            </label>
            <input
              type="tel"
              id="location-whatsapp"
              name="location.whatsapp"
              value={currentLocation.whatsapp}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${getFieldErrorClass('location.whatsapp')}`}
              placeholder="(11) 99999-9999, +55 11 99999-9999, +52 12 1234-1234"
            />
            {hasFieldError('location.whatsapp') && (
              <div className="field-error">{fieldErrors['location.whatsapp']}</div>
            )}
          </div>
        </div>

        {/* CEP Field - First Field */}
        <div className={`form-group ${getFieldErrorClass('address.zipCode')}`}>
          <label htmlFor="address.zipCode" className="form-label">
            CEP *
          </label>
          <input
            type="text"
            id="address.zipCode"
            name="address.zipCode"
            value={currentLocation.address.zipCode}
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
          <div
            className={`form-group ${getFieldErrorClass('address.street')}`}
            style={{ flex: '3' }}
          >
            <label htmlFor="address.street" className="form-label">
              Logradouro *
            </label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={currentLocation.address.street}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${getFieldErrorClass('address.street')}`}
              placeholder="Nome da rua/avenida"
              readOnly={!!currentLocation.address.zipCode && !hasFieldError('address.zipCode')}
              tabIndex={
                !!currentLocation.address.zipCode && !hasFieldError('address.zipCode') ? -1 : 0
              }
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
              value={currentLocation.address.streetNumber}
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
            value={currentLocation.address.complement}
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
              value={currentLocation.address.city}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${getFieldErrorClass('address.city')}`}
              placeholder="Cidade"
              readOnly={!!currentLocation.address.zipCode && !hasFieldError('address.zipCode')}
              tabIndex={
                !!currentLocation.address.zipCode && !hasFieldError('address.zipCode') ? -1 : 0
              }
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
              value={currentLocation.address.state}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${getFieldErrorClass('address.state')}`}
              placeholder="Estado"
              readOnly={!!currentLocation.address.zipCode && !hasFieldError('address.zipCode')}
              tabIndex={
                !!currentLocation.address.zipCode && !hasFieldError('address.zipCode') ? -1 : 0
              }
              required
            />
            {hasFieldError('address.state') && (
              <div className="field-error">{fieldErrors['address.state']}</div>
            )}
          </div>
        </div>

        <div className="operating-hours">
          <h4 className="form-label">Horários de Funcionamento</h4>
          {Object.keys(currentLocation.operatingHours).map((day) => {
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
                    checked={currentLocation.operatingHours[day].closed}
                    onChange={(e) => handleOperatingHoursChange(day, 'closed', e.target.checked)}
                  />
                  <label htmlFor={`${day}-closed`}>Fechado</label>
                  {!currentLocation.operatingHours[day].closed && (
                    <>
                      <input
                        type="time"
                        value={currentLocation.operatingHours[day].open}
                        onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                        className="form-input time-input"
                      />
                      <span>até</span>
                      <input
                        type="time"
                        value={currentLocation.operatingHours[day].close}
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
  };

  const renderStep4 = () => {
    // Fix: define currentLocation for use in this step
    const currentLocation = formData.locations[currentLocationIndex] || formData.locations[0];
    return (
      <div>
        <h3 className="step-title">Recursos e Seleção de Plano</h3>
        <p className="step-description">
          Selecione os recursos desejados e o plano de assinatura para sua localização
        </p>

        {/* Features grid */}
        <div className="features-grid">
          {features.map((feature) => (
            <div key={feature.id} className="feature-card">
              <div className="feature-header">
                <div className="feature-checkbox">
                  <input
                    type="checkbox"
                    id={feature.id}
                    checked={currentLocation.selectedFeatures.includes(feature.id)}
                    onChange={() => handleFeatureToggle(feature.id)}
                    disabled={feature.required}
                  />
                  <label htmlFor={feature.id} className="feature-name">
                    {feature.name}
                    {feature.required && <span className="required-badge"> (Obrigatório)</span>}
                  </label>
                </div>
                <p className="feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="plan-recommendation">
          <h4>Plano Recomendado</h4>
          <div className="plan-card recommended">
            <h5>{subscriptionPlans[getRecommendedPlan()].name}</h5>
            <div className="plan-price">R${subscriptionPlans[getRecommendedPlan()].price}/mês</div>
            <p>{subscriptionPlans[getRecommendedPlan()].description}</p>
            {formData.businessType === 'multi' && (
              <div className="location-summary">
                <p>
                  Total de recursos em todas as unidades:{' '}
                  {formData.locations.reduce(
                    (total, loc) => total + loc.selectedFeatures.length,
                    0
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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

      <div className={`form-group ${hasFieldError('termsAccepted') ? 'error' : ''}`}>
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="termsAccepted"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={handleChange}
            required
          />
          <label htmlFor="termsAccepted">
            Eu li e aceito os{' '}
            <button type="button" className="terms-link" onClick={() => setShowTermsModal(true)}>
              termos de serviço e contrato de assinatura
            </button>{' '}
            *
          </label>
        </div>
        {hasFieldError('termsAccepted') && (
          <div className="field-error">{fieldErrors.termsAccepted}</div>
        )}
      </div>

      <div className="plan-summary">
        <h4>Resumo do Plano</h4>
        <div className="summary-item">
          <span>Plano: {subscriptionPlans[getRecommendedPlan()].name}</span>
          <span>R$ {subscriptionPlans[getRecommendedPlan()].price}/mês</span>
        </div>
        <div className="summary-item">
          <span>
            Recursos:{' '}
            {formData.locations.reduce(
              (total, location) => total + location.selectedFeatures.length,
              0
            )}{' '}
            selecionados
          </span>
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

  // Success Modal
  const renderSuccessModal = () =>
    showSuccessModal && (
      <div className="modal-overlay">
        <div className="modal-content success">
          <h2>Cadastro realizado com sucesso!</h2>
          <p>Seu restaurante e usuário administrador foram criados.</p>
          <p>
            Enviamos um e-mail de confirmação para o endereço informado. Por favor, confirme seu
            e-mail para ativar sua conta.
          </p>
          <p>Após a confirmação, faça login para começar a usar o À La Carte.</p>
          <div className="modal-actions">
            <button
              className="modal-btn"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/');
              }}
            >
              Fechar
            </button>
          </div>
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

            {currentStep < 5 && (
              <button type="button" onClick={nextStep} className="auth-button primary">
                Próximo Passo
              </button>
            )}

            {currentStep === 5 && (
              <button type="submit" className="auth-button primary" disabled={isSubmitting}>
                {isSubmitting ? 'Processando...' : 'Finalizar Registro'}
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

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setFormData((prev) => ({ ...prev, termsAccepted: true }));
          setShowTermsModal(false);
        }}
      />

      {/* Success Modal */}
      {renderSuccessModal()}
    </div>
  );
}

export default RegisterPage;
