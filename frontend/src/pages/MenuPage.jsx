import { useState, useEffect, useContext } from 'react';
import { CartContext } from '../contexts/CartContext';
import menuService from '../services/menuService';

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const { addItem } = useContext(CartContext);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const data = await menuService.getAllMenuItems();
        setMenuItems(data);
      } catch (err) {
        setError('Failed to load menu items. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Get unique categories from menu items
  const categories = ['all', ...new Set(menuItems.map((item) => item.category))];

  // Filter menu items by category
  const filteredItems =
    activeCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  const handleAddToCart = (item) => {
    addItem(item);
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mb-8">Our Menu</h1>

      {/* Category filter */}
      <div className="flex flex-wrap justify-center mb-8">
        {categories.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 m-1 rounded-full ${
              activeCategory === category
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Menu items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="card overflow-hidden">
            <div className="h-48 overflow-hidden">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No image available</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold">{item.name}</h3>
                <span className="text-primary-600 font-bold">${item.price.toFixed(2)}</span>
              </div>
              <p className="text-gray-600 mt-2">{item.description}</p>
              <button
                onClick={() => handleAddToCart(item)}
                disabled={!item.isAvailable}
                className={`mt-4 w-full py-2 rounded-md text-center ${
                  item.isAvailable
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {item.isAvailable ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;
