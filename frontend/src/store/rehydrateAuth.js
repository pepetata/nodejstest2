import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { rehydrate } from './authSlice';

export default function RehydrateAuth() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, token } = useSelector((state) => state.auth);
  const hasRehydrated = useRef(false);
  const lastRehydrateUrl = useRef('');

  // Initial rehydration on app load
  useEffect(() => {
    if (!hasRehydrated.current) {
      console.log('Initial auth rehydration starting...');
      dispatch(rehydrate());
      hasRehydrated.current = true;
      lastRehydrateUrl.current = location.pathname;
    }
  }, [dispatch, location.pathname]);

  // Rehydrate when navigating back to the app (e.g., from a new tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasRehydrated.current) {
        // Check if we have a token but no user (state was lost)
        const hasStoredToken = localStorage.getItem('token') || sessionStorage.getItem('token');

        if (hasStoredToken && (!user || !token)) {
          console.log('Rehydrating auth on page visibility change...');
          dispatch(rehydrate());
        }
      }
    };

    const handleFocus = () => {
      // Similar check when window gains focus
      const hasStoredToken = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (hasStoredToken && (!user || !token) && hasRehydrated.current) {
        console.log('Rehydrating auth on window focus...');
        dispatch(rehydrate());
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [dispatch, user, token]);

  // Rehydrate when returning to root domain after being on subdomain
  useEffect(() => {
    const currentUrl = location.pathname;
    const isRootDomain = window.location.hostname === 'localhost';

    // If we're on root domain and haven't rehydrated for this URL
    if (isRootDomain && currentUrl !== lastRehydrateUrl.current && hasRehydrated.current) {
      const hasStoredToken = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (hasStoredToken && (!user || !token)) {
        console.log('Rehydrating auth on URL change to root domain...');
        dispatch(rehydrate());
      }

      lastRehydrateUrl.current = currentUrl;
    }
  }, [location.pathname, dispatch, user, token]);

  return null;
}
