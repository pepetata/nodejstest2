// Restaurant profile validation utilities
// Based on validation patterns from register.jsx

export const validateEmail = (email) => {
  if (!email) return 'E-mail é obrigatório';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'E-mail deve ter um formato válido';
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return 'Telefone é obrigatório';
  const phoneRegex = /^[\d\s()+-]+$/;
  if (!phoneRegex.test(phone)) return 'Telefone deve conter apenas números e símbolos válidos';
  if (phone.replace(/\D/g, '').length < 10) return 'Telefone deve ter pelo menos 10 dígitos';
  return null;
};

export const validateWhatsApp = (whatsapp) => {
  if (!whatsapp) return 'WhatsApp é obrigatório';
  const phoneRegex = /^[\d\s()+-]+$/;
  if (!phoneRegex.test(whatsapp)) return 'WhatsApp deve conter apenas números e símbolos válidos';
  if (whatsapp.replace(/\D/g, '').length < 10) return 'WhatsApp deve ter pelo menos 10 dígitos';
  return null;
};

export const validateRestaurantName = (name) => {
  if (!name) return 'Nome do restaurante é obrigatório';
  if (name.length < 2) return 'Nome deve ter pelo menos 2 caracteres';
  if (name.length > 100) return 'Nome deve ter no máximo 100 caracteres';
  return null;
};

export const validateUrlName = (urlName) => {
  if (!urlName) return 'URL é obrigatória';
  const urlRegex = /^[a-z0-9-]+$/;
  if (!urlRegex.test(urlName)) return 'URL deve conter apenas letras minúsculas, números e hífens';
  if (urlName.length < 3) return 'URL deve ter pelo menos 3 caracteres';
  if (urlName.length > 50) return 'URL deve ter no máximo 50 caracteres';
  if (urlName.startsWith('-') || urlName.endsWith('-'))
    return 'URL não pode começar ou terminar com hífen';
  return null;
};

export const validateWebsite = (website) => {
  if (!website) return null; // Website is optional
  const websiteRegex = /^https?:\/\/.+/;
  if (!websiteRegex.test(website)) return 'Website deve começar com http:// ou https://';
  return null;
};

export const validateDescription = (description) => {
  if (!description) return null; // Description is optional
  if (description.length > 500) return 'Descrição deve ter no máximo 500 caracteres';
  return null;
};

export const validateZipCode = (zipCode) => {
  if (!zipCode) return 'CEP é obrigatório';
  const zipRegex = /^\d{5}-?\d{3}$/;
  if (!zipRegex.test(zipCode)) return 'CEP deve ter o formato 00000-000';
  return null;
};

export const validateStreet = (street) => {
  if (!street) return 'Rua é obrigatória';
  if (street.length < 3) return 'Rua deve ter pelo menos 3 caracteres';
  if (street.length > 100) return 'Rua deve ter no máximo 100 caracteres';
  return null;
};

export const validateStreetNumber = (streetNumber) => {
  if (!streetNumber) return 'Número é obrigatório';
  if (streetNumber.length > 10) return 'Número deve ter no máximo 10 caracteres';
  return null;
};

export const validateCity = (city) => {
  if (!city) return 'Cidade é obrigatória';
  if (city.length < 2) return 'Cidade deve ter pelo menos 2 caracteres';
  if (city.length > 50) return 'Cidade deve ter no máximo 50 caracteres';
  return null;
};

export const validateState = (state) => {
  if (!state) return 'Estado é obrigatório';
  if (state.length !== 2) return 'Estado deve ter 2 caracteres (ex: SP)';
  return null;
};

export const validateLocationName = (name) => {
  if (!name) return 'Nome da localização é obrigatório';
  if (name.length < 3) return 'Nome deve ter pelo menos 3 caracteres';
  if (name.length > 100) return 'Nome deve ter no máximo 100 caracteres';
  return null;
};

