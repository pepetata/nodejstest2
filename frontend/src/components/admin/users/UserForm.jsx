import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { FaTimes, FaExclamationTriangle, FaEye, FaEyeSlash, FaSave } from 'react-icons/fa';
import { createUser, updateUser } from '../../../store/usersSlice';

const UserForm = ({ user, roles, locations, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
    role_id: '',
    location_id: '',
    is_active: true,
    is_admin: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isEditing = !!user;

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        whatsapp: user.whatsapp || '',
        password: '',
        confirmPassword: '',
        role_id: user.role_id || '',
        location_id: user.location_id || '',
        is_active: user.is_active ?? true,
        is_admin: user.is_admin ?? false,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        whatsapp: '',
        password: '',
        confirmPassword: '',
        role_id: '',
        location_id: '',
        is_active: true,
        is_admin: false,
      });
    }
    setErrors({});
  }, [user]);

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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
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

    // Role validation
    if (!formData.role_id) {
      newErrors.role_id = 'Perfil é obrigatório';
    }

    // Location validation
    if (!formData.location_id) {
      newErrors.location_id = 'Localização é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        ...formData,
        role_id: parseInt(formData.role_id),
        location_id: parseInt(formData.location_id),
      };

      // Remove password fields if not provided (for editing)
      if (isEditing && !formData.password) {
        delete userData.password;
        delete userData.confirmPassword;
      }

      if (isEditing) {
        await dispatch(updateUser({ userId: user.id, userData })).unwrap();
      } else {
        await dispatch(createUser(userData)).unwrap();
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
      setErrors({ submit: error.message || 'Erro ao salvar usuário' });
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

  return (
    <div className="modal-overlay">
      <div className="modal user-form-modal">
        <div className="modal-header">
          <h3>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Fechar modal">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="modal-body">
            {/* Submit Error */}
            {errors.submit && (
              <div className="alert alert-danger" role="alert">
                <FaExclamationTriangle />
                {errors.submit}
              </div>
            )}

            {/* Personal Information */}
            <div className="form-section">
              <h4 className="section-title">Informações Pessoais</h4>

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
                  <label htmlFor="email">
                    Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="usuario@exemplo.com"
                    disabled={loading}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
              </div>

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
              <h4 className="section-title">
                {isEditing ? 'Alterar Senha (opcional)' : 'Senha de Acesso'}
              </h4>

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

            {/* Role and Location */}
            <div className="form-section">
              <h4 className="section-title">Permissões e Localização</h4>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role_id">
                    Perfil <span className="required">*</span>
                  </label>
                  <select
                    id="role_id"
                    name="role_id"
                    className={`form-control ${errors.role_id ? 'is-invalid' : ''}`}
                    value={formData.role_id}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Selecione um perfil</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  {errors.role_id && <div className="invalid-feedback">{errors.role_id}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="location_id">
                    Localização <span className="required">*</span>
                  </label>
                  <select
                    id="location_id"
                    name="location_id"
                    className={`form-control ${errors.location_id ? 'is-invalid' : ''}`}
                    value={formData.location_id}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Selecione uma localização</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  {errors.location_id && (
                    <div className="invalid-feedback">{errors.location_id}</div>
                  )}
                </div>
              </div>

              {/* Status Checkboxes */}
              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <span className="checkmark"></span>
                    Usuário ativo
                  </label>
                  <small className="form-text">
                    Usuários inativos não podem fazer login no sistema
                  </small>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_admin"
                      checked={formData.is_admin}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <span className="checkmark"></span>
                    Administrador
                  </label>
                  <small className="form-text">Administradores têm acesso total ao sistema</small>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
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
  );
};

UserForm.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired, // UUIDs are strings
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    whatsapp: PropTypes.string,
    role_id: PropTypes.string, // Role IDs are UUIDs (strings)
    location_id: PropTypes.string, // Location IDs are UUIDs (strings)
    is_active: PropTypes.bool,
    is_admin: PropTypes.bool,
  }),
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, // Support both string and number IDs
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, // Support both string and number IDs
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

UserForm.defaultProps = {
  user: null,
};

export default UserForm;
