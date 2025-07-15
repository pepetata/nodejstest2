import React from 'react';
import { useSelector } from 'react-redux';

const DebugAuthState = () => {
  const { user, restaurant, token } = useSelector((state) => state.auth);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        background: '#f0f0f0',
        padding: '10px',
        fontSize: '12px',
        maxWidth: '300px',
        zIndex: 9999,
        border: '1px solid #ccc',
      }}
    >
      <h4>Auth Debug Info</h4>
      <div>
        <strong>User ID:</strong> {user?.id || 'null'}
      </div>
      <div>
        <strong>Restaurant ID:</strong> {restaurant?.id || 'null'}
      </div>
      <div>
        <strong>Restaurant Name:</strong> {restaurant?.name || 'null'}
      </div>
      <div>
        <strong>Token:</strong> {token ? 'Present' : 'null'}
      </div>
      <div>
        <strong>Restaurant Object:</strong>
      </div>
      <pre>{JSON.stringify(restaurant, null, 2)}</pre>
    </div>
  );
};

export default DebugAuthState;
