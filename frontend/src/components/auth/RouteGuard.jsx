import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import restaurantService from '../../services/restaurantService';
import NotFound from '../../pages/app/NotFound';

// Import storage utility to check token consistency
const storage = {
  get: (key) => {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  },
};

// Cache for restaurant validation to avoid repeated API calls
const restaurantCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Route Guard Component
 * Handles authentication-based routing logic for subdomain and main domain access
 */
const RouteGuard = ({ children, requireAuth = false, requireAdmin = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, restaurant, rememberMe } = useSelector((state) => state.auth);
  const [restaurantExists, setRestaurantExists] = useState(true);
  const [isValidatingRestaurant, setIsValidatingRestaurant] = useState(false);

  // More robust authentication check - ensure both Redux state and token are consistent
  const hasValidToken = storage.get('token');
  const isAuthenticated = !!user && !!token && !!hasValidToken;
  const isAdmin =
    user?.role === 'restaurant_administrator' || user?.role === 'location_administrator';
  const hasRestaurant = !!restaurant;

  console.log('RouteGuard - Auth Debug:', {
    hasValidToken: !!hasValidToken,
    reduxToken: !!token,
    reduxUser: !!user,
    isAuthenticated,
    isAdmin,
    hasRestaurant,
    currentPath: location.pathname,
    subdomain: window.location.hostname.split('.')[0],
    isSubdomain: window.location.hostname.split('.')[0] !== 'localhost',
  });

  useEffect(() => {
    const currentPath = location.pathname;
    const subdomain = window.location.hostname.split('.')[0];
    const isSubdomain = subdomain && subdomain !== 'localhost' && subdomain !== 'www';

    // Validate restaurant exists for subdomain access with caching
    const validateRestaurant = async () => {
      if (isSubdomain) {
        setIsValidatingRestaurant(true);

        // Check cache first
        const cacheKey = `restaurant_${subdomain}`;
        const cached = restaurantCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setRestaurantExists(cached.exists);
          setIsValidatingRestaurant(false);
          return;
        }

        try {
          await restaurantService.getByUrlName(subdomain);
          setRestaurantExists(true);
          // Cache the result
          restaurantCache.set(cacheKey, {
            exists: true,
            timestamp: Date.now(),
          });
        } catch (error) {
          if (error.response?.status === 404) {
            setRestaurantExists(false);
            // Cache the negative result
            restaurantCache.set(cacheKey, {
              exists: false,
              timestamp: Date.now(),
            });
          } else {
            console.error('Error validating restaurant:', error);
            setRestaurantExists(false);
          }
        } finally {
          setIsValidatingRestaurant(false);
        }
      }
    };

    validateRestaurant();

    console.log('RouteGuard - Debug Info:', {
      currentPath,
      subdomain,
      isSubdomain,
      isAuthenticated,
      isAdmin,
      hasRestaurant,
      userRole: user?.role,
      rememberMe,
      hasValidToken: !!hasValidToken,
      reduxToken: !!token,
      reduxUser: !!user,
    });

    // Early return if restaurant doesn't exist
    if (isSubdomain && !restaurantExists && !isValidatingRestaurant) {
      return;
    }

    // Handle Subdomain Access Pattern
    if (isSubdomain) {
      // Check if user owns this restaurant
      const ownsRestaurant = hasRestaurant && restaurant.url === subdomain;

      if (currentPath === '/login') {
        // Subdomain login page logic
        console.log('Subdomain login page - isAuthenticated:', isAuthenticated);

        if (isAuthenticated) {
          if (isAdmin && ownsRestaurant) {
            // If authenticated AND user is a restaurant or location admin: Redirect to /admin
            console.log('Redirecting authenticated admin to /admin');
            navigate('/admin');
            return;
          } else if (!isAdmin) {
            // If authenticated but is not admin, use a placeholder (TODO)
            console.log('TODO: Handle non-admin user redirection based on user type');
            // TODO: different redirection depending on the user type
            navigate('/', {
              state: {
                message: 'Área em desenvolvimento para seu tipo de usuário.',
              },
            });
            return;
          } else {
            // User is admin but doesn't own this restaurant
            console.log('User is admin but doesnt own restaurant, redirecting to main domain');
            navigate('/', {
              state: {
                message: 'Você não tem permissão para acessar este restaurante.',
              },
            });
            return;
          }
        }
        // If not authenticated: Show login form for that specific restaurant
        console.log('Not authenticated, showing login form for restaurant:', subdomain);
        // DO NOT navigate anywhere - let the component render the login form
      } else if (currentPath === '/admin') {
        // Admin area access - requires authentication and admin privileges
        console.log('Subdomain admin access check:', { isAuthenticated, isAdmin, ownsRestaurant });

        if (!isAuthenticated) {
          console.log('Not authenticated, redirecting to login');
          navigate('/login');
          return;
        }

        if (!isAdmin) {
          console.log('Not admin, redirecting to main domain');
          navigate('/', {
            state: {
              message: 'Você não tem permissão para acessar a área administrativa.',
            },
          });
          return;
        }

        if (!ownsRestaurant) {
          console.log('Does not own restaurant, redirecting to main domain');
          navigate('/', {
            state: {
              message: 'Você não tem permissão para acessar este restaurante.',
            },
          });
          return;
        }

        console.log('Admin access granted for restaurant:', subdomain);
      } else {
        // Any other subdomain route - apply remember me logic and handle root path
        if (currentPath === '/') {
          // Root subdomain path - redirect to login if not authenticated
          if (!isAuthenticated) {
            console.log('Root subdomain path - redirecting to login');
            navigate('/login');
            return;
          } else if (isAuthenticated && isAdmin && ownsRestaurant) {
            // Authenticated admin - redirect to admin
            console.log('Root subdomain path - redirecting authenticated admin to /admin');
            navigate('/admin');
            return;
          } else if (isAuthenticated && !isAdmin) {
            // TODO: Handle non-admin users
            console.log('TODO: Root subdomain path - handle non-admin user');
            // For now, redirect to main domain with message
            window.location.href = `http://localhost:3000/?message=${encodeURIComponent('Área em desenvolvimento para seu tipo de usuário.')}`;
            return;
          } else {
            // Admin but doesn't own restaurant
            console.log('Root subdomain path - admin but doesnt own restaurant');
            window.location.href = `http://localhost:3000/?message=${encodeURIComponent('Você não tem permissão para acessar este restaurante.')}`;
            return;
          }
        }

        // Apply remember me logic for other routes
        if (isAuthenticated && rememberMe && currentPath !== '/admin' && currentPath !== '/login') {
          if (isAdmin && ownsRestaurant) {
            // Auto-redirect to admin if user is administrator with remember me
            console.log('Remember me: Auto-redirecting admin to /admin');
            navigate('/admin');
            return;
          } else if (!isAdmin) {
            // TODO: Auto-redirect to different places depending on the user role
            console.log('TODO: Remember me auto-redirect for non-admin user based on role');
            // For now, stay on current page
          }
        }
      }
    }

    // Handle Main Domain Access Pattern (localhost:3000)
    if (!isSubdomain) {
      if (currentPath === '/') {
        // Main domain home page - Always show the home page regardless of authentication status
        console.log('Main domain home page - always showing home page');

        // Apply remember me logic for convenience (only if rememberMe is true)
        if (isAuthenticated && rememberMe && isAdmin && hasRestaurant) {
          // Auto-redirect to admin if user is administrator with remember me
          console.log('Remember me: Auto-redirecting admin to restaurant admin');
          const restaurantUrl = restaurant.url;
          const redirectUrl = `http://${restaurantUrl}.localhost:3000/admin`;
          window.location.href = redirectUrl;
          return;
        }
        // Always show home page (default behavior)
        // If authenticated: Show button to access restaurant area (handled in Home component)
        // If not authenticated: Show "Entrar" button leading to login (handled in Home component)
      } else if (currentPath === '/login') {
        // Main domain login page
        if (isAuthenticated) {
          if (isAdmin && hasRestaurant) {
            // Redirect authenticated admin to restaurant admin
            console.log('Redirecting authenticated admin from main login to restaurant admin');
            const restaurantUrl = restaurant.url;
            const redirectUrl = `http://${restaurantUrl}.localhost:3000/admin`;
            window.location.href = redirectUrl;
            return;
          } else if (!isAdmin) {
            // TODO: Redirect to appropriate area based on user type
            console.log('TODO: Redirect authenticated non-admin user based on role');
            navigate('/', {
              state: {
                message: 'Área em desenvolvimento para seu tipo de usuário.',
              },
            });
            return;
          }
        }
        // If not authenticated, show login form (default behavior)
      }
    }

    // Handle generic auth requirements
    if (requireAuth && !isAuthenticated) {
      navigate('/login', {
        state: {
          from: location,
          message: 'Por favor, faça login para acessar esta página.',
        },
      });
      return;
    }

    if (requireAdmin && isAuthenticated && !isAdmin) {
      navigate('/', {
        state: {
          message: 'Você não tem permissão para acessar esta área.',
        },
      });
      return;
    }
  }, [
    isAuthenticated,
    isAdmin,
    hasRestaurant,
    restaurant,
    user,
    token,
    rememberMe,
    navigate,
    location,
    requireAuth,
    requireAdmin,
    hasValidToken,
    restaurantExists,
    isValidatingRestaurant,
  ]);

  // Show 404 if restaurant doesn't exist
  if (!restaurantExists && !isValidatingRestaurant) {
    return <NotFound />;
  }

  // Show loading while validating restaurant
  if (isValidatingRestaurant) {
    return <div>Loading...</div>;
  }

  return children;
};

RouteGuard.propTypes = {
  children: PropTypes.node.isRequired,
  requireAuth: PropTypes.bool,
  requireAdmin: PropTypes.bool,
};

export default RouteGuard;
