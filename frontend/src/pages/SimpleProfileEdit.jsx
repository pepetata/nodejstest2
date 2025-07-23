import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaSave, FaExclamationTriangle } from 'react-icons/fa';
import { getProfile, updateProfile } from '../store/usersSlice';
import '../styles/admin/users/userForm.scss';
import './SimpleProfileEdit.css';

const SimpleProfileEdit = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentUser: profileUser } = useSelector((state) => state.users);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showExitModal, setShowExitModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState({});

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profileUser) {
      const userData = {
        name: profileUser.full_name || '',
        email: profileUser.email || '',
        phone: profileUser.phone || '',
        whatsapp: profileUser.whatsapp || '',
      };
      setFormData(userData);
      setInitialData(userData);
    }
  }, [profileUser]);

  // Validation function (matching UserForm.jsx)
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Email deve ter um formato válido';
      } else if (formData.email.length > 100) {
        newErrors.email = 'Email deve ter no máximo 100 caracteres';
      }
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Telefone deve estar no formato (11) 99999-9999';
      }
    }

    // WhatsApp validation (optional but must be valid if provided)
    if (formData.whatsapp && formData.whatsapp.trim() !== '') {
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(formData.whatsapp)) {
        newErrors.whatsapp = 'WhatsApp deve estar no formato (11) 99999-9999';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Phone number formatting function (matching UserForm.jsx)
  const formatPhoneNumber = (value) => {
    if (!value) return '';

    // Remove all non-numeric characters
    const digits = value.replace(/\D/g, '');

    // Apply formatting based on length
    if (digits.length <= 2) {
      return `(${digits}`;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  // Handle phone number changes with formatting
  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = formatPhoneNumber(value);

    const newFormData = {
      ...formData,
      [name]: formattedValue,
    };
    setFormData(newFormData);

    // Check if there are changes
    const hasChanged = JSON.stringify(newFormData) !== JSON.stringify(initialData);
    setHasChanges(hasChanged);
  };

  const handleChange = (e) => {
    const newFormData = {
      ...formData,
      [e.target.name]: e.target.value,
    };
    setFormData(newFormData);

    // Check if there are changes
    const hasChanged = JSON.stringify(newFormData) !== JSON.stringify(initialData);
    setHasChanges(hasChanged);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate form before submitting
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await dispatch(
        updateProfile({
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
        })
      ).unwrap();

      // Success - navigate back
      navigate('/admin/user-profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ submit: error.message || 'Erro ao atualizar perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowExitModal(true);
    } else {
      navigate('/admin/user-profile');
    }
  };

  const handleConfirmExit = () => {
    navigate('/admin/user-profile');
  };

  const handleStayOnPage = () => {
    setShowExitModal(false);
  };

  if (!profileUser) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '20px',
        }}
      >
        <div className="modal user-form-modal simple-profile-edit">
          <div className="modal-header">
            <h3>Editar Meu Perfil</h3>
            <button className="modal-close" onClick={handleCancel} aria-label="Fechar">
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
                      required
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
                      onChange={handlePhoneChange}
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
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      disabled={loading}
                    />
                    {errors.whatsapp && <div className="invalid-feedback">{errors.whatsapp}</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-blank"
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
                    Atualizando...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Atualizar Perfil
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="modal-overlay" style={{ zIndex: 1060 }}>
          <div className="modal user-form-modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Confirmar Saída</h3>
              <button className="modal-close" onClick={handleStayOnPage} aria-label="Fechar">
                <FaTimes />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '32px' }}>
              <div className="alert alert-warning" role="alert" style={{ marginBottom: '24px' }}>
                <FaExclamationTriangle style={{ marginRight: '8px' }} />
                Você tem alterações não salvas. Tem certeza que deseja sair sem salvar?
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-blank" onClick={handleStayOnPage}>
                Continuar Editando
              </button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmExit}>
                Sair sem Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SimpleProfileEdit;
