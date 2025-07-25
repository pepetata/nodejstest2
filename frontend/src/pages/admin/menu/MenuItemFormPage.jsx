import React, { useState, useEffect } from 'react';
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
    display_order: 0,
    category_ids: [],
  });

  const [translations, setTranslations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isEditing = !!id;
  const isSubdomain =
    !restaurantSlug &&
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname.includes('.localhost');

  const basePath = isSubdomain ? '' : `/${restaurantSlug}`;

  useEffect(() => {
    fetchInitialData();
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

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

  const fetchInitialData = async () => {
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
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurant.id}/menu-categories`, {
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
  };

  const fetchLanguages = async () => {
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
  };

  const fetchMenuItem = async () => {
    try {
      const response = await fetch(`/api/menu-items/${id}`, {
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
          display_order: item.display_order || 0,
          category_ids: item.categories?.map((cat) => cat.id) || [],
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
  };

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

  const handleCategoryChange = (categoryId, isChecked) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: isChecked
        ? [...prev.category_ids, categoryId]
        : prev.category_ids.filter((id) => id !== categoryId),
    }));
    setHasUnsavedChanges(true);
  };

  const validateForm = () => {
    // Check base price
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      setError('Preço base é obrigatório e deve ser maior que zero');
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

      const url = isEditing ? `/api/menu-items/${id}` : '/api/menu-items';
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
            display_order: 0,
            category_ids: [],
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
                </div>

                <div className="form-row">
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

                  <div className="form-group">
                    <label htmlFor="display_order">Ordem de Exibição</label>
                    <input
                      type="number"
                      id="display_order"
                      name="display_order"
                      value={formData.display_order}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div className="form-group">
                    <label>Categorias</label>
                    <div className="checkbox-grid">
                      {categories.map((category) => (
                        <div key={category.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            id={`category-${category.id}`}
                            checked={formData.category_ids.includes(category.id)}
                            onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                          />
                          <label htmlFor={`category-${category.id}`}>{category.name}</label>
                        </div>
                      ))}
                    </div>
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