export const validateLocationUrlName = (urlName) => {
  if (!urlName) return 'URL da localização é obrigatória';
  const urlRegex = /^[a-z0-9-]+$/;
  if (!urlRegex.test(urlName)) return 'URL deve conter apenas letras minúsculas, números e hífens';
  if (urlName.length < 2) return 'URL deve ter pelo menos 2 caracteres';
  if (urlName.length > 30) return 'URL deve ter no máximo 30 caracteres';
  if (urlName.startsWith('-') || urlName.endsWith('-'))
    return 'URL não pode começar ou terminar com hífen';
  return null;
};

export const validateOperatingHours = (hours) => {
  if (!hours) return 'Horários de funcionamento são obrigatórios';

  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  const errors = {};

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  for (const day of days) {
    const dayHours = hours[day];
    if (!dayHours) continue;

    if (!dayHours.closed) {
      if (!dayHours.open) {
        errors[`${day}_open`] = 'Horário de abertura é obrigatório';
      } else if (!timeRegex.test(dayHours.open)) {
        errors[`${day}_open`] = 'Horário deve ter o formato HH:MM';
      }

      if (!dayHours.close) {
        errors[`${day}_close`] = 'Horário de fechamento é obrigatório';
      } else if (!timeRegex.test(dayHours.close)) {
        errors[`${day}_close`] = 'Horário deve ter o formato HH:MM';
      }

      // Check if close time is after open time (considering overnight hours)
      if (
        dayHours.open &&
        dayHours.close &&
        timeRegex.test(dayHours.open) &&
        timeRegex.test(dayHours.close)
      ) {
        const [openHour, openMin] = dayHours.open.split(':').map(Number);
        const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
        const openMinutes = openHour * 60 + openMin;
        const closeMinutes = closeHour * 60 + closeMin;

        // Allow overnight hours (close time can be less than open time)
        if (openMinutes === closeMinutes) {
          errors[`${day}_close`] =
            'Horário de fechamento deve ser diferente do horário de abertura';
        }
      }
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

export const validateSelectedFeatures = (features) => {
  if (!features || !Array.isArray(features)) return 'Recursos selecionados são obrigatórios';
  if (features.length === 0) return 'Pelo menos um recurso deve ser selecionado';
  if (!features.includes('digital_menu')) return 'Menu Digital é um recurso obrigatório';
  return null;
};

// File validation utilities
export const validateImageFile = (file) => {
  if (!file) return 'Arquivo é obrigatório';

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Apenas arquivos JPEG, PNG e WebP são permitidos';
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return 'Arquivo deve ter no máximo 5MB';
  }

  return null;
};

export const validateVideoFile = (file) => {
  if (!file) return 'Arquivo é obrigatório';

  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  if (!allowedTypes.includes(file.type)) {
    return 'Apenas arquivos MP4, WebM e OGG são permitidos';
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return 'Arquivo deve ter no máximo 50MB';
  }

  return null;
};

// CNPJ validation
export const validateCNPJ = (cnpj) => {
  if (!cnpj) return 'CNPJ é obrigatório';

  // Remove non-numeric characters
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  if (cleanCNPJ.length !== 14) return 'CNPJ deve ter 14 dígitos';

  // Basic CNPJ validation algorithm
  if (/^(\d)\1+$/.test(cleanCNPJ)) return 'CNPJ inválido';

  // Calculate first verification digit
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }

  let digit1 = sum % 11;
  digit1 = digit1 < 2 ? 0 : 11 - digit1;

  if (parseInt(cleanCNPJ[12]) !== digit1) return 'CNPJ inválido';

  // Calculate second verification digit
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }

  let digit2 = sum % 11;
  digit2 = digit2 < 2 ? 0 : 11 - digit2;

  if (parseInt(cleanCNPJ[13]) !== digit2) return 'CNPJ inválido';

  return null;
};

