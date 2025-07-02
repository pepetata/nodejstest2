import React, { useContext } from 'react';
import { CartContext } from '../contexts/CartContext';

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, totalPrice } = useContext(CartContext);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xl text-gray-600">Your cart is empty</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
          >
            Browse Menu
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row justify-between items-center py-4 border-b"
              >
                <div className="flex flex-col md:flex-row items-center mb-4 md:mb-0">
                  <div className="w-24 h-24 relative mb-4 md:mb-0 md:mr-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{item.name}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                    <p className="text-primary-600 font-medium mt-1">${item.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center border rounded mr-6">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-3 py-1">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between mb-4">
              <span className="font-medium">Subtotal:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4 border-b pb-4">
              <span className="font-medium">Delivery Fee:</span>
              <span>$5.00</span>
            </div>
            <div className="flex justify-between mb-6">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold">${(totalPrice + 5).toFixed(2)}</span>
            </div>

            <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded">
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
