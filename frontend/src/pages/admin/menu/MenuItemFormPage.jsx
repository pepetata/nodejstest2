import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSave, FaPlus, FaTimes, FaUtensils } from 'react-icons/fa';
import '../../../styles/admin/menu/menuItemForm.scss';

const MenuItemFormPage = () => {
  const { restaurantSlug, id } = useParams();
  const navigate = useNavigate();
  const { restaurant, token } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    sku: '',
    base_price: '',
    preparation_time_minutes: '',
    is_available: true,
    is_featured: false,
    categories: [], // Changed from category_ids to categories with display_order
  });

  const [translations, setTranslations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // New state for category selection
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [newCategoryOrder, setNewCategoryOrder] = useState(1);

  const isEditing = !!id;
  const isSubdomain =
    !restaurantSlug &&
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname.includes('.localhost');

  const basePath = isSubdomain ? '' : `/${restaurantSlug}`;

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/menu/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Categories API response:', data);
        console.log('Categories count:', data.data?.length || 0);
        console.log('First category structure:', data.data?.[0]);
        setCategories(data.data || []);
      } else {
        console.error('Categories API failed:', response.status, response.statusText);
      }
    } catch (fetchError) {
      console.error('Error fetching categories:', fetchError);
    }
  }, [token]);

  const fetchLanguages = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/restaurants/${restaurant.id}/languages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const languageData = data.data || [];
        setLanguages(languageData);

        // Initialize translations for all languages
        if (!isEditing) {
          const initialTranslations = languageData.map((lang) => ({
            language_code: lang.code,
            name: '',
            description: '',
            ingredients: '',
            preparation_method: '',
          }));
          setTranslations(initialTranslations);
        }
      }
    } catch (fetchError) {
      console.error('Error fetching languages:', fetchError);
    }
  }, [token, restaurant.id, isEditing]);

  const fetchMenuItem = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/menu-items/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const item = data.data;

        setFormData({
          sku: item.sku || '',
          base_price: item.base_price || '',
          preparation_time_minutes: item.preparation_time_minutes || '',
          is_available: item.is_available,
          is_featured: item.is_featured || false,
          categories:
            item.categories?.map((cat) => ({
              category_id: cat.id,
              display_order: cat.display_order || 0,
            })) || [],
        });

        setTranslations(item.translations || []);
      } else {
        setError('Item não encontrado');
        navigate(`${basePath}/admin/menu/items`);
      }
    } catch (fetchError) {
      console.error('Error fetching menu item:', fetchError);
      setError('Erro ao carregar item do cardápio');
    }
  }, [id, token, navigate, basePath]);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCategories(),
        fetchLanguages(),
        isEditing ? fetchMenuItem() : Promise.resolve(),
      ]);
    } catch (fetchError) {
      console.error('Error fetching initial data:', fetchError);
      setError('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  }, [isEditing, fetchCategories, fetchLanguages, fetchMenuItem]);

  useEffect(() => {
    fetchInitialData();
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [fetchInitialData]);

  useEffect(() => {
    // Warning when leaving page with unsaved changes
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setHasUnsavedChanges(true);
  };

  const handleTranslationChange = (languageCode, field, value) => {
    setTranslations((prev) =>
      prev.map((translation) =>
        translation.language_code === languageCode
          ? { ...translation, [field]: value }
          : translation
      )
    );
    setHasUnsavedChanges(true);
  };

  // New category selection functions
  const getCategoryName = (category) => {
    // Get the first available translation name, prioritizing Portuguese (language_id: 1)
    if (category.translations && category.translations.length > 0) {
      const ptTranslation = category.translations.find((t) => t.language_id === 1);
      if (ptTranslation && ptTranslation.name) {
        return ptTranslation.name;
      }
      // Fallback to first available translation
      return category.translations[0].name || 'Categoria sem nome';
    }
    return category.display_name || 'Categoria sem nome';
  };

  const getAvailableCategories = () => {
    const selectedCategoryIds = formData.categories.map((cat) => cat.category_id);
    return categories.filter((cat) => !selectedCategoryIds.includes(cat.id));
  };

  const addCategory = () => {
    if (!selectedCategoryId) return;

    const categoryToAdd = {
      category_id: parseInt(selectedCategoryId),
      display_order: newCategoryOrder,
    };

    setFormData((prev) => ({
      ...prev,
      categories: [...prev.categories, categoryToAdd],
    }));

    setSelectedCategoryId('');
    setNewCategoryOrder(1);
    setHasUnsavedChanges(true);
  };

  const removeCategory = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat.category_id !== categoryId),
    }));
    setHasUnsavedChanges(true);
  };

  const updateCategoryOrder = (categoryId, newOrder) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) =>
        cat.category_id === categoryId ? { ...cat, display_order: parseInt(newOrder) || 0 } : cat
      ),
    }));
    setHasUnsavedChanges(true);
  };

  const validateForm = () => {
    // Check base price
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      setError('Preço base é obrigatório e deve ser maior que zero');
      return false;
    }

    // Check categories - at least one required
    if (!formData.categories || formData.categories.length === 0) {
      setError('Pelo menos uma categoria é obrigatória');
      return false;
    }

    // Check translations
    const validTranslations = translations.filter((t) => t.name.trim() && t.description.trim());
    if (validTranslations.length === 0) {
      setError('Pelo menos uma tradução completa (nome e descrição) é obrigatória');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e, saveAndCreateAnother = false) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const url = isEditing ? `/api/v1/menu-items/${id}` : '/api/v1/menu-items';
      const method = isEditing ? 'PUT' : 'POST';

      // Filter out empty translations
      const validTranslations = translations.filter((t) => t.name.trim() && t.description.trim());

      const requestData = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        preparation_time_minutes: formData.preparation_time_minutes
          ? parseInt(formData.preparation_time_minutes)
          : null,
        translations: validTranslations,
      };

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);

        if (saveAndCreateAnother) {
          // Reset form for new item
          setFormData({
            sku: '',
            base_price: '',
            preparation_time_minutes: '',
            is_available: true,
            is_featured: false,
            categories: [],
          });

          // Reset translations
          const initialTranslations = languages.map((lang) => ({
            language_code: lang.code,
            name: '',
            description: '',
            ingredients: '',
            preparation_method: '',
          }));
          setTranslations(initialTranslations);

          setActiveTab('general');
          window.scrollTo(0, 0);
        } else {
          navigate(`${basePath}/admin/menu/items`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao salvar item do cardápio');
      }
    } catch (submitError) {
      console.error('Error saving menu item:', submitError);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'Você tem alterações não salvas. Tem certeza que deseja sair sem salvar?'
      );
      if (!confirmLeave) return;
    }
    navigate(`${basePath}/admin/menu/items`);
  };

  if (loading && isEditing) {
    return (
      <div className="menu-item-form-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando item do cardápio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-item-form-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="page-title-section">
            <h1 className="page-title">
              <FaUtensils />
              {isEditing ? 'Editar Item do Cardápio' : 'Novo Item do Cardápio'}
            </h1>
            <p className="page-subtitle">
              {isEditing
                ? 'Edite as informações do item do cardápio'
                : 'Adicione um novo item ao cardápio do seu restaurante'}
            </p>
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

      {/* Form Container */}
      <div className="form-container">
        <form onSubmit={(e) => handleSubmit(e, false)} className="menu-item-form">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              Informações Gerais
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'translations' ? 'active' : ''}`}
              onClick={() => setActiveTab('translations')}
            >
              Traduções
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'media' ? 'active' : ''} disabled`}
              disabled
            >
              Mídia (Em breve)
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'dietary' ? 'active' : ''} disabled`}
              disabled
            >
              Dietas & Alérgenos (Em breve)
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'nutrition' ? 'active' : ''} disabled`}
              disabled
            >
              Informações Nutricionais (Em breve)
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'promotions' ? 'active' : ''} disabled`}
              disabled
            >
              Promoções & Agendamento (Em breve)
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* General Information Tab */}
            {activeTab === 'general' && (
              <div className="tab-panel">
                <h3>Informações Gerais</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sku">SKU (Código)</label>
                    <input
                      type="text"
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="Código interno do produto (opcional)"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="base_price">Preço Base *</label>
                    <input
                      type="number"
                      id="base_price"
                      name="base_price"
                      value={formData.base_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="preparation_time_minutes">Tempo de Preparo (minutos)</label>
                    <input
                      type="number"
                      id="preparation_time_minutes"
                      name="preparation_time_minutes"
                      value={formData.preparation_time_minutes}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="Tempo em minutos (opcional)"
                    />
                  </div>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div className="form-group">
                    <label htmlFor="category-selector">Categorias e Ordem de Exibição *</label>

                    {/* Category Selector */}
                    <div className="category-selector">
                      <div className="selector-row">
                        <select
                          id="category-selector"
                          value={selectedCategoryId}
                          onChange={(e) => setSelectedCategoryId(e.target.value)}
                          className="category-dropdown"
                        >
                          <option value="">Selecione uma categoria para adicionar...</option>
                          {getAvailableCategories().map((category) => (
                            <option key={category.id} value={category.id}>
                              {getCategoryName(category)}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          value={newCategoryOrder}
                          onChange={(e) => setNewCategoryOrder(parseInt(e.target.value) || 1)}
                          min="1"
                          placeholder="Ordem"
                          className="order-input"
                        />

                        <button
                          type="button"
                          onClick={addCategory}
                          disabled={!selectedCategoryId}
                          className="add-category-btn"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>

                    {/* Selected Categories List */}
                    {formData.categories.length > 0 && (
                      <div className="selected-categories">
                        <h4>Categorias Selecionadas:</h4>
                        <div className="selected-categories-list">
                          {formData.categories.map((selectedCat) => {
                            const category = categories.find(
                              (cat) => cat.id === selectedCat.category_id
                            );
                            return (
                              <div key={selectedCat.category_id} className="selected-category-item">
                                <span className="category-name">
                                  {category
                                    ? getCategoryName(category)
                                    : 'Categoria não encontrada'}
                                </span>
                                <div className="category-controls">
                                  <label htmlFor={`order-${selectedCat.category_id}`}>Ordem:</label>
                                  <input
                                    type="number"
                                    id={`order-${selectedCat.category_id}`}
                                    value={selectedCat.display_order}
                                    onChange={(e) =>
                                      updateCategoryOrder(selectedCat.category_id, e.target.value)
                                    }
                                    min="0"
                                    className="order-input-small"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeCategory(selectedCat.category_id)}
                                    className="remove-category-btn"
                                    title="Remover categoria"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {formData.categories.length === 0 && (
                      <p className="category-hint">
                        Selecione pelo menos uma categoria para este item.
                      </p>
                    )}
                  </div>
                )}

                {/* Status Options */}
                <div className="form-row">
                  <div className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="is_available"
                        name="is_available"
                        checked={formData.is_available}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="is_available">Item disponível</label>
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="is_featured"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="is_featured">Item em destaque</label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Translations Tab */}
            {activeTab === 'translations' && (
              <div className="tab-panel">
                <h3>Traduções</h3>
                <p className="tab-description">
                  Complete as informações do item para cada idioma configurado no restaurante.
                </p>

                {languages.length === 0 ? (
                  <div className="no-languages">
                    <p>Nenhum idioma configurado. Configure os idiomas do restaurante primeiro.</p>
                    <Link to={`${basePath}/admin/menu/translations`} className="btn btn-primary">
                      Configurar Idiomas
                    </Link>
                  </div>
                ) : (
                  <div className="translations-container">
                    {languages.map((language) => {
                      const translation = translations.find(
                        (t) => t.language_code === language.code
                      ) || {
                        language_code: language.code,
                        name: '',
                        description: '',
                        ingredients: '',
                        preparation_method: '',
                      };

                      return (
                        <div key={language.code} className="language-section">
                          <h5 className="language-header">
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
                            <span className="language-names">
                              <span className="language-native">{language.native_name}</span>
                              {language.language_name &&
                                language.language_name !== language.native_name && (
                                  <span className="language-name"> ({language.language_name})</span>
                                )}
                            </span>
                          </h5>

                          <div className="translation-fields">
                            <div className="form-row">
                              <div className="form-group">
                                <label>Nome *</label>
                                <input
                                  type="text"
                                  value={translation.name}
                                  onChange={(e) =>
                                    handleTranslationChange(language.code, 'name', e.target.value)
                                  }
                                  placeholder="Nome do item"
                                  required={language.code === 'pt-BR'}
                                />
                              </div>

                              <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                  value={translation.description}
                                  onChange={(e) =>
                                    handleTranslationChange(
                                      language.code,
                                      'description',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Descrição do item"
                                  rows={3}
                                />
                              </div>
                            </div>

                            <div className="form-row">
                              <div className="form-group">
                                <label>Ingredientes</label>
                                <textarea
                                  value={translation.ingredients}
                                  onChange={(e) =>
                                    handleTranslationChange(
                                      language.code,
                                      'ingredients',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Lista de ingredientes (opcional)"
                                  rows={2}
                                />
                              </div>

                              <div className="form-group">
                                <label>Método de Preparo</label>
                                <textarea
                                  value={translation.preparation_method}
                                  onChange={(e) =>
                                    handleTranslationChange(
                                      language.code,
                                      'preparation_method',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Como o item é preparado (opcional)"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Placeholder tabs */}
            {(activeTab === 'media' ||
              activeTab === 'dietary' ||
              activeTab === 'nutrition' ||
              activeTab === 'promotions') && (
              <div className="tab-panel placeholder">
                <h3>Em Desenvolvimento</h3>
                <p>Esta funcionalidade será implementada em breve.</p>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              <FaTimes />
              Cancelar
            </button>

            {!isEditing && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
              >
                <FaPlus />
                Salvar e Criar Outro
              </button>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              <FaSave />
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuItemFormPage;
