import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import UserDetailsModal from '../components/admin/users/UserDetailsModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getProfile, clearError, fetchRoles, fetchLocations } from '../store/usersSlice';
import '../styles/admin/profile/adminUserProfilePage.scss';

const AdminUserProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    currentUser: profileUser,
    loading,
    error,
    roles,
    locations,
  } = useSelector((state) => state.users);

  // Get restaurant data from auth state
  const restaurant = useSelector((state) => state.auth.restaurant);

  const isLoading = loading?.profile;

  useEffect(() => {
    // Load user profile on mount
    dispatch(getProfile());

    // Load roles and locations for the form
    dispatch(fetchRoles());
    dispatch(fetchLocations());

    // Clear any previous errors
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (profileUser) {
      console.log('Profile user loaded:', {
        id: profileUser.id,
        full_name: profileUser.full_name,
        email: profileUser.email,
        username: profileUser.username,
      });
    }
  }, [profileUser]);

  useEffect(() => {
    if (error) {
      console.error('Profile error:', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleEditProfile = () => {
    console.log('🚀 Navigating to simple edit form');
    navigate('/admin/user-profile/edit');
  };

  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  if (isLoading) {
    return (
      <div className="admin-user-profile-page">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="admin-user-profile-page">
        <div className="error-message">
          <p>Erro ao carregar perfil do usuário</p>
          <button className="btn-primary" onClick={() => dispatch(getProfile())}>
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  console.log('AdminUserProfilePage state:', { hasProfileUser: !!profileUser });

  return (
    <div className="admin-user-profile-page">
      <UserDetailsModal
        user={profileUser}
        onClose={handleBackToAdmin}
        onEdit={handleEditProfile}
        roles={roles}
        locations={locations}
        restaurant={restaurant}
        showBackButton={true}
        isProfileView={true}
      />
    </div>
  );
};

export default AdminUserProfilePage;
