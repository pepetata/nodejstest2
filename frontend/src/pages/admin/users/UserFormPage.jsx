import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaArrowLeft,
  FaUser,
  FaPlus,
  FaTrash,
  FaInfoCircle,
} from 'react-icons/fa';
import {
  createUser,
  updateUser,
  fetchUserById,
  fetchRoles,
  fetchLocations,
  selectRoles,
  selectLocations,
} from '../../../store/usersSlice';
import '../../../styles/admin/users/userFormPage.scss';

const UserFormPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const roles = useSelector(selectRoles);
  const locations = useSelector(selectLocations);
  const currentUser = useSelector((state) => state.auth.user);

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    whatsapp: '',
    password: '',
    ...(isEditing && { confirmPassword: '' }), // Add confirmPassword only in edit mode
    role_location_pairs: [], // Start with empty array, will be initialized based on location count
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [originalFormData, setOriginalFormData] = useState(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle beforeunload event to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        return ''; // Required for other browsers
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showUnsavedModal) {
        handleCancelLeave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasUnsavedChanges, showUnsavedModal]);

  // Role display names and descriptions in Portuguese
  const roleDisplayInfo = {
    superadmin: {
      name: 'Super Administrador',
      description: 'Acesso total ao sistema, gerencia todas as funcionalidades',
    },
    restaurant_administrator: {
      name: 'Administrador do Restaurante',
      description: 'Gerencia o restaurante, usuários e configurações',
    },
    location_administrator: {
      name: 'Administrador de unidade',
      description: 'Gerencia uma unidade específica do restaurante',
    },
    manager: {
      name: 'Gerente',
      description: 'Supervisiona operações e equipe',
    },
    waiter: {
      name: 'Garçom',
      description: 'Atende clientes e gerencia pedidos',
    },
    kitchen: {
      name: 'Cozinha',
      description: 'Prepara pedidos e gerencia estoque',
    },
    cashier: {
      name: 'Caixa',
      description: 'Processa pagamentos e fechamento de contas',
    },
    food_runner: {
      name: 'Corredor de Comida',
      description: 'Entrega pratos da cozinha para os clientes',
    },
    kds_operator: {
      name: 'Operador KDS',
      description: 'Gerencia o sistema de display da cozinha',
    },
    pos_operator: {
      name: 'Operador POS',
      description: 'Opera o sistema de ponto de venda',
    },
  };

  // Helper function to deeply compare form data for changes
  const hasFormDataChanged = (current, original) => {
    if (!original) {
      console.log('No original data yet, returning false');
      return false; // No original data yet, so no changes
    }

    // Compare simple fields (ignore password fields as they start empty in edit mode)
    const fieldsToCompare = ['name', 'email', 'username', 'phone', 'whatsapp'];
    for (const field of fieldsToCompare) {
      // Normalize values for comparison (handle null, undefined, empty string)
      const currentValue = current[field] || '';
      const originalValue = original[field] || '';

      // Special case for username: if original is empty and current matches email, consider it unchanged
      if (field === 'username' && originalValue === '' && currentValue !== '') {
        // Check if the username field was auto-populated with the email
        const currentEmail = current.email || '';
        console.log(
          `Checking username vs email: username="${currentValue}", email="${currentEmail}"`
        );
        if (currentValue === currentEmail) {
          console.log(
            `Username field populated with email, considering as unchanged: "${currentValue}"`
          );
          continue;
        }
      }

      if (currentValue !== originalValue) {
        console.log(`Field ${field} changed: "${originalValue}" -> "${currentValue}"`);
        return true;
      }
    }

    // Compare password field only if it has a value (not empty)
    if (current.password && current.password !== '') {
      console.log('Password field has value, marking as changed');
      return true;
    }

    // Compare role_location_pairs (deep comparison)
    if (current.role_location_pairs.length !== original.role_location_pairs.length) {
      console.log(
        'Role pairs length changed:',
        original.role_location_pairs.length,
        '->',
        current.role_location_pairs.length
      );
      return true;
    }

    for (let i = 0; i < current.role_location_pairs.length; i++) {
      const currentPair = current.role_location_pairs[i];
      const originalPair = original.role_location_pairs[i];

      if (currentPair.role_id !== originalPair.role_id) {
        console.log(`Role ${i} changed: "${originalPair.role_id}" -> "${currentPair.role_id}"`);
        return true;
      }

      // Compare location_ids arrays
      if (currentPair.location_ids.length !== originalPair.location_ids.length) {
        console.log(
          `Location IDs length changed for role ${i}:`,
          originalPair.location_ids.length,
          '->',
          currentPair.location_ids.length
        );
        return true;
      }

      const sortedCurrent = [...currentPair.location_ids].sort();
      const sortedOriginal = [...originalPair.location_ids].sort();

      for (let j = 0; j < sortedCurrent.length; j++) {
        if (sortedCurrent[j] !== sortedOriginal[j]) {
          console.log(
            `Location ID ${j} changed for role ${i}: "${sortedOriginal[j]}" -> "${sortedCurrent[j]}"`
          );
          return true;
        }
      }
    }

    console.log('No changes detected');
    return false; // No changes detected
  };

  // Filter roles based on current user permissions and exclude already selected roles
  const getAvailableRoles = (currentPairIndex = null) => {
    if (!currentUser || !roles.length) return [];

    let availableRoles = [];

    // Use the correct property name for the current user's role
    const currentUserRole = currentUser.role || currentUser.primaryRole?.role_name;

    // If current user is superadmin, show all roles except superadmin
    if (currentUserRole === 'superadmin') {
      availableRoles = roles.filter((role) => role.name !== 'superadmin');
    }
    // If current user is restaurant_administrator, show restaurant_administrator and below
    else if (currentUserRole === 'restaurant_administrator') {
      availableRoles = roles.filter((role) => role.name !== 'superadmin');
    }
    // If current user is location_administrator, they cannot see restaurant_administrator or superadmin
    else if (currentUserRole === 'location_administrator') {
      availableRoles = roles.filter(
        (role) => role.name !== 'superadmin' && role.name !== 'restaurant_administrator'
      );
    }
    // For other roles, show only roles below their level
    else {
      availableRoles = roles.filter(
        (role) =>
          role.name !== 'superadmin' &&
          role.name !== 'restaurant_administrator' &&
          role.name !== 'location_administrator'
      );
    }

    // Filter out already selected roles (except for the current role being edited)
    const selectedRoleIds = formData.role_location_pairs
      .map((pair, index) => (index !== currentPairIndex ? pair.role_id : null))
      .filter(Boolean);

    const finalRoles = availableRoles.filter((role) => !selectedRoleIds.includes(role.id));

    return finalRoles;
  };

  // Load user data if editing
  useEffect(() => {
    // Load roles and locations if not already loaded
    if (!roles.length) {
      dispatch(fetchRoles());
    }
    if (!locations.length) {
      dispatch(fetchLocations());
    }
  }, [roles.length, locations.length, dispatch]);

  // Initialize role_location_pairs based on location count (only for new users)
  useEffect(() => {
    if (!isEditing && locations.length > 0 && formData.role_location_pairs.length === 0) {
      if (locations.length === 1) {
        // Single location: start with empty array (roles will be added via checkboxes)
        setFormData((prev) => ({
          ...prev,
          role_location_pairs: [],
        }));
      } else {
        // Multi-location: start with one empty pair
        setFormData((prev) => ({
          ...prev,
          role_location_pairs: [{ role_id: '', location_ids: [] }],
        }));
      }
    }
  }, [locations.length, isEditing, formData.role_location_pairs.length]);

  // Separate useEffect for loading user data to avoid infinite loops
  useEffect(() => {
    if (isEditing && id && roles.length > 0) {
      // Use fetchUserById instead of relying on users array
      dispatch(fetchUserById(id))
        .unwrap()
        .then((response) => {
          // Extract the actual user data from the API response
          const foundUser = response.data;
          setUser(foundUser);

          const processedRoles =
            foundUser.role_location_pairs?.length > 0
              ? foundUser.role_location_pairs.reduce((acc, pair) => {
                  // Group by role_id and collect location_ids
                  const existingRole = acc.find(
                    (item) => item.role_id === pair.role_id?.toString()
                  );
                  if (existingRole) {
                    existingRole.location_ids.push(pair.location_id?.toString());
                  } else {
                    acc.push({
                      role_id: pair.role_id?.toString() || '',
                      location_ids: [pair.location_id?.toString() || ''],
                    });
                  }
                  return acc;
                }, [])
              : [{ role_id: '', location_ids: [] }];

          const newFormData = {
            name: foundUser.full_name || '',
            email: foundUser.email || '',
            username: foundUser.username || '',
            phone: foundUser.phone || '',
            whatsapp: foundUser.whatsapp || '',
            password: '',
            confirmPassword: '', // Only in edit mode
            role_location_pairs: processedRoles,
            is_active: foundUser.is_active ?? true,
            is_admin: foundUser.is_admin ?? false,
          };

          setFormData(newFormData);
          setOriginalFormData(JSON.parse(JSON.stringify(newFormData))); // Deep copy to avoid reference issues
          // Don't mark as unsaved changes when loading initial data
        })
        .catch((error) => {
          setErrors({ submit: 'Erro ao carregar dados do usuário: ' + error });
        });
    }
  }, [isEditing, id, roles.length, dispatch]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    };

    setFormData(newFormData);

    // Check if form data has actually changed from original
    setHasUnsavedChanges(hasFormDataChanged(newFormData, originalFormData));

    // Handle errors with a single setState call to avoid conflicts
    setErrors((prev) => {
      const newErrors = { ...prev };

      // Clear the specific error for the field being changed
      if (newErrors[name]) {
        newErrors[name] = '';
      }

      // Real-time validation for password field during editing
      if (isEditing && name === 'password' && value) {
        if (value.length < 8) {
          newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
        } else {
          newErrors.password = ''; // Clear error if password is valid
        }

        // Also check if confirmPassword needs to be re-validated
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Senhas não coincidem';
        } else if (formData.confirmPassword && value === formData.confirmPassword) {
          newErrors.confirmPassword = '';
        }
      }

      // Real-time validation for confirmPassword field during editing
      if (isEditing && name === 'confirmPassword' && value && formData.password) {
        if (value !== formData.password) {
          newErrors.confirmPassword = 'Senhas não coincidem';
        } else {
          newErrors.confirmPassword = '';
        }
      }

      return newErrors;
    });
  };

  // Add a new role-location pair
  const addRoleLocationPair = () => {
    const newFormData = {
      ...formData,
      role_location_pairs: [...formData.role_location_pairs, { role_id: '', location_ids: [] }],
    };

    setFormData(newFormData);
    setHasUnsavedChanges(hasFormDataChanged(newFormData, originalFormData));
  };

  // Remove a role-location pair
  const removeRoleLocationPair = (index) => {
    // Prevent removing the last role-location pair
    if (formData.role_location_pairs.length <= 1) {
      setErrors((prev) => ({
        ...prev,
        role_location_pairs:
          'Não é possível remover o último perfil. O usuário deve ter pelo menos um perfil.',
      }));
      return;
    }

    const newFormData = {
      ...formData,
      role_location_pairs: formData.role_location_pairs.filter((_, i) => i !== index),
    };

    setFormData(newFormData);
    setHasUnsavedChanges(hasFormDataChanged(newFormData, originalFormData));

    // Clear any existing error
    setErrors((prev) => ({
      ...prev,
      role_location_pairs: '',
    }));
  };

  // Update a specific role-location pair
  const updateRoleLocationPair = (index, field, value) => {
    const newFormData = {
      ...formData,
      role_location_pairs: formData.role_location_pairs.map((pair, i) =>
        i === index ? { ...pair, [field]: value } : pair
      ),
    };

    setFormData(newFormData);
    setHasUnsavedChanges(hasFormDataChanged(newFormData, originalFormData));

    // Clear specific error when user makes selection
    if (errors.role_location_pairs) {
      setErrors((prev) => ({
        ...prev,
        role_location_pairs: '',
      }));
    }
  };

  // Toggle location selection for a role
  const toggleLocationForRole = (roleIndex, locationId) => {
    const newFormData = {
      ...formData,
      role_location_pairs: formData.role_location_pairs.map((pair, i) => {
        if (i === roleIndex) {
          const currentLocationIds = pair.location_ids || [];
          const locationExists = currentLocationIds.includes(locationId);

          return {
            ...pair,
            location_ids: locationExists
              ? currentLocationIds.filter((id) => id !== locationId)
              : [...currentLocationIds, locationId],
          };
        }
        return pair;
      }),
    };

    setFormData(newFormData);
    setHasUnsavedChanges(hasFormDataChanged(newFormData, originalFormData));

    // Clear specific error when user makes selection
    if (errors.role_location_pairs) {
      setErrors((prev) => ({
        ...prev,
        role_location_pairs: '',
      }));
    }
  };

  // Toggle role for single location mode
  const toggleRoleForSingleLocation = (roleId) => {
    const singleLocationId = locations[0].id.toString();
    const existingPairIndex = formData.role_location_pairs.findIndex(
      (pair) => pair.role_id === roleId
    );

    let newRolePairs;
    if (existingPairIndex >= 0) {
      // Remove the role
      newRolePairs = formData.role_location_pairs.filter((_, i) => i !== existingPairIndex);
    } else {
      // Add the role with the single location
      newRolePairs = [
        ...formData.role_location_pairs,
        {
          role_id: roleId,
          location_ids: [singleLocationId],
        },
      ];
    }

    const newFormData = {
      ...formData,
      role_location_pairs: newRolePairs,
    };

    setFormData(newFormData);
    setHasUnsavedChanges(hasFormDataChanged(newFormData, originalFormData));

    // Clear specific error when user makes selection
    if (errors.role_location_pairs) {
      setErrors((prev) => ({
        ...prev,
        role_location_pairs: '',
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Email validation (optional)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Username validation (optional but if provided, should be valid)
    if (formData.username.trim()) {
      if (formData.username.length < 3) {
        newErrors.username = 'Nome de usuário deve ter pelo menos 3 caracteres';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Nome de usuário deve conter apenas letras, números e underscore';
      }
    }

    // At least one of email or username is required
    if (!formData.email.trim() && !formData.username.trim()) {
      newErrors.emailOrUsername = 'É necessário fornecer pelo menos um e-mail ou nome de usuário';
    }

    // Password validation
    if (!isEditing) {
      // When creating: password is required, no confirmation needed
      if (!formData.password) {
        newErrors.password = 'Senha é obrigatória';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
      }
      // No confirmation validation in create mode
    } else if (formData.password) {
      // When editing: if password is provided, validate it and require confirmation
      if (formData.password.length < 8) {
        newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
      }

      // Only validate confirmation if confirmPassword exists and password is provided
      if ('confirmPassword' in formData && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Senhas não coincidem';
      }
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Formato inválido. Use: (11) 99999-9999';
    }

    // WhatsApp validation (optional but if provided, should be valid)
    if (formData.whatsapp && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.whatsapp)) {
      newErrors.whatsapp = 'Formato inválido. Use: (11) 99999-9999';
    }

    // Role-location pairs validation
    if (!formData.role_location_pairs || formData.role_location_pairs.length === 0) {
      newErrors.role_location_pairs =
        'Pelo menos uma combinação de perfil e localização é obrigatória';
    } else {
      // For single location mode, filter out empty pairs first
      const validPairs = formData.role_location_pairs.filter(
        (pair) => pair.role_id && pair.role_id !== ''
      );

      if (validPairs.length === 0) {
        newErrors.role_location_pairs =
          locations.length === 1
            ? 'Selecione pelo menos um perfil'
            : 'Pelo menos uma combinação de perfil e localização é obrigatória';
      } else {
        // Check if all valid pairs have both role and at least one location selected
        const hasIncompletePairs = validPairs.some(
          (pair) => !pair.role_id || !pair.location_ids || pair.location_ids.length === 0
        );
        if (hasIncompletePairs) {
          newErrors.role_location_pairs =
            'Todos os perfis devem ter pelo menos uma localização associada';
        }
      }
    }

    setErrors(newErrors);

    const hasErrors = Object.keys(newErrors).length > 0;

    // Scroll to top if there are validation errors
    if (hasErrors) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return !hasErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userData = {
        full_name: formData.name, // Send as full_name to match backend expectation
        email: formData.email,
        username: formData.username,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        role_location_pairs: formData.role_location_pairs.flatMap((pair) =>
          pair.location_ids.map((locationId) => ({
            role_id: pair.role_id, // Keep as UUID string
            location_id: locationId, // Keep as UUID string
          }))
        ),
        is_active: true,
        is_admin: false,
      };

      // Add password fields only if provided
      if (formData.password) {
        userData.password = formData.password;
      }

      if (isEditing) {
        await dispatch(updateUser({ userId: user.id, userData })).unwrap();
      } else {
        await dispatch(createUser(userData)).unwrap();
      }

      // Clear unsaved changes flag since we successfully saved
      setHasUnsavedChanges(false);

      // Navigate back to users list
      navigate('/admin/users');
    } catch (error) {
      console.error('Error saving user:', error);
      setErrors({ submit: error.message || 'Erro ao salvar usuário' });

      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  // Handle phone/WhatsApp formatting
  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as (11) 99999-9999
    if (digits.length >= 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    } else if (digits.length >= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length >= 1) {
      return `(${digits}`;
    }
    return digits;
  };

  const handlePhoneChange = (e, field) => {
    const formatted = formatPhoneNumber(e.target.value);
    const newFormData = {
      ...formData,
      [field]: formatted,
    };

    setFormData(newFormData);
    setHasUnsavedChanges(hasFormDataChanged(newFormData, originalFormData));
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
      setPendingNavigation('/admin/users');
    } else {
      navigate('/admin/users');
    }
  };

  const handleConfirmLeave = () => {
    setShowUnsavedModal(false);
    setHasUnsavedChanges(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const handleCancelLeave = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  return (
    <div className="user-form-page">
      <div className="page-header">
        <div className="header-content">
          <button className="btn btn-secondary back-btn" onClick={handleCancel}>
            <FaArrowLeft />
            Voltar
          </button>
          <div className="page-title">
            <FaUser className="title-icon" />
            <h1>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h1>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="form-container">
          <form onSubmit={handleSubmit} className="user-form">
            {/* Submit Error */}
            {errors.submit && (
              <div className="alert alert-danger" role="alert">
                <FaExclamationTriangle />
                {errors.submit}
              </div>
            )}

            {/* Personal Information */}
            <div className="form-section">
              <h3 className="section-title">Informações Pessoais</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    Nome Completo <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Digite o nome completo"
                    disabled={loading}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="usuario@exemplo.com (opcional)"
                    disabled={loading}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="username">Nome de Usuário</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="usuario123 (opcional)"
                    disabled={loading}
                  />
                  {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                  <small className="form-text text-muted">
                    Nome de usuário único para login (opcional se e-mail for fornecido)
                  </small>
                </div>
              </div>

              {/* Email OR Username validation error */}
              {errors.emailOrUsername && (
                <div className="form-group">
                  <div className="alert alert-danger d-flex align-items-center">
                    <FaExclamationTriangle className="me-2" />
                    <span>{errors.emailOrUsername}</span>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Telefone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e, 'phone')}
                    placeholder="(11) 99999-9999"
                    disabled={loading}
                  />
                  {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="whatsapp">WhatsApp</label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    className={`form-control ${errors.whatsapp ? 'is-invalid' : ''}`}
                    value={formData.whatsapp}
                    onChange={(e) => handlePhoneChange(e, 'whatsapp')}
                    placeholder="(11) 99999-9999"
                    disabled={loading}
                  />
                  {errors.whatsapp && <div className="invalid-feedback">{errors.whatsapp}</div>}
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="form-section">
              <h3 className="section-title">
                {isEditing ? 'Alterar Senha (opcional)' : 'Senha de Acesso'}
              </h3>

              {!isEditing ? (
                /* CREATE MODE: Single password field, no confirmation */
                <div className="form-group">
                  <label htmlFor="password">
                    Senha <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="password"
                    name="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    disabled={loading}
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>
              ) : (
                /* EDIT MODE: Password field with optional confirmation */
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Nova Senha</label>
                    <div className="password-input">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Deixe em branco para manter atual"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      {errors.password && (
                        <div className="invalid-feedback" style={{ display: 'block' }}>
                          {errors.password}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Show confirm password only when editing and password is provided */}
                  {formData.password && 'confirmPassword' in formData && (
                    <div className="form-group">
                      <label htmlFor="confirmPassword">
                        Confirmar Senha <span className="required">*</span>
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        value={formData.confirmPassword || ''}
                        onChange={handleChange}
                        placeholder="Digite a senha novamente"
                        disabled={loading}
                      />
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Role and Location Pairs */}
            <div className="form-section">
              <h3 className="section-title">
                {locations.length === 1 ? 'Perfis' : 'Perfis e Unidades'}
              </h3>

              {locations.length === 1 ? (
                /* Single Location Mode: Multi-role selection */
                <div className="single-location-mode">
                  <div className="form-group">
                    <div className="form-label">
                      Selecione os perfis do usuário <span className="required">*</span>
                    </div>
                    <div className="role-checkboxes">
                      {roles.map((role) => {
                        const isSelected = formData.role_location_pairs.some(
                          (pair) => pair.role_id === role.id
                        );
                        return (
                          <div key={role.id} className="checkbox-item role-checkbox">
                            <input
                              type="checkbox"
                              id={`role_${role.id}`}
                              checked={isSelected}
                              onChange={() => toggleRoleForSingleLocation(role.id)}
                              disabled={loading}
                            />
                            <label htmlFor={`role_${role.id}`} className="role-label">
                              {roleDisplayInfo[role.name]?.name || role.name}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    {formData.role_location_pairs.length > 0 && (
                      <small className="form-text text-muted">
                        {formData.role_location_pairs.length} perfil(is) selecionado(s)
                      </small>
                    )}
                  </div>
                </div>
              ) : (
                /* Multi-Location Mode: Original role-location pairs */
                <>
                  {formData.role_location_pairs.length === 0 && (
                    <div className="no-pairs-message">
                      <p>Nenhum perfil adicionado ainda.</p>
                      <button
                        type="button"
                        className="btn btn-primary add-pair-btn"
                        onClick={addRoleLocationPair}
                        disabled={loading}
                      >
                        <FaPlus />
                        Adicionar Perfil
                      </button>
                    </div>
                  )}

                  {formData.role_location_pairs.map((pair, index) => (
                    <div key={index} className="role-location-pair">
                      <div className="pair-header">
                        <h4>Perfil {index + 1}</h4>
                        <button
                          type="button"
                          className="btn btn-danger remove-pair-btn"
                          onClick={() => removeRoleLocationPair(index)}
                          disabled={loading}
                        >
                          <FaTrash />
                        </button>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor={`role_${index}`}>
                            Perfil <span className="required">*</span>
                          </label>
                          <select
                            id={`role_${index}`}
                            className="form-control"
                            value={pair.role_id}
                            onChange={(e) =>
                              updateRoleLocationPair(index, 'role_id', e.target.value)
                            }
                            disabled={loading}
                          >
                            <option value="">Selecione um perfil</option>
                            {getAvailableRoles(index).map((role) => (
                              <option
                                key={role.id}
                                value={role.id}
                                title={roleDisplayInfo[role.name]?.description}
                              >
                                {roleDisplayInfo[role.name]?.name || role.name}
                              </option>
                            ))}
                          </select>
                          {pair.role_id &&
                            roleDisplayInfo[roles.find((r) => r.id === pair.role_id)?.name] && (
                              <small className="form-text text-muted">
                                <FaInfoCircle />
                                <span
                                  className="role-description"
                                  title={
                                    roleDisplayInfo[roles.find((r) => r.id === pair.role_id)?.name]
                                      ?.description
                                  }
                                >
                                  {
                                    roleDisplayInfo[roles.find((r) => r.id === pair.role_id)?.name]
                                      ?.description
                                  }
                                </span>
                              </small>
                            )}
                        </div>

                        <div className="form-group">
                          <div className="form-label">
                            Unidades <span className="required">*</span>
                          </div>
                          <div className="location-checkboxes">
                            {locations.map((location) => (
                              <div key={location.id} className="checkbox-item">
                                <input
                                  type="checkbox"
                                  id={`location_${index}_${location.id}`}
                                  checked={
                                    pair.location_ids?.includes(location.id.toString()) || false
                                  }
                                  onChange={() =>
                                    toggleLocationForRole(index, location.id.toString())
                                  }
                                  disabled={loading}
                                />
                                <label htmlFor={`location_${index}_${location.id}`}>
                                  {location.name}
                                </label>
                              </div>
                            ))}
                          </div>
                          {pair.location_ids && pair.location_ids.length > 0 && (
                            <small className="form-text text-muted">
                              {pair.location_ids.length} localização(ões) selecionada(s)
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.role_location_pairs.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary add-pair-btn"
                      onClick={addRoleLocationPair}
                      disabled={loading}
                    >
                      <FaPlus />
                      Adicionar Outro Perfil
                    </button>
                  )}
                </>
              )}

              {errors.role_location_pairs && (
                <div className="invalid-feedback d-block">{errors.role_location_pairs}</div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {isEditing ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    <FaSave />
                    {isEditing ? 'Atualizar Usuário' : 'Criar Usuário'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-modal-title"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h3 id="unsaved-modal-title">
                <FaExclamationTriangle className="text-warning me-2" />
                Alterações não salvas
              </h3>
            </div>
            <div className="modal-body">
              <p>Você possui alterações não salvas que serão perdidas se continuar.</p>
              <p>
                <strong>Tem certeza que deseja sair sem salvar?</strong>
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCancelLeave}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmLeave}>
                Sair sem salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFormPage;
