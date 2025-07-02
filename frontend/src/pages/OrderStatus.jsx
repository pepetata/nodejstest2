import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const OrderStatusPage = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock order statuses for demonstration
  const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

  // Simulate fetching order data
  useEffect(() => {
    // In a real app, you would fetch from your API
    const fetchOrder = async () => {
      try {
        // Mock API call
        setTimeout(() => {
          // Simulate an order
          const mockOrder = {
            id: orderId,
            status: statuses[Math.floor(Math.random() * 3)], // Random status
            items: [
              { id: 1, name: 'Margherita Pizza', quantity: 1, price: 12.99 },
              { id: 2, name: 'Garlic Bread', quantity: 2, price: 4.5 },
            ],
            total: 21.99,
            estimatedDelivery: '30-45 minutes',
            placedAt: new Date().toLocaleString(),
          };

          setOrder(mockOrder);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Could not fetch order details');
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getStatusStep = (status) => {
    return statuses.indexOf(status) + 1;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="bg-primary-600 text-white px-4 py-2 rounded"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Order #{order.id}</h1>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium text-sm capitalize">
            {order.status}
          </span>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Order Progress</h2>
          <div className="relative">
            <div className="h-1 bg-gray-200 w-full absolute top-4"></div>
            <div className="flex justify-between relative">
              {statuses.map((status, index) => {
                const isActive = getStatusStep(order.status) >= index + 1;
                return (
                  <div key={status} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full z-10 flex items-center justify-center ${
                        isActive ? 'bg-primary-600 text-white' : 'bg-gray-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-sm mt-2 capitalize">{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Order Details</h2>
          <p>Placed: {order.placedAt}</p>
          <p>Estimated Delivery: {order.estimatedDelivery}</p>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Items:</h3>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-2">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => navigate('/')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded mr-2"
          >
            Order More
          </button>
          <button
            onClick={() => {}}
            className="border border-gray-400 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
          >
            Need Help?
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage;
