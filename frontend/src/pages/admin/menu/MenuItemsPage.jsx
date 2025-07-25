import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaEye,
  FaEyeSlash,
  FaPowerOff,
  FaUtensils,
  FaSortAmountDown,
  FaSortAmountUp,
  FaDollarSign,
  FaExclamationTriangle,
  FaTimes,
} from 'react-icons/fa';
import { MdLanguage } from 'react-icons/md';
import '../../../styles/admin/menu/menuItemsPage.scss';
import '../../../styles/components/modal.scss';

const MenuItemsPage = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useSelector((state) => state.auth);
  const restaurant = useSelector((state) => state.auth.restaurant);

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurantLanguages, setRestaurantLanguages] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [error, setError] = useState('');

  // Modal and data loss prevention states
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Check if we're on a subdomain
  const isSubdomain =
    !restaurantSlug &&
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname.includes('.localhost');

  const basePath = isSubdomain ? '' : `/${restaurantSlug}`;

  // Data loss prevention functions
  const handleBeforeUnload = useCallback(
    (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return e.returnValue;
      }
    },
    [hasUnsavedChanges]
  );

  const handleUnsavedNavigation = useCallback(
    (destination) => {
      if (hasUnsavedChanges) {
        setPendingNavigation(destination);
        setShowUnsavedModal(true);
        return false;
      }
      return true;
    },
    [hasUnsavedChanges]
  );

  const handleConfirmNavigation = useCallback(() => {
    setHasUnsavedChanges(false);
    setShowUnsavedModal(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [navigate, pendingNavigation]);

  const handleCancelNavigation = useCallback(() => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  }, []);

  // Track unsaved changes when form fields change
  const trackChanges = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Add beforeunload event listener
  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleBeforeUnload]);

  const fetchMenuItems = useCallback(async () => {
    if (!restaurant?.id) return;

    try {
      const languageCode = selectedLanguage?.code || 'pt-BR';
      const response = await fetch(
        `/api/restaurants/${restaurant.id}/menu-items?language=${languageCode}${
          searchTerm ? `&search=${searchTerm}` : ''
        }${selectedCategory ? `&category_id=${selectedCategory}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.data || []);
      } else {
        throw new Error('Erro ao buscar itens do cardápio');
      }
    } catch (fetchError) {
      console.error('Error fetching menu items:', fetchError);
      setError('Erro ao carregar itens do cardápio');
    }
  }, [restaurant?.id, selectedLanguage?.code, searchTerm, selectedCategory, token]);

  const fetchCategories = useCallback(async () => {
    if (!restaurant?.id) return;

    try {
      const response = await fetch(`/api/v1/menu/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (fetchError) {
      console.error('Error fetching categories:', fetchError);
    }
  }, [restaurant?.id, token]);

  // Helper function to get category name in selected language
  const getCategoryNameInLanguage = (category, language) => {
    if (!category || !category.translations || !Array.isArray(category.translations)) {
      return category?.name || 'Sem nome';
    }

    // Find translation for selected language
    if (language && language.id) {
      const translation = category.translations.find((t) => t.language_id === language.id);
      if (translation && translation.name) {
        return translation.name;
      }
    }

    // Fallback to first available translation or original name
    const firstTranslation = category.translations[0];
    return firstTranslation?.name || category.name || 'Sem nome';
  };

  // Fetch restaurant languages
  const fetchRestaurantLanguages = useCallback(async () => {
    if (!restaurant?.id) return;

    try {
      const [restaurantLanguagesResponse, availableLanguagesResponse] = await Promise.all([
        fetch(`/api/v1/restaurants/${restaurant.id}/languages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch('/api/v1/languages/available', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (restaurantLanguagesResponse.ok) {
        const restaurantLangsData = await restaurantLanguagesResponse.json();
        setRestaurantLanguages(restaurantLangsData.data || []);

        // Set default selected language to the first restaurant language
        if (restaurantLangsData.data && restaurantLangsData.data.length > 0) {
          setSelectedLanguage(restaurantLangsData.data[0]);
        }
      } else {
        console.error('Failed to fetch restaurant languages');
      }

      if (availableLanguagesResponse.ok) {
        const availableLangsData = await availableLanguagesResponse.json();
        setAvailableLanguages(availableLangsData.data || []);
      } else {
        console.error('Failed to fetch available languages');
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      setError('Failed to load languages');
    }
  }, [restaurant?.id, token]);

  const fetchData = useCallback(async () => {
    if (!restaurant?.id) return;

    try {
      setLoading(true);
      await Promise.all([fetchMenuItems(), fetchCategories(), fetchRestaurantLanguages()]);
    } catch (fetchError) {
      console.error('Error fetching data:', fetchError);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [restaurant?.id, fetchMenuItems, fetchCategories, fetchRestaurantLanguages]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMenuItems();
    trackChanges();
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    trackChanges();
    // Trigger search with new category
    setTimeout(() => fetchMenuItems(), 100);
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setShowLanguageDropdown(false);
    // Trigger menu items refresh after language change
    setTimeout(() => fetchMenuItems(), 100);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toggleAvailability = async (itemId) => {
    try {
      const response = await fetch(`/api/menu-items/${itemId}/toggle-availability`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchMenuItems(); // Refresh the list
      } else {
        throw new Error('Erro ao alterar disponibilidade do item');
      }
    } catch (toggleError) {
      console.error('Error toggling availability:', toggleError);
      setError('Erro ao alterar disponibilidade do item');
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Tem certeza que deseja excluir este item do cardápio?')) {
      return;
    }

    try {
      const response = await fetch(`/api/menu-items/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchMenuItems(); // Refresh the list
      } else {
        throw new Error('Erro ao excluir item do cardápio');
      }
    } catch (deleteError) {
      console.error('Error deleting item:', deleteError);
      setError('Erro ao excluir item do cardápio');
    }
  };

  const sortedItems = [...menuItems].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.name || '';
        bValue = b.name || '';
        break;
      case 'base_price':
        aValue = parseFloat(a.base_price) || 0;
        bValue = parseFloat(b.base_price) || 0;
        break;
      case 'category':
        aValue = a.categories?.[0]?.name || '';
        bValue = b.categories?.[0]?.name || '';
        break;
      default:
        aValue = a.display_order || 0;
        bValue = b.display_order || 0;
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  if (loading) {
    return (
      <div className="menu-items-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando itens do cardápio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-items-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="page-title-section">
            <h1 className="page-title">
              <FaUtensils />
              Itens do Cardápio
            </h1>
            <p className="page-subtitle">Gerencie os pratos e bebidas do seu restaurante</p>
          </div>

          <div className="page-actions">
            <Link to={`${basePath}/admin/menu/items/new`} className="btn btn-primary">
              <FaPlus />
              Adicionar Item
            </Link>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger">
          {error}
          <button className="alert-close" onClick={() => setError('')}>
            ×
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="statistics-row">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUtensils />
          </div>
          <div className="stat-content">
            <h3>{menuItems.length}</h3>
            <p>Total de Itens</p>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-icon">
            <FaPowerOff />
          </div>
          <div className="stat-content">
            <h3>{menuItems.filter((item) => item.is_available).length}</h3>
            <p>Itens Disponíveis</p>
          </div>
        </div>
        <div className="stat-card inactive">
          <div className="stat-icon">
            <FaPowerOff />
          </div>
          <div className="stat-content">
            <h3>{menuItems.filter((item) => !item.is_available).length}</h3>
            <p>Itens Indisponíveis</p>
          </div>
        </div>
        <div className="stat-card languages">
          <div className="stat-icon">
            <MdLanguage />
          </div>
          <div className="stat-content">
            <h3>{restaurantLanguages.length}</h3>
            <p>Idiomas</p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="items-content">
        <div className="items-table-container">
          {/* Table Controls */}
          <div className="table-controls">
            {/* Language Selector - Only show if restaurant has multiple languages */}
            {restaurantLanguages.length > 1 && (
              <div className="language-selector">
                <span>Idioma:</span>
                <div className="dropdown">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle language-btn"
                    type="button"
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    aria-expanded={showLanguageDropdown}
                  >
                    {selectedLanguage ? (
                      <>
                        <span className="language-flag">
                          {selectedLanguage.flag_file ? (
                            <img
                              src={`/images/languages/${selectedLanguage.flag_file}`}
                              alt={`${selectedLanguage.native_name} flag`}
                              className="flag-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            '🏳️'
                          )}
                        </span>
                        <span className="language-text">
                          {selectedLanguage.native_name}
                          {selectedLanguage.language_name &&
                            selectedLanguage.language_name !== selectedLanguage.native_name && (
                              <span className="language-name">
                                {' '}
                                ({selectedLanguage.language_name})
                              </span>
                            )}
                        </span>
                      </>
                    ) : (
                      'Selecione o idioma'
                    )}
                  </button>
                  <ul className={`dropdown-menu ${showLanguageDropdown ? 'show' : ''}`}>
                    {restaurantLanguages.map((language) => (
                      <li key={language.id}>
                        <button
                          className={`dropdown-item ${
                            selectedLanguage?.id === language.id ? 'active' : ''
                          }`}
                          onClick={() => handleLanguageChange(language)}
                        >
                          <span className="language-flag">
                            {language.flag_file ? (
                              <img
                                src={`/images/languages/${language.flag_file}`}
                                alt={`${language.native_name} flag`}
                                className="flag-image"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              '🏳️'
                            )}
                          </span>
                          <span className="language-text">
                            {language.native_name}
                            {language.language_name &&
                              language.language_name !== language.native_name && (
                                <span className="language-name"> ({language.language_name})</span>
                              )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="search-filter-controls">
              <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-group">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, descrição ou ingredientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <button type="submit" className="btn btn-search">
                  Buscar
                </button>
              </form>

              <div className="filter-controls">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="category-filter"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getCategoryNameInLanguage(category, selectedLanguage)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="items-table">
            <div className="table-header">
              <div className="header-row">
                <button
                  className="table-header-cell sortable"
                  onClick={() => handleSort('name')}
                  type="button"
                >
                  Nome
                  {sortBy === 'name' &&
                    (sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                </button>
                <button
                  className="table-header-cell sortable"
                  onClick={() => handleSort('category')}
                  type="button"
                >
                  Categoria
                  {sortBy === 'category' &&
                    (sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                </button>
                <button
                  className="table-header-cell sortable"
                  onClick={() => handleSort('base_price')}
                  type="button"
                >
                  Preço Base
                  {sortBy === 'base_price' &&
                    (sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                </button>
                <div className="table-header-cell">Status</div>
                <div className="table-header-cell">Ações</div>
              </div>
            </div>

            <div className="table-body">
              {sortedItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-content">
                    <div className="empty-icon">
                      <FaUtensils />
                    </div>
                    <h3>Nenhum item encontrado</h3>
                    <p>Não há itens do cardápio cadastrados ainda.</p>
                    <Link to={`${basePath}/admin/menu/items/new`} className="btn btn-primary">
                      <FaPlus />
                      Adicionar Primeiro Item
                    </Link>
                  </div>
                </div>
              ) : (
                sortedItems.map((item) => (
                  <div key={item.id} className="table-row">
                    <div className="table-cell name-cell" data-label="Nome:">
                      <strong>{item.name || 'Sem nome'}</strong>
                      {item.sku && <div className="item-sku">SKU: {item.sku}</div>}
                    </div>
                    <div className="table-cell category-cell" data-label="Categoria:">
                      {item.categories && item.categories.length > 0 ? (
                        item.categories.map((cat, index) => (
                          <span key={cat.id} className="category-badge">
                            {cat.name}
                            {index < item.categories.length - 1 && ', '}
                          </span>
                        ))
                      ) : (
                        <span className="no-category">Sem categoria</span>
                      )}
                    </div>
                    <div className="table-cell price-cell" data-label="Preço:">
                      <div className="price-display">
                        <FaDollarSign />
                        {parseFloat(item.base_price).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                    </div>
                    <div className="table-cell status-cell" data-label="Status:">
                      <span className={`status-badge ${item.is_available ? 'active' : 'inactive'}`}>
                        {item.is_available ? 'Disponível' : 'Indisponível'}
                      </span>
                    </div>
                    <div className="table-cell actions-cell" data-label="Ações:">
                      <div className="action-buttons">
                        <Link
                          to={`${basePath}/admin/menu/items/${item.id}`}
                          className="btn btn-sm btn-outline-info"
                          title="Visualizar"
                        >
                          <FaEye />
                        </Link>
                        <Link
                          to={`${basePath}/admin/menu/items/${item.id}/edit`}
                          className="btn btn-sm btn-outline-primary"
                          title="Editar"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => toggleAvailability(item.id)}
                          className={`btn btn-sm ${item.is_available ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          title={item.is_available ? 'Desabilitar' : 'Habilitar'}
                        >
                          <FaPowerOff />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="btn btn-sm btn-outline-danger"
                          title="Excluir"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <FaExclamationTriangle className="warning-icon" />
              <h3>Alterações não salvas</h3>
              <button className="modal-close" onClick={handleCancelNavigation} type="button">
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p>Você tem alterações não salvas. Deseja sair sem salvar?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCancelNavigation} type="button">
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleConfirmNavigation} type="button">
                Sair sem salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItemsPage;
