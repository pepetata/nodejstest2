import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaList,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';
import '../../../styles/admin/menu/adminCategoriesPage.scss';

const MenuCategoriesPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [restaurantLanguages, setRestaurantLanguages] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formData, setFormData] = useState({
    translations: {},
    parent_category_id: null,
    display_order: 0,
    is_active: true,
  });

  // Check user permissions
  const hasMenuAccess =
    user?.role === 'restaurant_administrator' ||
    user?.role === 'superadmin' ||
    (user?.role_location_pairs &&
      user.role_location_pairs.some(
        (pair) =>
          pair.role_name === 'restaurant_administrator' ||
          pair.role_name === 'location_administrator'
      ));

  // Fetch restaurant languages
  const fetchRestaurantLanguages = useCallback(async () => {
    console.log('=== DEBUG USER OBJECT ===');
    console.log('Full user object:', user);
    console.log('user.restaurant:', user?.restaurant);
    console.log('user.restaurant_id:', user?.restaurant_id);
    console.log('token exists:', !!token);

    if (!token || (!user?.restaurant?.id && !user?.restaurant_id)) {
      console.log('fetchRestaurantLanguages - early return, missing token or restaurant');
      console.log('Missing:', {
        token: !token,
        restaurant_id: !user?.restaurant?.id && !user?.restaurant_id,
      });
      return;
    }

    // Use user.restaurant_id if user.restaurant.id is not available
    const restaurantId = user?.restaurant?.id || user?.restaurant_id;
    console.log('Using restaurant ID:', restaurantId);

    try {
      console.log('fetchRestaurantLanguages - starting API calls');
      const [availableResponse, restaurantResponse] = await Promise.all([
        fetch('/api/v1/languages/available', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/v1/restaurants/${restaurantId}/languages`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      console.log('fetchRestaurantLanguages - API responses:', {
        available: availableResponse.ok,
        restaurant: restaurantResponse.ok,
      });

      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        console.log('fetchRestaurantLanguages - available languages:', availableData.data);
        setAvailableLanguages(availableData.data || []);
      }

      if (restaurantResponse.ok) {
        const restaurantData = await restaurantResponse.json();
        const languages = restaurantData.data || [];
        console.log('fetchRestaurantLanguages - restaurant languages:', languages);
        setRestaurantLanguages(languages);

        // Initialize form translations based on restaurant languages
        const initialTranslations = {};
        languages.forEach((lang) => {
          // Map language_code to code for compatibility
          const languageCode = lang.language_code || lang.code;
          initialTranslations[languageCode] = { name: '', description: '' };
        });

        console.log('fetchRestaurantLanguages - initial translations:', initialTranslations);
        setFormData((prev) => ({
          ...prev,
          translations: initialTranslations,
        }));
      }
    } catch (err) {
      console.error('Error fetching languages:', err);
    }
  }, [token, user]);

  // Helper function to get translation by language ID
  const getTranslation = (translations, languageId) => {
    if (!translations || !Array.isArray(translations)) return null;
    return translations.find((t) => t.language_id === languageId);
  };

  // Helper function to get primary translation (first available)
  const getPrimaryTranslation = (translations) => {
    if (!translations || !Array.isArray(translations) || translations.length === 0) return null;
    return translations[0]; // Return first translation as primary
  };

  const loadCategories = useCallback(async () => {
    if (!token) {
      setError('Token de autenticação não encontrado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/menu/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar categorias: ${response.statusText}`);
      }

      const data = await response.json();
      setCategories(data.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (hasMenuAccess && token) {
      fetchRestaurantLanguages();
      loadCategories();
    }
  }, [hasMenuAccess, token, fetchRestaurantLanguages, loadCategories]);

  // Transform frontend format to backend format
  const transformFormData = (data) => {
    // Create language code to restaurant_language_id mapping from restaurantLanguages
    const languageMap = {};
    restaurantLanguages.forEach((lang) => {
      const languageCode = lang.language_code || lang.code;
      languageMap[languageCode] = lang.id; // Use restaurant_languages.id, not languages.id
    });

    console.log('transformFormData - languageMap:', languageMap);
    console.log('transformFormData - restaurantLanguages:', restaurantLanguages);
    console.log('transformFormData - data.translations:', data.translations);

    // Convert translations object to array
    const translations = Object.entries(data.translations)
      .filter(([_, translation]) => translation.name.trim()) // Only include translations with names
      .map(([languageCode, translation]) => ({
        language_id: languageMap[languageCode],
        name: translation.name.trim(),
        description: translation.description?.trim() || null,
      }));

    console.log('transformFormData - final translations:', translations);

    return {
      ...data,
      translations,
      // Convert display_order to integer
      display_order: parseInt(data.display_order) || 0,
      // Convert boolean to status
      status: data.is_active ? 'active' : 'inactive',
      // Remove is_active as we're using status instead
      is_active: undefined,
    };
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Token de autenticação não encontrado');
      return;
    }

    // Ensure languages are loaded before submitting
    if (restaurantLanguages.length === 0) {
      setError('Aguarde o carregamento dos idiomas antes de criar a categoria');
      return;
    }

    try {
      const transformedData = transformFormData(formData);
      console.log('handleCreateCategory - submitting data:', transformedData);

      const response = await fetch('/api/v1/menu/categories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar categoria');
      }

      await loadCategories();
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err.message);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Token de autenticação não encontrado');
      return;
    }

    try {
      const transformedData = transformFormData(formData);

      const response = await fetch(`/api/v1/menu/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar categoria');
      }

      await loadCategories();
      setEditingCategory(null);
      resetForm();
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/menu/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir categoria');
      }

      await loadCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.message);
    }
  };

  const handleToggleStatus = async (categoryId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      const response = await fetch(`/api/v1/menu/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao alterar status da categoria');
      }

      await loadCategories();
    } catch (err) {
      console.error('Error toggling category status:', err);
      setError(err.message);
    }
  };

  const getSortedCategories = () => {
    const sorted = [...categories].sort((a, b) => {
      let aValue, bValue;

      if (sortBy === 'name') {
        aValue = getPrimaryTranslation(a.translations)?.name || '';
        bValue = getPrimaryTranslation(b.translations)?.name || '';
      } else if (sortBy === 'order') {
        aValue = a.display_order || 0;
        bValue = b.display_order || 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const resetForm = () => {
    // Initialize translations based on restaurant languages
    const initialTranslations = {};
    restaurantLanguages.forEach((lang) => {
      initialTranslations[lang.code] = { name: '', description: '' };
    });

    setFormData({
      translations: initialTranslations,
      parent_category_id: null,
      display_order: 0,
      is_active: true,
    });
  };

  const handleEdit = (category) => {
    setEditingCategory(category);

    // Initialize translations for all restaurant languages
    const editTranslations = {};
    restaurantLanguages.forEach((lang) => {
      editTranslations[lang.code] = {
        name: category.translations?.[lang.code]?.name || '',
        description: category.translations?.[lang.code]?.description || '',
      };
    });

    setFormData({
      translations: editTranslations,
      parent_category_id: category.parent_category_id,
      display_order: category.display_order,
      is_active: category.is_active,
    });
  };

  const handleInputChange = (lang, field, value) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: {
          ...prev.translations[lang],
          [field]: value,
        },
      },
    }));
  };

  if (!hasMenuAccess) {
    return (
      <div className="menu-categories-page">
        <div className="access-denied">
          <h2>Acesso Negado</h2>
          <p>Você não tem permissão para gerenciar categorias do cardápio.</p>
          <Link to="/admin" className="btn btn-primary">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-categories-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="page-title-section">
            <h1 className="page-title">
              <FaList />
              Categorias do Cardápio
            </h1>
            <p className="page-subtitle">
              Gerencie as categorias do seu cardápio com suporte multilíngue
            </p>
          </div>
          <button
            onClick={() => {
              console.log('Opening form - Restaurant languages:', restaurantLanguages);
              console.log('Available languages:', availableLanguages);
              setShowCreateForm(true);
            }}
            className="btn btn-primary"
            disabled={loading}
          >
            <FaPlus />
            Nova Categoria
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="statistics-row">
        <div className="stat-card">
          <div className="stat-icon">
            <FaList />
          </div>
          <div className="stat-content">
            <h3>{categories.length}</h3>
            <p>Total de Categorias</p>
          </div>
        </div>

        <div className="stat-card active">
          <div className="stat-icon">
            <FaEdit />
          </div>
          <div className="stat-content">
            <h3>{categories.filter((cat) => cat.status === 'active').length}</h3>
            <p>Categorias Ativas</p>
          </div>
        </div>

        <div className="stat-card inactive">
          <div className="stat-icon">
            <FaTimes />
          </div>
          <div className="stat-content">
            <h3>{categories.filter((cat) => cat.status === 'inactive').length}</h3>
            <p>Categorias Inativas</p>
          </div>
        </div>

        <div className="stat-card languages">
          <div className="stat-icon">
            <FaList />
          </div>
          <div className="stat-content">
            <h3>{restaurantLanguages.length}</h3>
            <p>Idiomas Suportados</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger">
          <FaTimes className="me-2" />
          {error}
          <button onClick={() => setError(null)} className="alert-close">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="categories-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando categorias...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-content">
              <FaList className="empty-icon" />
              <h3>Nenhuma categoria encontrada</h3>
              <p>Crie sua primeira categoria para começar a organizar seu cardápio</p>
              <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
                <FaPlus /> Criar Primeira Categoria
              </button>
            </div>
          </div>
        ) : (
          <div className="categories-table-container">
            {/* Table Controls */}
            <div className="table-controls">
              <div className="sort-controls">
                <span>Ordenar por:</span>
                <button
                  className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => handleSort('name')}
                >
                  Nome
                  {sortBy === 'name' && (
                    <span className={`sort-indicator ${sortOrder}`}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
                <button
                  className={`sort-btn ${sortBy === 'order' ? 'active' : ''}`}
                  onClick={() => handleSort('order')}
                >
                  Ordem
                  {sortBy === 'order' && (
                    <span className={`sort-indicator ${sortOrder}`}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Categories Table */}
            <div className="categories-table">
              <div className="table-header">
                <div className="table-row header-row">
                  <div className="table-cell name-cell">NOME</div>
                  <div className="table-cell parent-cell">CATEGORIA PAI</div>
                  <div className="table-cell order-cell">ORDEM</div>
                  <div className="table-cell status-cell">STATUS</div>
                  <div className="table-cell actions-cell">AÇÕES</div>
                </div>
              </div>

              <div className="table-body">
                {getSortedCategories().map((category) => (
                  <div key={category.id} className="table-row">
                    <div className="table-cell name-cell">
                      <strong>
                        {getPrimaryTranslation(category.translations)?.name || 'Sem nome'}
                      </strong>
                    </div>

                    <div className="table-cell parent-cell">
                      {category.parent_category_id ? (
                        <span className="parent-category">
                          {getPrimaryTranslation(
                            categories.find((c) => c.id === category.parent_category_id)
                              ?.translations
                          )?.name || 'Categoria pai'}
                        </span>
                      ) : (
                        <span className="no-parent">-</span>
                      )}
                    </div>

                    <div className="table-cell order-cell">
                      <span className="order-badge">{category.display_order}</span>
                    </div>

                    <div className="table-cell status-cell">
                      <span
                        className={`status-badge ${category.status === 'active' ? 'active' : 'inactive'}`}
                      >
                        {category.status === 'active' ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>

                    <div className="table-cell actions-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => console.log('View category:', category)}
                          className="btn-action btn-view"
                          title="Visualizar categoria"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleEdit(category)}
                          className="btn-action btn-edit"
                          title="Editar categoria"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(category.id, category.status)}
                          className={`btn-action ${category.status === 'active' ? 'btn-disable' : 'btn-enable'}`}
                          title={
                            category.status === 'active'
                              ? 'Desativar categoria'
                              : 'Ativar categoria'
                          }
                        >
                          {category.status === 'active' ? <FaEyeSlash /> : <FaEye />}
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="btn-action btn-delete"
                          title="Excluir categoria"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingCategory) && (
        <div className="form-modal">
          <div className="form-container">
            <div className="form-header">
              <h3>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCategory(null);
                  resetForm();
                }}
                className="btn-close"
              >
                <FaTimes />
              </button>
            </div>

            <form
              onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
              className="category-form"
            >
              <div className="form-sections">
                {/* Traduções */}
                <div className="form-section">
                  <h4>Traduções</h4>
                  {console.log(
                    'Rendering translations - restaurantLanguages:',
                    restaurantLanguages
                  )}
                  {console.log(
                    'Rendering translations - formData.translations:',
                    formData.translations
                  )}
                  {restaurantLanguages.length === 0 ? (
                    <div className="loading-message">Carregando idiomas...</div>
                  ) : (
                    restaurantLanguages.map((lang) => {
                      // Use language_code if available, fallback to code for compatibility
                      const languageCode = lang.language_code || lang.code;
                      const translation = formData.translations[languageCode] || {
                        name: '',
                        description: '',
                      };
                      return (
                        <div key={languageCode} className="language-section">
                          <h5 className="language-header">
                            <span className="language-flag">
                              {lang.flag_file ? (
                                <img
                                  src={`/images/languages/${lang.flag_file}`}
                                  alt={`${lang.native_name} flag`}
                                  className="flag-image"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                '🏳️'
                              )}
                            </span>
                            <span className="language-names">
                              <span className="language-native">{lang.native_name}</span>
                              {lang.language_name && lang.language_name !== lang.native_name && (
                                <span className="language-name"> ({lang.language_name})</span>
                              )}
                            </span>
                          </h5>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Nome *</label>
                              <input
                                type="text"
                                value={translation.name}
                                onChange={(e) =>
                                  handleInputChange(languageCode, 'name', e.target.value)
                                }
                                required={languageCode === 'pt-BR'} // Portuguese is required
                              />
                            </div>
                            <div className="form-group">
                              <label>Descrição</label>
                              <textarea
                                value={translation.description}
                                onChange={(e) =>
                                  handleInputChange(languageCode, 'description', e.target.value)
                                }
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Configurações */}
                <div className="form-section">
                  <h4>Configurações</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Categoria Pai</label>
                      <select
                        value={formData.parent_category_id || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            parent_category_id: e.target.value || null,
                          }))
                        }
                      >
                        <option value="">Categoria principal</option>
                        {categories
                          .filter((cat) => !editingCategory || cat.id !== editingCategory.id)
                          .map((category) => (
                            <option key={category.id} value={category.id}>
                              {getPrimaryTranslation(category.translations)?.name || 'Sem nome'}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Ordem de Exibição</label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            display_order: parseInt(e.target.value) || 0,
                          }))
                        }
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            is_active: e.target.checked,
                          }))
                        }
                      />
                      Categoria ativa
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  <FaSave /> {editingCategory ? 'Atualizar' : 'Criar'} Categoria
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingCategory(null);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCategoriesPage;
