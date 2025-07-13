import { Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { logout } from './store/authSlice';
import Layout from './components/common/Layout';

// Pages
import Home from './pages/app/Home.jsx';
import MenuPage from './pages/app/MenuPage.jsx';
import Register from './pages/app/Register.jsx';
import NotFound from './pages/app/NotFound.jsx';
import Login from './pages/app/Login.jsx';
import ConfirmEmail from './pages/app/ConfirmEmail.jsx';
import ForgotPassword from './pages/app/ForgotPassword.jsx';
import ResetPassword from './pages/app/ResetPassword.jsx';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import AdminMenuPage from './pages/admin/AdminMenuPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminRestaurantProfilePage from './pages/admin/AdminRestaurantProfilePage';
import AdminUserProfilePage from './pages/admin/AdminUserProfilePage';

function App({ getSubdomain }) {
  const isAuthenticated = useSelector((state) => !!state.auth.user);
  const dispatch = useDispatch();
  const subdomain = getSubdomain ? getSubdomain() : null;
  console.log(`Subdomain detected: ${subdomain}`);

  // Check for logout parameter and force clear authentication
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldLogout = urlParams.get('logout');

    if (shouldLogout === 'true') {
      console.log('Logout parameter detected, forcing authentication clear');

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
        // Routes for when we're on a restaurant subdomain (e.g., restaurant.localhost:3000)
        <>
          {console.log('Rendering subdomain routes for:', subdomain)}

          {/* Admin routes for restaurant subdomain */}
          <Route
            path="/admin"
            element={
              <>
                {console.log('Admin route matched!')}
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              </>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="menu" element={<AdminMenuPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="restaurant-profile" element={<AdminRestaurantProfilePage />} />
            <Route path="user-profile" element={<AdminUserProfilePage />} />
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

          {/* Menu page */}
          <Route
            path="/menu"
            element={
              <Layout>
                <MenuPage />
              </Layout>
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

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/menu" replace />} />

          {/* 404 for restaurant subdomain */}
          <Route path="*" element={<NotFound />} />
        </>
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
            {/* Forgot/Reset password routes must be top-level, not nested */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Main restaurant routes with common Layout */}
          <Route path="/:restaurantSlug" element={<Layout />}>
            {/* Public routes */}
            <Route index element={<Navigate to="menu" replace />} />
            <Route path="menu" element={<MenuPage />} />
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
            <Route path="menu" element={<AdminMenuPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="restaurant-profile" element={<AdminRestaurantProfilePage />} />
            <Route path="user-profile" element={<AdminUserProfilePage />} />
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
