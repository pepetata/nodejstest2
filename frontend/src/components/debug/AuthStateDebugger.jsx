/* eslint-disable no-undef, no-console */
// Test authentication state detection and persistence
import { useSelector, useDispatch } from 'react-redux';
import { setUser, simulateAuth, rehydrate } from '../../store/authSlice';

const AuthStateDebugger = () => {
  const authState = useSelector((state) => state.auth);
  const { user, token, restaurant, rememberMe } = authState;
  const dispatch = useDispatch();

  // Storage utility to check token consistency
  const storage = {
    get: (key) => {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    },
    set: (key, value, useLocalStorage = true) => {
      if (useLocalStorage) {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
    },
    clear: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('persist:auth');
      localStorage.removeItem('persist:root');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    },
  };

  const hasValidToken = storage.get('token');
  const isAuthenticated = !!user && !!token && !!hasValidToken;
  const isAdmin =
    user?.role === 'restaurant_administrator' || user?.role === 'location_administrator';
  const hasRestaurant = !!restaurant;

  // Test login with remember me
  const testLoginWithRememberMe = () => {
    const mockUser = {
      id: '1',
      email: 'test@remember.com',
      role: 'restaurant_administrator',
    };
    const mockToken = 'test-remember-token-123';
    const mockRestaurant = {
      id: '1',
      name: 'Test Restaurant',
      url: 'testrest',
    };

    // Store with remember me
    storage.set('rememberMe', 'true', true);
    storage.set('token', mockToken, true);

    dispatch(
      simulateAuth({
        user: mockUser,
        token: mockToken,
        restaurant: mockRestaurant,
        rememberMe: true,
      })
    );

    console.log('✅ Login with Remember Me simulated - should persist after page refresh');
  };

  // Test login without remember me
  const testLoginWithoutRememberMe = () => {
    const mockUser = {
      id: '2',
      email: 'test@session.com',
      role: 'restaurant_administrator',
    };
    const mockToken = 'test-session-token-456';
    const mockRestaurant = {
      id: '2',
      name: 'Test Restaurant 2',
      url: 'testrest2',
    };

    // Store without remember me
    storage.set('rememberMe', 'false', true);
    storage.set('token', mockToken, false);

    dispatch(
      simulateAuth({
        user: mockUser,
        token: mockToken,
        restaurant: mockRestaurant,
        rememberMe: false,
      })
    );

    console.log('✅ Login without Remember Me simulated - should NOT persist after page refresh');
  };

  // Test rehydration
  const testRehydration = () => {
    console.log('🔄 Testing rehydration...');
    dispatch(rehydrate());
  };

  // Clear all auth data
  const clearAuth = () => {
    storage.clear();
    dispatch(setUser(null));
    console.log('🧹 Authentication cleared');
  };

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f0f8ff',
        margin: '20px',
        borderRadius: '8px',
        border: '2px solid #4169e1',
      }}
    >
      <h3 style={{ color: '#4169e1', marginBottom: '20px' }}>🔧 Auth Persistence Testing</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>🧪 Test Functions:</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <button
            onClick={testLoginWithRememberMe}
            style={{
              padding: '8px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Login with Remember Me
          </button>
          <button
            onClick={testLoginWithoutRememberMe}
            style={{
              padding: '8px 12px',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Login without Remember Me
          </button>
          <button
            onClick={testRehydration}
            style={{
              padding: '8px 12px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Test Rehydration
          </button>
          <button
            onClick={clearAuth}
            style={{
              padding: '8px 12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear Auth
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4>📋 Test Instructions:</h4>
        <ol style={{ fontSize: '14px', lineHeight: '1.5' }}>
          <li>
            <strong>Remember Me Test:</strong> Click "Login with Remember Me", then refresh page
            (F5) - auth should persist
          </li>
          <li>
            <strong>Session Test:</strong> Click "Login without Remember Me", then refresh page (F5)
            - auth should NOT persist
          </li>
          <li>
            <strong>New Tab Test:</strong> After login, open new tab to{' '}
            <code>http://localhost:3000</code> - auth should persist if Remember Me was used
          </li>
          <li>
            <strong>Subdomain Test:</strong> Login with Remember Me, navigate to{' '}
            <code>testrest.localhost:3000</code>, then back to <code>localhost:3000</code>
          </li>
        </ol>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <h4>🔍 Redux State:</h4>
          <div
            style={{
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          >
            <div>User: {user ? '✅ Present' : '❌ Missing'}</div>
            <div>Token: {token ? '✅ Present' : '❌ Missing'}</div>
            <div>Restaurant: {restaurant ? '✅ Present' : '❌ Missing'}</div>
            <div>Remember Me: {rememberMe ? '✅ True' : '❌ False'}</div>
            <div>Status: {authState.status}</div>
          </div>
        </div>

        <div>
          <h4>💾 Storage State:</h4>
          <div
            style={{
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          >
            <div>
              localStorage token: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}
            </div>
            <div>
              sessionStorage token: {sessionStorage.getItem('token') ? '✅ Present' : '❌ Missing'}
            </div>
            <div>Remember Me flag: {localStorage.getItem('rememberMe') || '❌ Not set'}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '15px' }}>
        <h4>📊 Computed Values:</h4>
        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          <div>isAuthenticated: {isAuthenticated ? '✅ True' : '❌ False'}</div>
          <div>isAdmin: {isAdmin ? '✅ True' : '❌ False'}</div>
          <div>hasRestaurant: {hasRestaurant ? '✅ True' : '❌ False'}</div>
          <div>hasValidToken: {hasValidToken ? '✅ True' : '❌ False'}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthStateDebugger;
