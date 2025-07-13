import React from 'react';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] px-4">
      <h1 className="text-6xl font-bold text-gray-800 mb-6">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
      <p className="text-gray-600 text-center mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => (window.location.href = '/')}
        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded"
      >
        Return to Home
      </button>
    </div>
  );
};

export default NotFoundPage;
