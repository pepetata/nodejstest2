import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaChevronLeft, FaList, FaSave, FaTimes } from 'react-icons/fa';
import '../../../styles/admin/menu/menuCategories.scss';

const MenuCategoriesPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [restaurantLanguages, setRestaurantLanguages] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
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
          initialTranslations[lang.code] = { name: '', description: '' };
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
    // Create language code to ID mapping from availableLanguages
    const languageMap = {};
    availableLanguages.forEach((lang) => {
      languageMap[lang.code] = lang.id;
    });

    // Convert translations object to array
    const translations = Object.entries(data.translations)
      .filter(([_, translation]) => translation.name.trim()) // Only include translations with names
      .map(([languageCode, translation]) => ({
        language_id: languageMap[languageCode],
        name: translation.name.trim(),
        description: translation.description?.trim() || null,
      }));

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

    try {
      const transformedData = transformFormData(formData);

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
    <div className="menu-categories-page">
      <div className="page-header">
        <div className="header-content">
          <Link to="/admin/menu" className="back-link">
            <FaChevronLeft /> Voltar ao Menu
          </Link>
          <h1>
            <FaList className="page-icon" />
            Categorias do Cardápio
          </h1>
          <p className="page-description">
            Gerencie as categorias do seu cardápio com suporte multilíngue
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => {
              console.log('Opening form - Restaurant languages:', restaurantLanguages);
              console.log('Available languages:', availableLanguages);
              setShowCreateForm(true);
            }}
            className="btn btn-primary"
          >
            <FaPlus /> Nova Categoria
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="alert-close">
            <FaTimes />
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando categorias...</p>
        </div>
      ) : (
        <div className="categories-content">
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
                          const translation = formData.translations[lang.code] || {
                            name: '',
                            description: '',
                          };
                          return (
                            <div key={lang.code} className="language-section">
                              <h5 className="language-header">
                                <span className="language-flag">
                                  {lang.flag_emoji || lang.flag || '🏳️'}
                                </span>
                                <span className="language-names">
                                  <span className="language-native">{lang.native_name}</span>
                                  {lang.name && lang.name !== lang.native_name && (
                                    <span className="language-name">({lang.name})</span>
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
                                      handleInputChange(lang.code, 'name', e.target.value)
                                    }
                                    required={lang.code === 'pt'} // Portuguese is required
                                  />
                                </div>
                                <div className="form-group">
                                  <label>Descrição</label>
                                  <textarea
                                    value={translation.description}
                                    onChange={(e) =>
                                      handleInputChange(lang.code, 'description', e.target.value)
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
                                  {category.translations?.pt?.name || 'Sem nome'}
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

          <div className="categories-list">
            {categories.length === 0 ? (
              <div className="empty-state">
                <FaList className="empty-icon" />
                <h3>Nenhuma categoria encontrada</h3>
                <p>Crie sua primeira categoria para começar a organizar seu cardápio</p>
                <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
                  <FaPlus /> Criar Primeira Categoria
                </button>
              </div>
            ) : (
              <div className="categories-grid">
                {categories.map((category) => (
                  <div key={category.id} className="category-card">
                    <div className="category-header">
                      <h3>{category.translations?.pt?.name || 'Sem nome'}</h3>
                      <div className="category-actions">
                        <button
                          onClick={() => handleEdit(category)}
                          className="btn btn-sm btn-outline"
                          title="Editar categoria"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="btn btn-sm btn-danger"
                          title="Excluir categoria"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    <div className="category-info">
                      <p className="category-description">
                        {category.translations?.pt?.description || 'Sem descrição'}
                      </p>

                      <div className="category-meta">
                        <span className="meta-item">Ordem: {category.display_order}</span>
                        <span className={`status ${category.is_active ? 'active' : 'inactive'}`}>
                          {category.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>

                      {category.parent_category_id && (
                        <div className="parent-category">
                          <small>
                            Subcategoria de:{' '}
                            {categories.find((c) => c.id === category.parent_category_id)
                              ?.translations?.pt?.name || 'Categoria pai'}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCategoriesPage;
