import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/authSlice';
import PropTypes from 'prop-types';

/**
 * User Status Component
 * Shows user info and logout option when authenticated
 */
const UserStatus = ({ className = 'user-status' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, restaurant } = useSelector((state) => state.auth);

  const isAuthenticated = !!user && !!token;
  const isAdmin =
    user?.role === 'restaurant_administrator' || user?.role === 'location_administrator';
  const hasRestaurant = !!restaurant;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleAccessPanel = () => {
    if (isAdmin && hasRestaurant) {
      const restaurantUrl = restaurant.url;
      const redirectUrl = `http://${restaurantUrl}.localhost:3000/admin`;
      window.location.href = redirectUrl;
    } else {
      // TODO: Handle non-admin user navigation
      console.log('TODO: Navigate non-admin user to appropriate area');
      alert('Área em desenvolvimento para seu tipo de usuário.');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className={`${className} d-flex justify-content-between align-items-center p-3 bg-light rounded`}
    >
      <div className="user-info">
        <span className="fw-bold text-dark">Olá, {user.full_name || user.name}</span>
        {isAdmin && hasRestaurant && <span className="text-muted ms-2">({restaurant.name})</span>}
      </div>
      <div className="user-actions">
        {isAdmin && hasRestaurant && (
          <button type="button" className="btn btn-primary me-2" onClick={handleAccessPanel}>
            Meu Painel
          </button>
        )}
        <button type="button" className="btn btn-outline-danger" onClick={handleLogout}>
          Sair do Sistema
        </button>
      </div>
    </div>
  );
};

UserStatus.propTypes = {
  className: PropTypes.string,
};

export default UserStatus;
