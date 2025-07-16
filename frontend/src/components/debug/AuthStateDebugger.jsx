/* eslint-disable no-undef, no-console */
// Test authentication state detection
import { useSelector, useDispatch } from 'react-redux';
import { setUser, simulateAuth } from '../../store/authSlice';

const AuthStateDebugger = () => {
  const authState = useSelector((state) => state.auth);
  const { user, token, restaurant } = authState;
  const dispatch = useDispatch();

  // More robust authentication check - ensure both Redux state and token are consistent
  const storage = {
    get: (key) => {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    },
    set: (key, value) => {
      localStorage.setItem(key, value);
    },
  };

  const hasValidToken = storage.get('token');
  const isAuthenticated = !!user && !!token && !!hasValidToken;
  const isAdmin =
    user?.role === 'restaurant_administrator' || user?.role === 'location_administrator';
  const hasRestaurant = !!restaurant;

  // Simulate authentication for testing
  const simulateAuthPadre4 = () => {
    const mockUser = {
      id: '1',
      email: 'flavio_luiz_ferreira@hotmail.com',
      role: 'restaurant_administrator',
    };
    const mockToken = 'mock-token-123';
    const mockRestaurant = {
      id: '1',
      name: 'Restaurante do Padre',
      url: 'padre4',
    };

    storage.set('token', mockToken);

    // Dispatch actions to update the full state
    dispatch(
      simulateAuth({
        user: mockUser,
        token: mockToken,
        restaurant: mockRestaurant,
      })
    );

    console.log('Simulated authentication for padre4 restaurant');
  };

  const simulateAuthPadre2 = () => {
    const mockUser = {
      id: '2',
      email: 'flavio_luiz_ferreira_chain@hotmail.com',
      role: 'restaurant_administrator',
    };
    const mockToken = 'mock-token-456';
    const mockRestaurant = {
      id: '2',
      name: 'Restaurante do Padre 2',
      url: 'padre2',
    };

    storage.set('token', mockToken);

    // Dispatch actions to update the full state
    dispatch(
      simulateAuth({
        user: mockUser,
        token: mockToken,
        restaurant: mockRestaurant,
      })
    );

    console.log('Simulated authentication for padre2 restaurant');
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('persist:auth');
    localStorage.removeItem('persist:root');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    dispatch(setUser(null));
    console.log('Authentication cleared');
  };

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f0f0f0',
        margin: '20px',
        borderRadius: '5px',
      }}
    >
      <h3>Authentication State Debugger</h3>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={simulateAuthPadre4} style={{ marginRight: '10px', padding: '5px 10px' }}>
          Simulate Auth (padre4)
        </button>
        <button onClick={simulateAuthPadre2} style={{ marginRight: '10px', padding: '5px 10px' }}>
          Simulate Auth (padre2)
        </button>
        <button onClick={clearAuth} style={{ padding: '5px 10px' }}>
          Clear Auth
        </button>
      </div>

      <div>
        <strong>Redux State:</strong>
        <pre>{JSON.stringify(authState, null, 2)}</pre>
      </div>
      <div>
        <strong>Storage Token:</strong> {hasValidToken ? 'Present' : 'Not found'}
      </div>
      <div>
        <strong>Computed Values:</strong>
        <ul>
          <li>isAuthenticated: {isAuthenticated.toString()}</li>
          <li>isAdmin: {isAdmin.toString()}</li>
          <li>hasRestaurant: {hasRestaurant.toString()}</li>
          <li>Restaurant URL: {restaurant?.url || 'none'}</li>
        </ul>
      </div>
    </div>
  );
};

export default AuthStateDebugger;
