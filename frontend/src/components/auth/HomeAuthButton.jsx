import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * Home Page Auth Button Component
 * Shows appropriate button based on authentication status
 */
const HomeAuthButton = ({ className = 'btn btn-primary' }) => {
  const navigate = useNavigate();
  const { user, token, restaurant } = useSelector((state) => state.auth);

  const isAuthenticated = !!user && !!token;
  const isAdmin =
    user?.role === 'restaurant_administrator' || user?.role === 'location_administrator';
  const hasRestaurant = !!restaurant;

  const handleClick = () => {
    if (isAuthenticated && isAdmin && hasRestaurant) {
      // Redirect to restaurant admin area
      const restaurantUrl = restaurant.url;
      const redirectUrl = `http://${restaurantUrl}.localhost:3000/admin`;
      window.location.href = redirectUrl;
    } else if (isAuthenticated && !isAdmin) {
      // TODO: Handle non-admin user navigation
      console.log('TODO: Navigate non-admin user to appropriate area');
      alert('Área em desenvolvimento para seu tipo de usuário.');
    } else {
      // Not authenticated - go to login
      navigate('/login');
    }
  };

  const getButtonText = () => {
    if (isAuthenticated && isAdmin && hasRestaurant) {
      return 'Acessar Painel';
    } else if (isAuthenticated && !isAdmin) {
      return 'Minha Área'; // TODO: Customize based on user type
    } else {
      return 'Entrar';
    }
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      {getButtonText()}
    </button>
  );
};

HomeAuthButton.propTypes = {
  className: PropTypes.string,
};

export default HomeAuthButton;
