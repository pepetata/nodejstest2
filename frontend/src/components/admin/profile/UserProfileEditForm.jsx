import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaTimes, FaSave, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import '../../../styles/admin/profile/userProfileEditForm.scss';

const UserProfileEditForm = ({
  user,
  onSave,
  onCancel,
  loading = false,
  showBackButton = false,
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        whatsapp: user.whatsapp || '',
        password: '',
        confirmPassword: '',
      });
    }
    setErrors({});
    setHasUnsavedChanges(false);
  }, [user]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Track changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // When password is cleared, also clear confirmPassword
      if (name === 'password' && !value) {
        updated.confirmPassword = '';
      }

      return updated;
    });

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    // Clear password confirmation error when passwords match
    if (name === 'password' || name === 'confirmPassword') {
      if (errors.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: '',
        }));
      }
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Full name is required
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }

    // Email format validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email deve ter um formato válido';
    }

    // Either email or username must exist (check original user data)
    if (!formData.email && !user.username) {
      newErrors.email = 'Email é obrigatório (usuário não possui nome de usuário)';
    }

    // Password validation (only if password is provided)
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirmação de senha não confere';
      }
    }

    // Phone format validation (if provided)
    if (
      formData.phone &&
      !/^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/.test(formData.phone.replace(/\s/g, ''))
    ) {
      newErrors.phone = 'Formato de telefone inválido (ex: (11) 99999-9999)';
    }

    // WhatsApp format validation (if provided)
    if (
      formData.whatsapp &&
      !/^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/.test(formData.whatsapp.replace(/\s/g, ''))
    ) {
      newErrors.whatsapp = 'Formato de WhatsApp inválido (ex: (11) 99999-9999)';
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

    // Prepare data for API
    const dataToSave = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      whatsapp: formData.whatsapp.trim() || null,
    };

    // Only include password if it's being changed
    if (formData.password) {
      dataToSave.password = formData.password;
    }

    try {
      await onSave(dataToSave);
      setHasUnsavedChanges(false);
    } catch (error) {
      // Handle API validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  // Handle cancel with unsaved changes warning
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm(
        'Você tem alterações não salvas. Deseja realmente sair sem salvar?'
      );
      if (!confirmDiscard) {
        return;
      }
    }
    onCancel();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="user-profile-edit-overlay">
      <div className="user-profile-edit-form" role="dialog" aria-modal="true" tabIndex={-1}>
        <div className="form-header">
          <h2 className="form-title">Editar Meu Perfil</h2>
          <div className="form-header-actions">
            {showBackButton && (
              <button
                type="button"
                className="back-button btn-secondary"
                onClick={handleCancel}
                disabled={loading}
                title="Voltar"
              >
                <FaArrowLeft />
                <span>Voltar</span>
              </button>
            )}
            {!showBackButton && (
              <button
                type="button"
                className="close-button"
                onClick={handleCancel}
                disabled={loading}
                title="Fechar"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        <div className="form-body">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Informações Pessoais</h3>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="full_name" className="form-label required">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={`form-input ${errors.full_name ? 'error' : ''}`}
                    placeholder="Digite seu nome completo"
                    required
                    disabled={loading}
                  />
                  {errors.full_name && <span className="error-message">{errors.full_name}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="seu@email.com"
                    disabled={loading}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                  {!user.username && (
                    <small className="form-help">
                      Email é obrigatório pois você não possui nome de usuário
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                    placeholder="(11) 99999-9999"
                    disabled={loading}
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="whatsapp" className="form-label">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className={`form-input ${errors.whatsapp ? 'error' : ''}`}
                    placeholder="(11) 99999-9999"
                    disabled={loading}
                  />
                  {errors.whatsapp && <span className="error-message">{errors.whatsapp}</span>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Alteração de Senha</h3>
              <p className="section-description">
                Deixe os campos em branco para manter a senha atual
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Nova Senha
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`form-input ${errors.password ? 'error' : ''}`}
                      placeholder="Deixe em branco para manter a mesma"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && <span className="error-message">{errors.password}</span>}
                  {formData.password && <small className="form-help">Mínimo 6 caracteres</small>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirmar Nova Senha
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                      placeholder="Confirme a nova senha"
                      disabled={loading || !formData.password}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={!formData.password}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="error-message">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section readonly-section">
              <h3>Informações do Sistema</h3>
              <p className="section-description">
                As informações abaixo são gerenciadas pelo sistema e não podem ser alteradas por
                você.
              </p>

              <div className="readonly-grid">
                <div className="readonly-item">
                  <label>Nome de Usuário</label>
                  <span>{user.username || 'N/A'}</span>
                </div>
                <div className="readonly-item">
                  <label>Status</label>
                  <span className={`status-badge ${user.status}`}>
                    {user.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="readonly-item">
                  <label>Data de Criação</label>
                  <span>
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('pt-BR')
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                <FaSave />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

UserProfileEditForm.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    full_name: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    username: PropTypes.string,
    phone: PropTypes.string,
    whatsapp: PropTypes.string,
    status: PropTypes.string.isRequired,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  showBackButton: PropTypes.bool,
};

export default UserProfileEditForm;
