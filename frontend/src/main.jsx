import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { Provider } from 'react-redux';
import store from './store';
import RehydrateAuth from './store/rehydrateAuth';
import { CartProvider } from './contexts/CartContext';
import ErrorBoundary from './components/common/ErrorBoundary';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Import our global styles with color scheme
import './styles/global.scss';

function getSubdomain() {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  // e.g. restaurant1.localhost or restaurant1.alacarteapp.com
  const match = host.match(/^([^.]+)\.localhost$/i);
  console.log(`Subdomain: ${match ? match[1] : 'none'}`);
  if (match) return match[1];
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Provider store={store}>
          <RehydrateAuth />
          <CartProvider>
            <App getSubdomain={getSubdomain} />
          </CartProvider>
        </Provider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
