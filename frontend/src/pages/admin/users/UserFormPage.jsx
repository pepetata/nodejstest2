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
  fetchUsers,
  fetchRoles,
  fetchLocations,
  selectUsers,
  selectRoles,
  selectLocations,
} from '../../../store/usersSlice';
import '../../../styles/admin/users/userFormPage.scss';

const UserFormPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const users = useSelector(selectUsers);
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
    confirmPassword: '',
    role_location_pairs: [{ role_id: '', location_ids: [] }], // Changed to support multiple locations per role
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      name: 'Administrador de Localização',
      description: 'Gerencia uma localização específica do restaurante',
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
    // For other roles, show only roles below their level
    else {
      availableRoles = roles.filter(
        (role) => role.name !== 'superadmin' && role.name !== 'restaurant_administrator'
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

    // Always fetch users if we're in edit mode and don't have users loaded
    if (isEditing && users.length === 0) {
      dispatch(fetchUsers());
    }
  }, [roles.length, locations.length, dispatch, isEditing, users.length]);

  // Separate useEffect for loading user data to avoid infinite loops
  useEffect(() => {
    if (isEditing && id && roles.length > 0 && users.length > 0) {
      // Try to find user by both string and integer ID
      const foundUser = users.find((u) => u.id === id || u.id === parseInt(id));

      if (foundUser) {
        setUser(foundUser);
        if (foundUser) {
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

          console.log('🔍 UserFormPage: Setting form data for user:', foundUser.id);
          console.log('🔍 UserFormPage: Roles available:', roles.length);
          console.log('🔍 UserFormPage: Processed role pairs:', processedRoles);

          const newFormData = {
            name: foundUser.full_name || '',
            email: foundUser.email || '',
            username: foundUser.username || '',
            phone: foundUser.phone || '',
            whatsapp: foundUser.whatsapp || '',
            password: '',
            confirmPassword: '',
            role_location_pairs: processedRoles,
            is_active: foundUser.is_active ?? true,
            is_admin: foundUser.is_admin ?? false,
          };

          console.log('🔍 UserFormPage: Final form data:', newFormData);
          console.log('🔍 UserFormPage: Role pairs in form data:', newFormData.role_location_pairs);

          setFormData(newFormData);
        }
      }
    }
  }, [isEditing, id, users, roles, dispatch]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Add a new role-location pair
  const addRoleLocationPair = () => {
    setFormData((prev) => ({
      ...prev,
      role_location_pairs: [...prev.role_location_pairs, { role_id: '', location_ids: [] }],
    }));
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

    setFormData((prev) => ({
      ...prev,
      role_location_pairs: prev.role_location_pairs.filter((_, i) => i !== index),
    }));

    // Clear any existing error
    setErrors((prev) => ({
      ...prev,
      role_location_pairs: '',
    }));
  };

  // Update a specific role-location pair
  const updateRoleLocationPair = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      role_location_pairs: prev.role_location_pairs.map((pair, i) =>
        i === index ? { ...pair, [field]: value } : pair
      ),
    }));

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
    setFormData((prev) => ({
      ...prev,
      role_location_pairs: prev.role_location_pairs.map((pair, i) => {
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
    }));

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

    // Password validation (only for new users or when changing password)
    if (!isEditing || formData.password) {
      if (!formData.password) {
        newErrors.password = 'Senha é obrigatória';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      }

      if (formData.password !== formData.confirmPassword) {
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
      // Check if all pairs have both role and at least one location selected
      const hasIncompletePairs = formData.role_location_pairs.some(
        (pair) => !pair.role_id || !pair.location_ids || pair.location_ids.length === 0
      );
      if (hasIncompletePairs) {
        newErrors.role_location_pairs =
          'Todos os perfis devem ter pelo menos uma localização associada';
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
    setFormData((prev) => ({
      ...prev,
      [field]: formatted,
    }));
  };

  const handleCancel = () => {
    navigate('/admin/users');
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">
                    {isEditing ? 'Nova Senha' : 'Senha'}{' '}
                    {!isEditing && <span className="required">*</span>}
                  </label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={
                        isEditing ? 'Deixe em branco para manter atual' : 'Mínimo 6 caracteres'
                      }
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
                  </div>
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    Confirmar Senha{' '}
                    {(!isEditing || formData.password) && <span className="required">*</span>}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Digite a senha novamente"
                    disabled={loading}
                  />
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">{errors.confirmPassword}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Role and Location Pairs */}
            <div className="form-section">
              <h3 className="section-title">Perfis e Localizações</h3>

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
                        onChange={(e) => updateRoleLocationPair(index, 'role_id', e.target.value)}
                        disabled={loading}
                        onFocus={() => {
                          console.log(`🔍 Dropdown ${index + 1} focused:`, {
                            currentValue: pair.role_id,
                            availableRoles: getAvailableRoles(index).map((r) => ({
                              id: r.id,
                              name: r.name,
                            })),
                            allRoles: roles.map((r) => ({ id: r.id, name: r.name })),
                          });
                        }}
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
                        Localizações <span className="required">*</span>
                      </div>
                      <div className="location-checkboxes">
                        {locations.map((location) => (
                          <div key={location.id} className="checkbox-item">
                            <input
                              type="checkbox"
                              id={`location_${index}_${location.id}`}
                              checked={pair.location_ids?.includes(location.id.toString()) || false}
                              onChange={() => toggleLocationForRole(index, location.id.toString())}
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
    </div>
  );
};

export default UserFormPage;
