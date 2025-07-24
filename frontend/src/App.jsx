import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useMemo } from 'react';
import { logout } from './store/authSlice';
import Layout from './components/common/Layout';
import RouteGuard from './components/auth/RouteGuard';
import restaurantService from './services/restaurantService';

// Pages
import Home from './pages/app/Home.jsx';
import Register from './pages/app/Register.jsx';
import NotFound from './pages/app/NotFound.jsx';
import Login from './pages/app/Login.jsx';
import ConfirmEmail from './pages/app/ConfirmEmail.jsx';
import ForgotPassword from './pages/app/ForgotPassword.jsx';
import ResetPassword from './pages/app/ResetPassword.jsx';
import ComingSoon from './pages/ComingSoon.jsx';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/restaurant/AdminDashboard';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import AdminUsersPage from './components/admin/users/AdminUsersPage';
import UserFormPage from './pages/admin/users/UserFormPage';
import AdminRestaurantProfilePage from './pages/admin/restaurant/AdminRestaurantProfilePage';
import AdminUserProfilePage from './pages/AdminUserProfilePage';
import SimpleProfileEdit from './pages/SimpleProfileEdit';

// Cache for restaurant validation to avoid repeated API calls
const restaurantValidationCache = new Map();

function App({ getSubdomain }) {
  const { user, token, restaurant } = useSelector((state) => state.auth);
  const isAuthenticated = !!user && !!token;
  const dispatch = useDispatch();
  const location = useLocation();

  // Memoize the subdomain to prevent unnecessary re-renders
  const subdomain = useMemo(() => {
    return getSubdomain ? getSubdomain() : null;
  }, [getSubdomain]);

  const [restaurantExists, setRestaurantExists] = useState(null); // null = loading, true = exists, false = not exists

  // Check if authenticated user's restaurant matches current subdomain
  useEffect(() => {
    if (isAuthenticated && restaurant) {
      // Allow users to complete login process on main domain
      const isOnLoginPage = location.pathname === '/login' || location.pathname === '/register';
      const isOnConfirmEmail = location.pathname === '/confirm-email';
      const isOnForgotPassword = location.pathname === '/forgot-password';
      const isOnResetPassword = location.pathname === '/reset-password';
      const isOnHomePage = location.pathname === '/';
      const isOnAdminPage = location.pathname === '/admin';

      const allowedOnMainDomain =
        isOnLoginPage ||
        isOnConfirmEmail ||
        isOnForgotPassword ||
        isOnResetPassword ||
        isOnHomePage ||
        isOnAdminPage;

      if (subdomain) {
        // If user is authenticated and we're on a subdomain, check if it matches their restaurant
        if (restaurant.url !== subdomain) {
          console.log('Restaurant mismatch - logging out user');
          // Clear all authentication data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('persist:auth');
          localStorage.removeItem('persist:root');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');

          // Dispatch logout action
          dispatch(logout());
        }
      } else if (!allowedOnMainDomain) {
        // If user is authenticated with a restaurant but on main domain (and not on allowed pages),
        // they should be logged out to prevent restaurant admin from accessing main domain while logged in
        console.log('Restaurant admin on main domain - logging out');

        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('persist:auth');
        localStorage.removeItem('persist:root');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        // Dispatch logout action
        dispatch(logout());
      }
    }
  }, [isAuthenticated, subdomain, restaurant, dispatch, location.pathname]);

  // Validate restaurant existence for subdomains
  useEffect(() => {
    if (subdomain) {
      // Check cache first
      if (restaurantValidationCache.has(subdomain)) {
        const cachedResult = restaurantValidationCache.get(subdomain);
        setRestaurantExists(cachedResult);
        return;
      }

      const validateRestaurant = async () => {
        try {
          await restaurantService.getByUrlName(subdomain);
          setRestaurantExists(true);
          restaurantValidationCache.set(subdomain, true);
        } catch (error) {
          if (error.response?.status === 404 || error.response?.status === 400) {
            // Both 404 and 400 mean restaurant doesn't exist
            setRestaurantExists(false);
            restaurantValidationCache.set(subdomain, false);
          } else {
            console.error('Error validating restaurant:', error);
            setRestaurantExists(false);
            restaurantValidationCache.set(subdomain, false);
          }
        }
      };
      validateRestaurant();
    } else {
      setRestaurantExists(null); // No subdomain = no validation needed
    }
  }, [subdomain]);

  // Check for logout parameter and force clear authentication
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldLogout = urlParams.get('logout');

    if (shouldLogout === 'true') {
      // Clear all possible authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('persist:auth');
      localStorage.removeItem('persist:root');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Dispatch logout action
      dispatch(logout());

      // Clean up URL by removing logout parameter
      urlParams.delete('logout');
      const queryString = urlParams.toString();
      const newUrl = window.location.pathname + (queryString ? `?${queryString}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [dispatch]);

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return (
    <Routes>
      {subdomain ? (
        restaurantExists === null ? (
          // Loading state while validating restaurant
          <>
            <Route
              path="*"
              element={
                <Layout>
                  <div>Loading...</div>
                </Layout>
              }
            />
          </>
        ) : restaurantExists === false ? (
          // Restaurant doesn't exist - show 404 for all routes with Layout
          <>
            <Route
              path="*"
              element={
                <Layout>
                  <NotFound />
                </Layout>
              }
            />
          </>
        ) : (
          // Restaurant exists - show subdomain routes
          <>
            {/* Admin routes for restaurant subdomain */}
            <Route
              path="/admin"
              element={
                <>
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                </>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/new" element={<UserFormPage />} />
              <Route path="users/:id/edit" element={<UserFormPage />} />
              <Route path="restaurant-profile" element={<AdminRestaurantProfilePage />} />
              <Route path="user-profile" element={<AdminUserProfilePage />} />
              <Route path="user-profile/edit" element={<SimpleProfileEdit />} />
            </Route>

            {/* Waiter portal for subdomain */}
            <Route
              path="/waiter"
              element={
                <ProtectedRoute>
                  <Home source="/waiter" />
                </ProtectedRoute>
              }
            />

            {/* KDS for subdomain */}
            <Route
              path="/kds/:area"
              element={
                <ProtectedRoute>
                  <Home source="/kds/:area" />
                </ProtectedRoute>
              }
            />

            {/* Login page */}
            <Route
              path="/login"
              element={
                <Layout>
                  <Login subdomain={subdomain} />
                </Layout>
              }
            />

            {/* Coming Soon page for non-admin users */}
            <Route
              path="/coming-soon"
              element={
                <Layout>
                  <ComingSoon />
                </Layout>
              }
            />

            {/* Register page */}
            <Route
              path="/register"
              element={
                <Layout>
                  <Register />
                </Layout>
              }
            />

            {/* Order page */}
            <Route
              path="/order"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Home source="/order" />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Root redirect - handled by RouteGuard */}
            <Route
              path="/"
              element={
                <RouteGuard>
                  <Layout>
                    <Home source="/" />
                  </Layout>
                </RouteGuard>
              }
            />

            {/* 404 for restaurant subdomain */}
            <Route path="*" element={<NotFound />} />
          </>
        )
      ) : (
        // Routes for main app (localhost:3000 without subdomain)
        <>
          {/* Routes that use the Layout (with navbar) */}
          <Route path="/" element={<Layout />}>
            {/* Restaurant selection landing page */}
            <Route index element={<Home source="/" />} />
            <Route path="login" element={<Login subdomain={subdomain} />} />
            <Route path="register" element={<Register />} />
            <Route path="register-restaurant" element={<Register />} />
            <Route path="confirm-email" element={<ConfirmEmail />} />
            <Route path="coming-soon" element={<ComingSoon />} />
            {/* Forgot/Reset password routes must be top-level, not nested */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Main restaurant routes with common Layout */}
          <Route path="/:restaurantSlug" element={<Layout />}>
            {/* Public routes */}
            <Route index element={<NotFound />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="order"
              element={
                <ProtectedRoute>
                  {/* <OrderPage /> */}
                  <Home source="/order" />
                </ProtectedRoute>
              }
            />

            {/* 404 for restaurant pages */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin portal */}
          <Route
            path="/:restaurantSlug/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/new" element={<UserFormPage />} />
            <Route path="users/:id/edit" element={<UserFormPage />} />
            <Route path="restaurant-profile" element={<AdminRestaurantProfilePage />} />
            <Route path="user-profile" element={<AdminUserProfilePage />} />
            <Route path="user-profile/edit" element={<SimpleProfileEdit />} />
          </Route>

          {/* Waiter portal */}
          <Route
            path="/:restaurantSlug/waiter"
            element={
              <ProtectedRoute>
                {/* <WaiterLayout /> */}
                <Home source="/:restaurantSlug/waiter" />
              </ProtectedRoute>
            }
          >
            {/* Waiter routes will go here */}
            {/* <Route index element={<WaiterDashboard />} /> */}
          </Route>

          {/* Kitchen Display System (KDS) */}
          <Route
            path="/:restaurantSlug/kds/:area"
            element={
              <ProtectedRoute>
                {/* <KDSLayout /> */}
                <Home source="/:restaurantSlug/kds/:area" />
              </ProtectedRoute>
            }
          />

          {/* Global 404 */}
          <Route path="*" element={<NotFound />} />
        </>
      )}
    </Routes>
  );
}

App.propTypes = {
  getSubdomain: PropTypes.func,
};

export default App;
