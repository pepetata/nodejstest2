import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { restaurantSlug } = useParams();
  const location = useLocation();

  // Check if we're on an admin, waiter, or KDS page
  const isSpecialPortal =
    location.pathname.includes('/admin') ||
    location.pathname.includes('/waiter') ||
    location.pathname.includes('/kds');

  // Don't show regular navbar on special portals
  if (isSpecialPortal) {
    return null;
  }

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to={restaurantSlug ? `/${restaurantSlug}` : '/'} className="text-xl font-bold">
            {restaurantSlug
              ? `${restaurantSlug.charAt(0).toUpperCase() + restaurantSlug.slice(1)} Restaurant`
              : 'A la carte'}
          </Link>

          {restaurantSlug && (
            <div className="ml-10 space-x-4 hidden md:flex">
              <Link to={`/${restaurantSlug}/menu`} className="hover:text-gray-300">
                Menu
              </Link>
              {isAuthenticated && (
                <Link to={`/${restaurantSlug}/order`} className="hover:text-gray-300">
                  Order
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="hidden md:inline">Welcome, {user?.name || 'User'}</span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to={restaurantSlug ? `/${restaurantSlug}/login` : '/login'}
                className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded transition"
              >
                Login
              </Link>
              <Link
                to={restaurantSlug ? `/${restaurantSlug}/register` : '/register'}
                className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded transition hidden md:inline-block"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
