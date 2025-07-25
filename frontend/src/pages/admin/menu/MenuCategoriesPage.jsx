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
  FaPause,
  FaPlay,
  FaSort,
  FaArrowUp,
  FaArrowDown,
} from 'react-icons/fa';
import '../../../styles/admin/menu/adminCategoriesPage.scss';

const MenuCategoriesPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [restaurantLanguages, setRestaurantLanguages] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showOrderManagement, setShowOrderManagement] = useState(false);
  const [orderCategories, setOrderCategories] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [showOrderCancelConfirm, setShowOrderCancelConfirm] = useState(false);
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

        // Set default selected language to first restaurant language
        if (languages.length > 0 && !selectedLanguage) {
          setSelectedLanguage(languages[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching languages:', err);
    }
  }, [token, user, selectedLanguage]);

  // Helper function to get translation by language ID
  const getTranslation = (translations, languageId) => {
    if (!translations || !Array.isArray(translations)) return null;
    return translations.find((t) => t.language_id === languageId);
  };

  // Helper function to get translation by language for current selected language
  const getTranslationForLanguage = (translations, language) => {
    if (!translations || !Array.isArray(translations) || !language) {
      return getPrimaryTranslation(translations);
    }

    // Find translation for selected language
    const translation = translations.find((t) => t.language_id === language.id);
    if (translation && translation.name) {
      return translation;
    }

    // Fallback to primary translation
    return getPrimaryTranslation(translations);
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
  const transformFormData = (data, isUpdate = false, existingCategory = null) => {
    console.log('=== TRANSFORM FORM DATA DEBUG ===');
    console.log('isUpdate:', isUpdate);
    console.log('data:', data);
    console.log('existingCategory:', existingCategory);

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
      .map(([languageCode, translation]) => {
        console.log(`Processing language ${languageCode}:`, translation);

        const translationData = {
          language_id: languageMap[languageCode],
          name: translation.name.trim(),
          description: translation.description?.trim() || null,
        };

        // If updating, include the existing translation ID if it exists
        if (isUpdate && existingCategory && existingCategory.translations) {
          const existingTranslation = existingCategory.translations.find(
            (t) => t.language_id === languageMap[languageCode]
          );
          console.log(`Found existing translation for ${languageCode}:`, existingTranslation);
          if (existingTranslation) {
            translationData.id = existingTranslation.id;
          }
        }

        console.log(`Final translation data for ${languageCode}:`, translationData);
        return translationData;
      })
      // For updates: include all translations (allows clearing/updating any language)
      // For creates: only include translations with names
      .filter((translation) => {
        if (isUpdate) {
          // For updates, include all translations that either have content OR had existing content
          const shouldInclude =
            translation.name ||
            (existingCategory &&
              existingCategory.translations &&
              existingCategory.translations.some((t) => t.language_id === translation.language_id));
          console.log(
            `Should include translation for language_id ${translation.language_id}:`,
            shouldInclude
          );
          return shouldInclude;
        } else {
          // For creates, only include translations with names
          return translation.name;
        }
      });

    console.log('transformFormData - final translations:', translations);

    const result = {
      ...data,
      translations,
      // Convert display_order to integer
      display_order: parseInt(data.display_order) || 0,
      // Convert boolean to status
      status: data.is_active ? 'active' : 'inactive',
      // Remove is_active as we're using status instead
      is_active: undefined,
    };

    console.log('=== FINAL TRANSFORM RESULT ===', result);
    return result;
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
      const transformedData = transformFormData(formData, false, null);
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
      console.log('=== UPDATE CATEGORY DEBUG ===');
      console.log('editingCategory:', editingCategory);
      console.log('formData:', formData);
      console.log('restaurantLanguages:', restaurantLanguages);

      const transformedData = transformFormData(formData, true, editingCategory);
      console.log('handleUpdateCategory - submitting data:', transformedData);
      console.log(
        'translations being sent:',
        JSON.stringify(transformedData.translations, null, 2)
      );

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
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    setShowDeleteConfirm(categoryId);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      const response = await fetch(`/api/v1/menu/categories/${showDeleteConfirm}`, {
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
      setShowDeleteConfirm(null);
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
    // First separate parent categories and subcategories
    const parentCategories = categories.filter((cat) => !cat.parent_category_id);
    const subcategories = categories.filter((cat) => cat.parent_category_id);

    // Create a hierarchical structure
    const hierarchicalCategories = [];

    // Sort parent categories
    const sortedParents = [...parentCategories].sort((a, b) => {
      let aValue, bValue;

      if (sortBy === 'name') {
        aValue = getTranslationForLanguage(a.translations, selectedLanguage)?.name || '';
        bValue = getTranslationForLanguage(b.translations, selectedLanguage)?.name || '';
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

    // For each parent category, add it and its sorted subcategories
    sortedParents.forEach((parent) => {
      hierarchicalCategories.push(parent);

      // Find and sort subcategories for this parent
      const parentSubcategories = subcategories.filter(
        (sub) => sub.parent_category_id === parent.id
      );
      const sortedSubcategories = [...parentSubcategories].sort((a, b) => {
        let aValue, bValue;

        if (sortBy === 'name') {
          aValue = getTranslationForLanguage(a.translations, selectedLanguage)?.name || '';
          bValue = getTranslationForLanguage(b.translations, selectedLanguage)?.name || '';
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

      // Add sorted subcategories after their parent
      hierarchicalCategories.push(...sortedSubcategories);
    });

    // Add any orphaned subcategories (subcategories without parent) at the end
    const orphanedSubcategories = subcategories.filter(
      (sub) => !parentCategories.find((parent) => parent.id === sub.parent_category_id)
    );

    if (orphanedSubcategories.length > 0) {
      const sortedOrphaned = [...orphanedSubcategories].sort((a, b) => {
        let aValue, bValue;

        if (sortBy === 'name') {
          aValue = getTranslationForLanguage(a.translations, selectedLanguage)?.name || '';
          bValue = getTranslationForLanguage(b.translations, selectedLanguage)?.name || '';
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

      hierarchicalCategories.push(...sortedOrphaned);
    }

    return hierarchicalCategories;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Order Management Functions
  const openOrderManagement = () => {
    // Prepare categories in hierarchical order for order management
    const defaultLanguage =
      restaurantLanguages.find((lang) => lang.is_default) || restaurantLanguages[0];
    const orderedCategories = buildOrderHierarchy(defaultLanguage?.language_id);
    setOrderCategories(orderedCategories);
    setShowOrderManagement(true);
  };

  const buildOrderHierarchy = (languageId) => {
    // Get all categories sorted by display_order
    const allCategories = [...categories].sort((a, b) => a.display_order - b.display_order);

    // Separate parent categories and subcategories
    const parentCategories = allCategories.filter((cat) => !cat.parent_category_id);
    const subcategories = allCategories.filter((cat) => cat.parent_category_id);

    const hierarchy = [];

    parentCategories.forEach((parent) => {
      // Add parent category
      const parentTranslation =
        parent.translations.find((t) => t.language_id === languageId) || parent.translations[0];
      hierarchy.push({
        id: parent.id,
        name: parentTranslation?.name || 'Sem nome',
        display_order: parent.display_order,
        parent_category_id: null,
        level: 0,
        type: 'parent',
      });

      // Add its subcategories
      const parentSubs = subcategories
        .filter((sub) => sub.parent_category_id === parent.id)
        .sort((a, b) => a.display_order - b.display_order);

      parentSubs.forEach((sub) => {
        const subTranslation =
          sub.translations.find((t) => t.language_id === languageId) || sub.translations[0];
        hierarchy.push({
          id: sub.id,
          name: subTranslation?.name || 'Sem nome',
          display_order: sub.display_order,
          parent_category_id: sub.parent_category_id,
          level: 1,
          type: 'subcategory',
        });
      });
    });

    return hierarchy;
  };

  const moveCategory = (categoryId, direction) => {
    const newOrder = [...orderCategories];
    const currentIndex = newOrder.findIndex((cat) => cat.id === categoryId);
    const currentCategory = newOrder[currentIndex];

    if (currentIndex === -1) return;

    if (currentCategory.type === 'parent') {
      // For parent categories, we need to move the entire group (parent + subcategories)
      const parentId = currentCategory.id;

      // Find all items that belong to this parent group
      const groupStartIndex = currentIndex;
      let groupEndIndex = currentIndex;

      // Find the end of this parent's group (include all its subcategories)
      for (let i = currentIndex + 1; i < newOrder.length; i++) {
        if (newOrder[i].type === 'subcategory' && newOrder[i].parent_category_id === parentId) {
          groupEndIndex = i;
        } else if (newOrder[i].type === 'parent') {
          break; // We've reached the next parent category
        }
      }

      // Extract the entire group
      const groupItems = newOrder.slice(groupStartIndex, groupEndIndex + 1);

      // Remove the group from its current position
      const newOrderWithoutGroup = [
        ...newOrder.slice(0, groupStartIndex),
        ...newOrder.slice(groupEndIndex + 1),
      ];

      let insertPosition = -1;

      if (direction === 'up') {
        // Find the previous parent category group in the new array
        for (let i = groupStartIndex - 1; i >= 0; i--) {
          if (newOrder[i].type === 'parent') {
            // Find this parent in the new array without the moved group
            const targetParentId = newOrder[i].id;
            for (let j = 0; j < newOrderWithoutGroup.length; j++) {
              if (
                newOrderWithoutGroup[j].id === targetParentId &&
                newOrderWithoutGroup[j].type === 'parent'
              ) {
                insertPosition = j;
                break;
              }
            }
            break;
          }
        }

        // If no previous parent found, insert at the beginning
        if (insertPosition === -1) {
          insertPosition = 0;
        }
      } else {
        // Find the next parent category group in the new array
        for (let i = groupStartIndex + 1; i < newOrder.length; i++) {
          if (newOrder[i].type === 'parent') {
            // Find this parent in the new array and move after its group
            const targetParentId = newOrder[i].id;
            let targetParentIndex = -1;

            for (let j = 0; j < newOrderWithoutGroup.length; j++) {
              if (
                newOrderWithoutGroup[j].id === targetParentId &&
                newOrderWithoutGroup[j].type === 'parent'
              ) {
                targetParentIndex = j;
                break;
              }
            }

            if (targetParentIndex !== -1) {
              // Find the end of this parent's group
              let targetGroupEnd = targetParentIndex;
              for (let k = targetParentIndex + 1; k < newOrderWithoutGroup.length; k++) {
                if (
                  newOrderWithoutGroup[k].type === 'subcategory' &&
                  newOrderWithoutGroup[k].parent_category_id === targetParentId
                ) {
                  targetGroupEnd = k;
                } else if (newOrderWithoutGroup[k].type === 'parent') {
                  break;
                }
              }
              insertPosition = targetGroupEnd + 1;
            }
            break;
          }
        }

        // If no next parent found, insert at the end
        if (insertPosition === -1) {
          insertPosition = newOrderWithoutGroup.length;
        }
      }

      // Insert the group at the target position
      const finalOrder = [
        ...newOrderWithoutGroup.slice(0, insertPosition),
        ...groupItems,
        ...newOrderWithoutGroup.slice(insertPosition),
      ];

      setOrderCategories(finalOrder);
    } else {
      // For subcategories, move only within the same parent (existing logic)
      const parentId = currentCategory.parent_category_id;

      let targetIndex;

      if (direction === 'up') {
        // Find previous subcategory within same parent
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (newOrder[i].parent_category_id === parentId && newOrder[i].type === 'subcategory') {
            targetIndex = i;
            break;
          }
        }
      } else {
        // Find next subcategory within same parent
        for (let i = currentIndex + 1; i < newOrder.length; i++) {
          if (newOrder[i].parent_category_id === parentId && newOrder[i].type === 'subcategory') {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex !== undefined) {
        // Swap positions
        [newOrder[currentIndex], newOrder[targetIndex]] = [
          newOrder[targetIndex],
          newOrder[currentIndex],
        ];
        setOrderCategories(newOrder);
      }
    }
  };

  const saveOrder = async () => {
    setOrderLoading(true);
    try {
      // Prepare order updates - assign new display_order values starting from 1
      const categoryUpdates = [];
      let parentOrder = 1;
      const subcategoryOrders = {};

      orderCategories.forEach((category) => {
        if (category.type === 'parent') {
          categoryUpdates.push({
            id: category.id,
            display_order: parentOrder,
          });
          subcategoryOrders[category.id] = 1; // Initialize subcategory counter for this parent
          parentOrder++;
        } else {
          const parentId = category.parent_category_id;
          categoryUpdates.push({
            id: category.id,
            display_order: subcategoryOrders[parentId],
          });
          subcategoryOrders[parentId]++; // Increment for next subcategory
        }
      });

      // Send to backend - use the correct API path and format
      const response = await fetch('/api/v1/menu/categories/display-order', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categories: categoryUpdates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar ordem das categorias');
      }

      // Refresh categories and close modal
      await loadCategories();
      setShowOrderManagement(false);
    } catch (err) {
      console.error('Error saving category order:', err);
      setError(err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleOrderCancel = () => {
    // Check if order has been modified
    const hasChanges =
      JSON.stringify(orderCategories) !==
      JSON.stringify(
        buildOrderHierarchy(selectedLanguage?.language_id || restaurantLanguages[0]?.language_id)
      );

    if (hasChanges) {
      setShowOrderCancelConfirm(true);
    } else {
      setShowOrderManagement(false);
    }
  };

  const confirmOrderCancel = () => {
    setShowOrderCancelConfirm(false);
    setShowOrderManagement(false);
    // Reset to original order
    const defaultLanguage =
      restaurantLanguages.find((lang) => lang.is_default) || restaurantLanguages[0];
    const orderedCategories = buildOrderHierarchy(defaultLanguage?.language_id);
    setOrderCategories(orderedCategories);
  };

  const resetForm = () => {
    // Initialize translations based on restaurant languages
    const initialTranslations = {};
    restaurantLanguages.forEach((lang) => {
      const languageCode = lang.language_code || lang.code;
      initialTranslations[languageCode] = { name: '', description: '' };
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
      const languageCode = lang.language_code || lang.code;

      // Find the translation for this language from the category's translations array
      const existingTranslation = category.translations?.find((t) => t.language_id === lang.id);

      editTranslations[languageCode] = {
        name: existingTranslation?.name || '',
        description: existingTranslation?.description || '',
      };
    });

    setFormData({
      translations: editTranslations,
      parent_category_id: category.parent_category_id,
      display_order: category.display_order,
      is_active: category.status === 'active',
    });

    setShowCreateForm(true); // Show the form modal
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
    <div className="admin-categories-page" style={{ padding: '20px' }}>
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
          <div className="page-actions">
            <button
              onClick={openOrderManagement}
              className="btn btn-secondary"
              disabled={loading || categories.length === 0}
              title="Gerenciar ordem das categorias"
            >
              <FaSort />
              Gerenciar Ordem
            </button>
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
                            onClick={() => {
                              setSelectedLanguage(language);
                              setShowLanguageDropdown(false);
                            }}
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

              {/* Sort Controls */}
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
                  <div className="table-cell order-cell">ORDEM</div>
                  <div className="table-cell status-cell">STATUS</div>
                  <div className="table-cell actions-cell">AÇÕES</div>
                </div>
              </div>

              <div className="table-body">
                {getSortedCategories().map((category) => (
                  <div
                    key={category.id}
                    className={`table-row ${category.parent_category_id ? 'subcategory-row' : ''}`}
                  >
                    <div className="table-cell name-cell">
                      <strong>
                        {category.parent_category_id && (
                          <span className="subcategory-indicator">└─ </span>
                        )}
                        {getTranslationForLanguage(category.translations, selectedLanguage)?.name ||
                          'Sem nome'}
                      </strong>
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
                          className="btn btn-sm btn-outline-info"
                          onClick={() => setViewingCategory(category)}
                          title="Ver detalhes da categoria"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEdit(category)}
                          title="Editar categoria"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className={`btn btn-sm ${
                            category.status === 'active'
                              ? 'btn-outline-warning'
                              : 'btn-outline-success'
                          }`}
                          onClick={() => handleToggleStatus(category.id, category.status)}
                          title={
                            category.status === 'active'
                              ? 'Desativar categoria'
                              : 'Ativar categoria'
                          }
                        >
                          {category.status === 'active' ? <FaPause /> : <FaPlay />}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteCategory(category.id)}
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
                  onClick={() => setShowCancelConfirm(true)}
                  className="btn btn-cancel"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Category Details Modal */}
      {viewingCategory && (
        <div className="form-modal">
          <div className="form-container view-container">
            <div className="form-header">
              <h3>Detalhes da Categoria</h3>
              <button onClick={() => setViewingCategory(null)} className="btn-close">
                <FaTimes />
              </button>
            </div>

            <div className="view-content">
              {/* Basic Information */}
              <div className="view-section">
                <h4>Informações Básicas</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Status:</label>
                    <span
                      className={`status-badge ${viewingCategory.status === 'active' ? 'active' : 'inactive'}`}
                    >
                      {viewingCategory.status === 'active' ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Ordem de Exibição:</label>
                    <span className="order-badge">{viewingCategory.display_order}</span>
                  </div>
                  {viewingCategory.parent_category_id && (
                    <div className="info-item">
                      <label>Categoria Pai:</label>
                      <span className="parent-category">
                        {getTranslationForLanguage(
                          categories.find((c) => c.id === viewingCategory.parent_category_id)
                            ?.translations,
                          restaurantLanguages.find((lang) => lang.is_default) ||
                            restaurantLanguages[0]
                        )?.name || 'Categoria pai não encontrada'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Language Translations */}
              <div className="view-section">
                <h4>Traduções por Idioma</h4>
                <div className="translations-grid">
                  {restaurantLanguages.map((lang) => {
                    const translation = getTranslationForLanguage(
                      viewingCategory.translations,
                      lang
                    );
                    return (
                      <div key={lang.id} className="translation-card">
                        <div className="language-header">
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
                          {lang.is_default && <span className="default-badge">Padrão</span>}
                        </div>
                        <div className="translation-content">
                          <div className="translation-item">
                            <label>Nome:</label>
                            <span>{translation?.name || 'Não traduzido'}</span>
                          </div>
                          <div className="translation-item">
                            <label>Descrição:</label>
                            <span>{translation?.description || 'Não informado'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                onClick={() => {
                  setViewingCategory(null);
                  handleEdit(viewingCategory);
                }}
                className="btn btn-primary"
              >
                <FaEdit /> Editar Categoria
              </button>
              <button onClick={() => setViewingCategory(null)} className="btn btn-secondary">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="confirmation-modal">
          <div className="confirmation-container">
            <div className="confirmation-header">
              <h4>Confirmar Cancelamento</h4>
            </div>
            <div className="confirmation-content">
              <p>Tem certeza que deseja cancelar? Todos os dados inseridos serão perdidos.</p>
            </div>
            <div className="confirmation-actions">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCategory(null);
                  setShowCancelConfirm(false);
                  resetForm();
                }}
                className="btn btn-danger"
              >
                Sim, Cancelar
              </button>
              <button onClick={() => setShowCancelConfirm(false)} className="btn btn-secondary">
                Não, Continuar Editando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="confirmation-modal">
          <div className="confirmation-container">
            <div className="confirmation-header">
              <h4>Confirmar Exclusão</h4>
            </div>
            <div className="confirmation-content">
              <p>Tem certeza que deseja excluir esta categoria?</p>
              <p className="warning-text">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="confirmation-actions">
              <button onClick={confirmDelete} className="btn btn-danger">
                Sim, Excluir
              </button>
              <button onClick={() => setShowDeleteConfirm(null)} className="btn btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Management Modal */}
      {showOrderManagement && (
        <div className="form-modal">
          <div className="form-container">
            <div className="form-header">
              <h3>Gerenciar Ordem das Categorias</h3>
              <button
                onClick={() => setShowOrderManagement(false)}
                className="btn-close"
                type="button"
              >
                <FaTimes />
              </button>
            </div>

            <div className="form-content">
              <p className="order-instructions">
                Use as setas para reordenar as categorias. Subcategorias só podem ser movidas dentro
                de sua categoria pai.
              </p>

              <div className="order-list">
                {orderCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className={`order-item ${category.type === 'subcategory' ? 'subcategory' : 'parent'}`}
                  >
                    <div className="category-info">
                      <span className="category-name">
                        {category.type === 'subcategory' && '└── '}
                        {category.name}
                      </span>
                    </div>

                    <div className="order-actions">
                      <button
                        onClick={() => moveCategory(category.id, 'up')}
                        disabled={
                          orderLoading ||
                          (category.type === 'parent' &&
                            // For parent categories, disable if there's no previous parent category
                            !orderCategories
                              .slice(0, index)
                              .some((cat) => cat.type === 'parent')) ||
                          (category.type === 'subcategory' &&
                            (index === 0 ||
                              orderCategories[index - 1].type === 'parent' ||
                              orderCategories[index - 1].parent_category_id !==
                                category.parent_category_id))
                        }
                        className="btn btn-sm btn-outline"
                        title="Mover para cima"
                      >
                        <FaArrowUp />
                      </button>

                      <button
                        onClick={() => moveCategory(category.id, 'down')}
                        disabled={
                          orderLoading ||
                          (category.type === 'parent' &&
                            // For parent categories, disable if there's no next parent category
                            !orderCategories
                              .slice(index + 1)
                              .some((cat) => cat.type === 'parent')) ||
                          (category.type === 'subcategory' &&
                            (index === orderCategories.length - 1 ||
                              orderCategories[index + 1].type === 'parent' ||
                              orderCategories[index + 1].parent_category_id !==
                                category.parent_category_id))
                        }
                        className="btn btn-sm btn-outline"
                        title="Mover para baixo"
                      >
                        <FaArrowDown />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button onClick={saveOrder} disabled={orderLoading} className="btn btn-primary">
                {orderLoading ? 'Salvando...' : 'Salvar Ordem'}
              </button>
              <button
                onClick={handleOrderCancel}
                disabled={orderLoading}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showOrderCancelConfirm && (
        <div className="form-modal">
          <div className="form-container confirmation-container">
            <div className="form-header">
              <h3>Confirmar Cancelamento</h3>
            </div>

            <div className="form-content">
              <p>
                Você tem alterações não salvas na ordem das categorias. Se continuar, essas
                alterações serão perdidas.
              </p>
              <p>Deseja realmente cancelar?</p>
            </div>

            <div className="form-actions">
              <button onClick={confirmOrderCancel} className="btn btn-danger">
                Sim, Cancelar
              </button>
              <button
                onClick={() => setShowOrderCancelConfirm(false)}
                className="btn btn-secondary"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCategoriesPage;
