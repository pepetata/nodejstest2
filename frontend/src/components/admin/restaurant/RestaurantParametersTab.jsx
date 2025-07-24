import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import ErrorMessage from '../../common/ErrorMessage';
import SuccessMessage from '../../common/SuccessMessage';
import LoadingSpinner from '../../common/LoadingSpinner';
import '../../../styles/admin/restaurant/restaurantParametersTab.scss';

const RestaurantParametersTab = () => {
  const { restaurant } = useSelector((state) => state.auth);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Languages state
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [restaurantLanguages, setRestaurantLanguages] = useState([]);
  const [languagesLoading, setLanguagesLoading] = useState(true);

  // Sections state
  const [isLanguagesSectionOpen, setIsLanguagesSectionOpen] = useState(true);
  const [isGeneralSectionOpen, setIsGeneralSectionOpen] = useState(false);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [tempLanguages, setTempLanguages] = useState([]);

  // Custom dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    return token;
  };

  // Fetch available languages and restaurant's current languages
  const fetchLanguages = useCallback(async () => {
    try {
      setLanguagesLoading(true);
      setError('');

      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const [availableResponse, restaurantResponse] = await Promise.all([
        fetch('/api/v1/languages/available', { headers }),
        restaurant?.id
          ? fetch(`/api/v1/restaurants/${restaurant.id}/languages`, { headers })
          : Promise.resolve({ ok: true, json: () => ({ success: true, data: [] }) }),
      ]);

      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        console.log('Available languages:', availableData);
        setAvailableLanguages(availableData.data || []);
      } else {
        throw new Error('Erro ao carregar idiomas disponíveis');
      }

      if (restaurantResponse.ok) {
        const restaurantData = await restaurantResponse.json();
        console.log('Restaurant languages:', restaurantData);
        setRestaurantLanguages(restaurantData.data || []);
        setTempLanguages(restaurantData.data || []);
      } else {
        // If no languages are configured yet, that's OK
        setRestaurantLanguages([]);
        setTempLanguages([]);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      setError(error.message || 'Erro ao carregar idiomas');
    } finally {
      setLanguagesLoading(false);
    }
  }, [restaurant?.id]);

  useEffect(() => {
    if (restaurant?.id) {
      fetchLanguages();
    }
  }, [fetchLanguages, restaurant?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.custom-language-select')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const startEditing = () => {
    setIsEditing(true);
    setTempLanguages([...restaurantLanguages]);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setTempLanguages([...restaurantLanguages]);
    setError('');
  };

  const addLanguage = (languageId) => {
    const language = availableLanguages.find((lang) => lang.id === parseInt(languageId, 10));
    if (!language) return;

    const newLanguage = {
      language_id: language.id,
      language_code: language.language_code,
      name: language.name,
      native_name: language.native_name,
      flag_file: language.flag_file,
      display_order: language.display_order, // Use original language order value
      is_default: tempLanguages.length === 0, // First language is default
      is_active: true,
    };

    setTempLanguages([...tempLanguages, newLanguage]);
  };

  const removeLanguage = (languageId) => {
    // Prevent removing the last language
    if (tempLanguages.length <= 1) {
      setError(
        'Não é possível remover o último idioma. Pelo menos um idioma deve estar configurado.'
      );
      return;
    }

    const updatedLanguages = tempLanguages.filter((lang) => lang.language_id !== languageId);

    // If we removed the default language, make the first remaining language default
    if (updatedLanguages.length > 0) {
      const hasDefault = updatedLanguages.some((lang) => lang.is_default);
      if (!hasDefault) {
        updatedLanguages[0].is_default = true;
      }
    }

    setTempLanguages(updatedLanguages);
  };

  const setDefaultLanguage = (languageId) => {
    const updatedLanguages = tempLanguages.map((lang) => ({
      ...lang,
      is_default: lang.language_id === languageId,
    }));
    setTempLanguages(updatedLanguages);
  };

  const saveLanguages = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`/api/v1/restaurants/${restaurant.id}/languages`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          languages: tempLanguages.map((lang) => ({
            language_id: lang.language_id,
            languageCode: lang.language_code,
            displayOrder: lang.display_order,
            isDefault: lang.is_default,
            isActive: lang.is_active,
          })),
        }),
      });

      if (response.ok) {
        setRestaurantLanguages([...tempLanguages]);
        setIsEditing(false);
        setSuccessMessage('Idiomas atualizados com sucesso!');

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar idiomas');
      }
    } catch (error) {
      console.error('Error saving languages:', error);
      setError(error.message || 'Erro ao salvar idiomas');
    } finally {
      setLoading(false);
    }
  };

  const getLanguageIconPath = (flagFile) => {
    // Use the flag_file from database directly
    if (flagFile) {
      return `/images/languages/${flagFile}`;
    }

    return null;
  };

  const getLanguageFlagEmoji = (iconFile, languageCode) => {
    // Debug: log the icon_file values we're getting
    console.log('Flag emoji request:', { iconFile, languageCode });

    // First try to get flag based on icon_file from database
    if (iconFile) {
      const iconToFlagMap = {
        'br.svg': '🇧🇷', // Brazil (Portuguese)
        'es.svg': '🇪🇸', // Spain (Spanish)
        'us.svg': '��', // English - Changed to UK flag as requested
        'en.svg': '🇬🇧', // UK (English)
        'fr.svg': '🇫🇷', // France (French)
        'jp.svg': '🇯🇵', // Japan (Japanese)
        'cn.svg': '🇨🇳', // China (Chinese)
        'sa.svg': '🇸🇦', // Saudi Arabia (Arabic)
        'il.svg': '🇮🇱', // Israel (Hebrew) - Added missing mapping
        'he.svg': '🇮🇱', // Israel (Hebrew)
        'tr.svg': '🇹🇷', // Turkey (Turkish)
        'de.svg': '🇩🇪', // Germany (German)
        'it.svg': '🇮🇹', // Italy (Italian)
        'ru.svg': '🇷🇺', // Russia (Russian)
        'kr.svg': '🇰🇷', // Korea (Korean)
        'nl.svg': '🇳🇱', // Netherlands (Dutch)
        'se.svg': '🇸🇪', // Sweden (Swedish) - using SE from database
        'sv.svg': '🇸🇪', // Sweden (Swedish) - fallback for SV
      };

      const flagFromIcon = iconToFlagMap[iconFile];
      if (flagFromIcon) {
        console.log('Found flag from icon_file:', flagFromIcon);
        return flagFromIcon;
      } else {
        console.log('No mapping found for icon_file:', iconFile);
      }
    }

    // Fallback to language code mapping
    const flagMap = {
      'pt-BR': '🇧🇷',
      pt: '🇧🇷', // Portuguese
      'en-US': '🇺🇸',
      en: '🇬🇧', // English - this might be the problem
      'es-ES': '🇪🇸',
      es: '🇪🇸', // Spanish
      'fr-FR': '🇫🇷',
      fr: '🇫🇷', // French
      ja: '🇯🇵', // Japanese
      zh: '🇨🇳', // Chinese
      ar: '🇸🇦', // Arabic
      he: '🇮🇱', // Hebrew
      tr: '🇹🇷', // Turkish
      de: '🇩🇪', // German
      it: '🇮🇹', // Italian
      ru: '🇷🇺', // Russian
      ko: '🇰🇷', // Korean
      nl: '🇳🇱', // Dutch
      sv: '🇸🇪', // Swedish
    };

    const fallbackFlag = flagMap[languageCode] || '🌐';
    console.log('Using fallback flag for', languageCode, ':', fallbackFlag);
    return fallbackFlag;
  };

  const getAvailableLanguagesToAdd = () => {
    const usedLanguageIds = tempLanguages.map((lang) => lang.language_id);
    return availableLanguages.filter((lang) => !usedLanguageIds.includes(lang.id));
  };

  return (
    <div className="restaurant-parameters-tab">
      <div className="tab-header">
        <h2>Parâmetros do Restaurante</h2>
        <p>Configure os parâmetros e configurações avançadas do seu restaurante</p>
      </div>

      {error && <ErrorMessage message={error} />}
      {successMessage && <SuccessMessage message={successMessage} />}

      {/* Languages Section */}
      <div className="parameter-section">
        <button
          className={`section-header ${isLanguagesSectionOpen ? 'expanded' : ''}`}
          onClick={() => setIsLanguagesSectionOpen(!isLanguagesSectionOpen)}
        >
          <div className="section-title">
            <h3>Idiomas do Menu</h3>
            <span className="section-description">
              Configure os idiomas disponíveis no seu menu
            </span>
          </div>
          <span className="section-toggle">{isLanguagesSectionOpen ? '▼' : '▶'}</span>
        </button>

        {isLanguagesSectionOpen && (
          <div className="section-content">
            {languagesLoading ? (
              <div className="loading-container">
                <LoadingSpinner />
                <p>Carregando idiomas...</p>
              </div>
            ) : (
              <>
                {/* Edit Controls */}
                <div className="section-controls">
                  {!isEditing ? (
                    <button className="btn btn-primary" onClick={startEditing}>
                      ✏️ Editar Idiomas
                    </button>
                  ) : (
                    <div className="edit-controls">
                      <button className="btn btn-secondary" onClick={cancelEditing}>
                        ✕ Cancelar
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={saveLanguages}
                        disabled={loading}
                      >
                        {loading ? '💾 Salvando...' : '💾 Salvar'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Current Languages */}
                <div className="languages-list">
                  <h4>Idiomas Configurados ({tempLanguages.length})</h4>

                  {tempLanguages.length === 0 ? (
                    <div className="empty-state">
                      <p>Nenhum idioma configurado ainda.</p>
                      {isEditing && (
                        <p className="help-text">Adicione pelo menos um idioma para seu menu.</p>
                      )}
                    </div>
                  ) : (
                    <div className="language-items">
                      {tempLanguages
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((lang) => (
                          <div key={lang.language_id} className="language-item">
                            <div className="language-info">
                              <div className="language-names">
                                {lang.flag_file && getLanguageIconPath(lang.flag_file) ? (
                                  <img
                                    src={getLanguageIconPath(lang.flag_file)}
                                    alt={`${lang.native_name} flag`}
                                    className="language-icon"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <span className="language-flag-emoji">
                                    {getLanguageFlagEmoji(lang.flag_file, lang.language_code)}
                                  </span>
                                )}
                                <span className="language-native">{lang.native_name}</span>
                                {lang.name && lang.name !== lang.native_name && (
                                  <span className="language-name"> ({lang.name})</span>
                                )}
                              </div>

                              {lang.is_default && <span className="default-badge">Padrão</span>}
                            </div>

                            {isEditing && (
                              <div className="language-controls">
                                {!lang.is_default && (
                                  <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setDefaultLanguage(lang.language_id)}
                                    title="Definir como idioma padrão"
                                  >
                                    Tornar Padrão
                                  </button>
                                )}

                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => removeLanguage(lang.language_id)}
                                  disabled={tempLanguages.length <= 1}
                                  title={
                                    tempLanguages.length <= 1
                                      ? 'Não é possível remover o último idioma'
                                      : 'Remover idioma'
                                  }
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Add New Language */}
                {isEditing && (
                  <div className="add-language-section">
                    <h4>Adicionar Idioma</h4>

                    {/* Debug info */}
                    {/* <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>
                      Total disponíveis: {availableLanguages.length} | {tempLanguages.length} |
                      Disponíveis para adicionar: {getAvailableLanguagesToAdd().length}
                    </div> */}

                    {getAvailableLanguagesToAdd().length === 0 ? (
                      <p className="help-text">
                        Todos os idiomas disponíveis já foram adicionados.
                      </p>
                    ) : (
                      <div className="add-language-controls">
                        <div className="custom-language-select">
                          <button
                            className="language-select-trigger"
                            onClick={() => {
                              console.log('Dropdown clicked, current state:', isDropdownOpen);
                              console.log(
                                'Available languages to add:',
                                getAvailableLanguagesToAdd().length
                              );
                              setIsDropdownOpen(!isDropdownOpen);
                            }}
                            type="button"
                          >
                            <span>Clique para selecionar um idioma para adicionar</span>
                            <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                          </button>

                          {isDropdownOpen && (
                            <div className="language-dropdown-menu">
                              {getAvailableLanguagesToAdd().length === 0 ? (
                                <div className="no-options">Nenhuma opção disponível</div>
                              ) : (
                                getAvailableLanguagesToAdd().map((lang) => (
                                  <button
                                    key={lang.id}
                                    className="language-dropdown-item"
                                    onClick={() => {
                                      addLanguage(lang.id);
                                      setIsDropdownOpen(false);
                                    }}
                                    type="button"
                                  >
                                    <div className="language-option-content">
                                      {lang.flag_file && getLanguageIconPath(lang.flag_file) ? (
                                        <img
                                          src={getLanguageIconPath(lang.flag_file)}
                                          alt={`${lang.native_name} flag`}
                                          className="language-icon"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <span className="language-flag-emoji">
                                          {getLanguageFlagEmoji(lang.flag_file, lang.language_code)}
                                        </span>
                                      )}
                                      <span className="language-option-text">
                                        {lang.native_name}
                                        {lang.name && lang.name !== lang.native_name && (
                                          <span> ({lang.name})</span>
                                        )}
                                      </span>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* General Parameters Section (Future) */}
      <div className="parameter-section">
        <button
          className={`section-header ${isGeneralSectionOpen ? 'expanded' : ''}`}
          onClick={() => setIsGeneralSectionOpen(!isGeneralSectionOpen)}
        >
          <div className="section-title">
            <h3>Parâmetros Gerais</h3>
            <span className="section-description">
              Em desenvolvimento - Outras configurações do restaurante
            </span>
          </div>
          <span className="section-toggle">{isGeneralSectionOpen ? '▼' : '▶'}</span>
        </button>

        {isGeneralSectionOpen && (
          <div className="section-content">
            <div className="coming-soon">
              <p>🚧 Em desenvolvimento...</p>
              <p>Aqui você poderá configurar outros parâmetros do restaurante como:</p>
              <ul>
                <li>Configurações de pagamento</li>
                <li>Integração com sistemas externos</li>
                <li>Configurações de notificação</li>
                <li>Políticas de cancelamento</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantParametersTab;