// Bank account validation
export const validateBankAccount = (account) => {
  if (!account) return 'Conta bancária é obrigatória';

  // Remove non-alphanumeric characters
  const cleanAccount = account.replace(/[^a-zA-Z0-9]/g, '');

  if (cleanAccount.length < 4) return 'Conta deve ter pelo menos 4 caracteres';
  if (cleanAccount.length > 20) return 'Conta deve ter no máximo 20 caracteres';

  return null;
};

// PIX key validation
export const validatePixKey = (pixKey) => {
  if (!pixKey) return 'Chave PIX é obrigatória';

  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(pixKey)) return null;

  // Phone format (Brazilian)
  const phoneRegex = /^[\d\s()+-]+$/;
  const cleanPhone = pixKey.replace(/\D/g, '');
  if (phoneRegex.test(pixKey) && cleanPhone.length >= 10 && cleanPhone.length <= 11) {
    return null;
  }

  // CPF format
  const cleanCPF = pixKey.replace(/\D/g, '');
  if (cleanCPF.length === 11 && !/^(\d)\1+$/.test(cleanCPF)) {
    return null; // Basic CPF validation
  }

  // CNPJ format
  if (cleanCPF.length === 14 && !/^(\d)\1+$/.test(cleanCPF)) {
    return null; // Basic CNPJ validation
  }

  // Random key format (UUID-like)
  const randomKeyRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (randomKeyRegex.test(pixKey)) return null;

  return 'Chave PIX deve ser um e-mail, telefone, CPF, CNPJ ou chave aleatória válida';
};

// Compound validation function for the entire restaurant profile
export const validateRestaurantProfile = (data) => {
  const errors = {};

  // Basic restaurant info
  const nameError = validateRestaurantName(data.restaurant_name);
  if (nameError) errors.restaurant_name = nameError;

  const urlError = validateUrlName(data.restaurant_url_name);
  if (urlError) errors.restaurant_url_name = urlError;

  const websiteError = validateWebsite(data.website);
  if (websiteError) errors.website = websiteError;

  const descError = validateDescription(data.description);
  if (descError) errors.description = descError;

  // Contact info
  const phoneError = validatePhone(data.phone);
  if (phoneError) errors.phone = phoneError;

  const whatsappError = validateWhatsApp(data.whatsapp);
  if (whatsappError) errors.whatsapp = whatsappError;

  return Object.keys(errors).length > 0 ? errors : null;
};

// Compound validation function for location data
export const validateLocationData = (locationData) => {
  const errors = {};

  // Location basic info
  const nameError = validateLocationName(locationData.name);
  if (nameError) errors.name = nameError;

  const urlError = validateLocationUrlName(locationData.url_name);
  if (urlError) errors.url_name = urlError;

  // Contact info
  const phoneError = validatePhone(locationData.phone);
  if (phoneError) errors.phone = phoneError;

  const whatsappError = validateWhatsApp(locationData.whatsapp);
  if (whatsappError) errors.whatsapp = whatsappError;

  // Address validation
  if (locationData.address) {
    const zipError = validateZipCode(locationData.address.address_zip_code);
    if (zipError) errors['address.address_zip_code'] = zipError;

    const streetError = validateStreet(locationData.address.address_street);
    if (streetError) errors['address.address_street'] = streetError;

    const numberError = validateStreetNumber(locationData.address.address_street_number);
    if (numberError) errors['address.address_street_number'] = numberError;

    const cityError = validateCity(locationData.address.address_city);
    if (cityError) errors['address.address_city'] = cityError;

    const stateError = validateState(locationData.address.address_state);
    if (stateError) errors['address.address_state'] = stateError;
  }

  // Operating hours validation
  const hoursError = validateOperatingHours(locationData.operating_hours);
  if (hoursError) {
    Object.keys(hoursError).forEach((key) => {
      errors[`operating_hours.${key}`] = hoursError[key];
    });
  }

  // Features validation
  const featuresError = validateSelectedFeatures(locationData.selected_features);
  if (featuresError) errors.selected_features = featuresError;

  return Object.keys(errors).length > 0 ? errors : null;
};
