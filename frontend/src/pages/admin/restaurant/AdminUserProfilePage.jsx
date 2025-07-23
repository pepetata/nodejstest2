import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getProfile,
  updateProfile,
  fetchRoles,
  fetchLocations,
  clearError,
  clearSuccessMessage,
  selectCurrentUser,
  selectProfileLoading,
  selectUpdatingProfile,
  selectRoles,
  selectLocations,
  selectUsersError,
  selectSuccessMessage,
} from '../../../store/usersSlice';
import UserProfileModal from '../../../components/admin/profile/UserProfileModal';
import UserProfileEditForm from '../../../components/admin/profile/UserProfileEditForm';
import '../../../styles/admin/adminPage.scss';

const AdminUserProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [returnPath, setReturnPath] = useState('/admin');

  // Redux state
  const currentUser = useSelector(selectCurrentUser);
  const loading = useSelector(selectProfileLoading);
  const updatingProfile = useSelector(selectUpdatingProfile);
  const roles = useSelector(selectRoles);
  const locations = useSelector(selectLocations);
  const error = useSelector(selectUsersError);
  const successMessage = useSelector(selectSuccessMessage);
  const restaurant = useSelector((state) => state.auth.restaurant);

  // Set return path from state or default to admin dashboard
  useEffect(() => {
    if (location.state?.from) {
      setReturnPath(location.state.from);
    }
  }, [location.state]);

  // Load profile data on mount
  useEffect(() => {
    dispatch(getProfile());
    dispatch(fetchRoles());
    dispatch(fetchLocations());
    dispatch(clearError());
  }, [dispatch]);

  // Clear success message after some time
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  // Scroll to top when editing mode changes
  useEffect(() => {
    if (isEditing) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    dispatch(clearError());
  };

  const handleSaveProfile = async (formData) => {
    await dispatch(updateProfile(formData)).unwrap();
    setIsEditing(false);
    // Refresh profile data after update
    dispatch(getProfile());
  };

  const handleReturn = () => {
    navigate(returnPath);
  };

  if (loading || !currentUser) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Meu Perfil</h1>
          <p className="admin-page-subtitle">
            Atualize suas informações pessoais, altere sua senha e configure suas preferências.
          </p>
        </div>
        <div className="admin-page-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Carregando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Meu Perfil</h1>
        </div>
        <div className="admin-page-content">
          <div className="error-message">
            <h3>Erro ao carregar perfil</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => dispatch(getProfile())}>
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Success Message */}
      {successMessage && (
        <div className="success-banner">
          <p>{successMessage}</p>
          <button className="close-btn" onClick={() => dispatch(clearSuccessMessage())}>
            ×
          </button>
        </div>
      )}

      {/* Profile View Modal */}
      {!isEditing && (
        <UserProfileModal
          user={currentUser}
          roles={roles}
          locations={locations}
          restaurant={restaurant}
          onEdit={handleEdit}
          onClose={handleReturn}
          showBackButton={true}
        />
      )}

      {/* Profile Edit Form */}
      {isEditing && (
        <UserProfileEditForm
          user={currentUser}
          onSave={handleSaveProfile}
          onCancel={handleCancelEdit}
          loading={updatingProfile}
          showBackButton={true}
        />
      )}
    </>
  );
};

export default AdminUserProfilePage;
