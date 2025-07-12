import { Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import Layout from './components/common/Layout';

// Pages
import Home from './pages/Home.jsx';
import MenuPage from './pages/MenuPage.jsx';
import Register from './pages/Register.jsx';
import NotFound from './pages/NotFound.jsx';
import Login from './pages/Login.jsx';
import ConfirmEmail from './pages/ConfirmEmail.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

function App({ getSubdomain }) {
  const isAuthenticated = useSelector((state) => !!state.auth.user);
  const subdomain = getSubdomain ? getSubdomain() : null;
  console.log(`Subdomain detected: ${subdomain}`);

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
          <ProtectedRoute>
            {/* <AdminLayout /> */}
            <Home source="/:restaurantSlug/admin" />
          </ProtectedRoute>
        }
      >
        {/* Admin routes will go here */}
        {/* <Route index element={<AdminDashboard />} /> */}
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
    </Routes>
  );
}

App.propTypes = {
  getSubdomain: PropTypes.func,
};

export default App;
