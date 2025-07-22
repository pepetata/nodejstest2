import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  fetchRoles,
  fetchLocations,
  getProfile,
  updateProfile,
  clearErrors,
} from '../../../store/usersSlice';
import { setUser } from '../../../store/authSlice';
import UserProfileModal from '../../../components/admin/profile/UserProfileModal';
import UserProfileEditForm from '../../../components/admin/profile/UserProfileEditForm';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import SuccessMessage from '../../../components/common/SuccessMessage';
import '../../../styles/admin/adminPage.scss';

const AdminUserProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, restaurant } = useSelector((state) => state.auth);
  const { roles, locations, loading, error, currentUser } = useSelector((state) => state.users);

  // Use currentUser from users slice if available (fresh data), otherwise fallback to auth user
  const profileUser = currentUser || user;

  const [mode, setMode] = useState('view'); // 'view' or 'edit'
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Get the previous page path for back navigation
  const fromPath = location.state?.from || '/admin';

  useEffect(() => {
    // Load fresh profile data, roles and locations for display
    dispatch(getProfile());
    dispatch(fetchRoles());
    dispatch(fetchLocations());

    // Clear any previous errors
    dispatch(clearErrors());

    return () => {
      dispatch(clearErrors());
    };
  }, [dispatch]);

  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleEdit = () => {
    setMode('edit');
  };

  const handleCancelEdit = () => {
    setMode('view');
  };

  const handleBack = () => {
    navigate(fromPath);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      // Update user profile
      const updatedUserData = await dispatch(
        updateProfile({
          ...formData,
          updated_at: new Date().toISOString(),
        })
      ).unwrap();

      // Update the user in auth state with the new data
      dispatch(
        setUser({
          ...user,
          ...updatedUserData,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          updated_at: new Date().toISOString(),
        })
      );

      // Refresh profile data to ensure consistency
      dispatch(getProfile());

      setSuccessMessage('Perfil atualizado com sucesso!');
      setMode('view');
    } catch (error) {
      console.error('Error updating profile:', error);
      // Don't set error message here, let the form handle validation errors
      throw error;
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Meu Perfil</h1>
        </div>
        <div className="admin-page-content">
          <ErrorMessage
            message="Usuário não encontrado. Você precisa estar logado para acessar seu perfil."
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  if (loading && (loading.fetching || loading.roles || loading.locations)) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Meu Perfil</h1>
        </div>
        <div className="admin-page-content">
          <LoadingSpinner message="Carregando dados do perfil..." />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {successMessage && (
        <SuccessMessage message={successMessage} onClose={() => setSuccessMessage('')} />
      )}

      {error && error.updating && (
        <ErrorMessage message={error.updating} onClose={() => dispatch(clearErrors())} />
      )}

      {mode === 'view' && (
        <UserProfileModal
          user={profileUser}
          roles={roles}
          locations={locations}
          restaurant={restaurant}
          onClose={handleBack}
          onEdit={handleEdit}
          showBackButton={true}
        />
      )}

      {mode === 'edit' && (
        <UserProfileEditForm
          user={profileUser}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          loading={saving}
          showBackButton={true}
        />
      )}
    </div>
  );
};

export default AdminUserProfilePage;
