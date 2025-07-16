import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchRestaurantMedia,
  uploadRestaurantMedia,
  deleteRestaurantMedia,
  startTabEditing,
  cancelTabEditing,
} from '../../../store/restaurantSlice';
import '../../../styles/admin/restaurantMediaTab.scss';

const RestaurantMediaTab = () => {
  const dispatch = useDispatch();
  const { restaurant } = useSelector((state) => state.auth);
  const { restaurantData, editingTabs, uploadProgress, loading, locations, media } = useSelector(
    (state) => state.restaurant
  );

  const tabId = 'media';
  const isEditing = editingTabs?.[tabId] || false;
  const isUploading = loading?.uploading || false;
  const isLoadingMedia = loading?.media || false;

  const [dragActive, setDragActive] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('logo');
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); // For modal view
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null); // For delete confirmation
  const fileInputRef = useRef(null);

  // Load media when component mounts or restaurant changes
  useEffect(() => {
    if (restaurant?.id) {
      console.log('🔍 Fetching media for restaurant:', restaurant.id);
      console.log('🔍 Restaurant object:', restaurant);
      dispatch(fetchRestaurantMedia({ restaurantId: restaurant.id }));
    }
  }, [dispatch, restaurant]);

  // Refetch media when location changes for location-specific media
  useEffect(() => {
    if (restaurant?.id && selectedLocationId && ['images', 'videos'].includes(selectedMediaType)) {
      dispatch(
        fetchRestaurantMedia({ restaurantId: restaurant.id, locationId: selectedLocationId })
      );
    } else if (restaurant?.id && ['logo', 'favicon'].includes(selectedMediaType)) {
      // For logo and favicon, always fetch without location filter
      dispatch(fetchRestaurantMedia({ restaurantId: restaurant.id }));
    }
  }, [dispatch, restaurant?.id, selectedLocationId, selectedMediaType]);

  const mediaTypes = useMemo(
    () => ({
      logo: {
        title: 'Logo do Restaurante',
        icon: '🏪',
        description: 'Logo principal do restaurante (recomendado: 512x512px)',
        accept: 'image/jpeg,image/png,image/webp',
        maxSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 1,
        requiresLocation: false,
      },
      favicon: {
        title: 'Favicon',
        icon: '🔖',
        description: 'Ícone do site (recomendado: 32x32px)',
        accept: '.ico,.png,image/x-icon,image/png',
        maxSize: 1 * 1024 * 1024, // 1MB
        maxFiles: 1,
        requiresLocation: false,
      },
      images: {
        title: 'Imagens do Restaurante',
        icon: '🖼️',
        description: 'Fotos do ambiente, pratos e instalações (por localização)',
        accept: 'image/jpeg,image/png,image/webp',
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 20,
        requiresLocation: true,
      },
      videos: {
        title: 'Vídeos do Restaurante',
        icon: '🎥',
        description: 'Vídeos promocionais e do ambiente (por localização)',
        accept: 'video/mp4,video/webm,video/mov',
        maxSize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10,
        requiresLocation: true,
      },
    }),
    []
  );

  const currentMedia = useMemo(
    () =>
      media || {
        logo: null,
        favicon: null,
        images: [],
        videos: [],
      },
    [media]
  );

  // Debug logging for current media state
  useEffect(() => {
    console.log('🎯 Current Media State:', {
      media,
      currentMedia,
      loading,
      isLoadingMedia,
      restaurant: restaurant?.id,
      editingTabs,
    });
  }, [media, currentMedia, loading, isLoadingMedia, restaurant?.id, editingTabs]);

  // Set default location when switching to location-required media types
  useEffect(() => {
    const requiresLocation = mediaTypes[selectedMediaType]?.requiresLocation;
    if (requiresLocation && locations && locations.length > 0 && !selectedLocationId) {
      // Set the first location as default (usually the main location)
      setSelectedLocationId(locations[0].id);
    } else if (!requiresLocation) {
      // Clear location selection for media types that don't need it
      setSelectedLocationId(null);
    }
  }, [selectedMediaType, locations, selectedLocationId, mediaTypes]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    console.log(
      'Files selected:',
      files.length,
      files.map((f) => f.name)
    );
    handleFiles(files);

    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFiles = (files) => {
    if (!isEditing) return;

    // Check if restaurant data is available
    if (!restaurant?.id) {
      alert('Erro: Dados do restaurante não encontrados. Recarregue a página.');
      return;
    }

    const mediaConfig = mediaTypes[selectedMediaType];
    if (!mediaConfig) {
      alert('Erro: Configuração de mídia não encontrada.');
      return;
    }
    const validFiles = files.filter((file) => {
      // Check file type - support both MIME types and file extensions
      const acceptedTypes = mediaConfig.accept.split(',').map((type) => type.trim());
      const isValidType = acceptedTypes.some((acceptedType) => {
        if (acceptedType.startsWith('.')) {
          // File extension check
          return file.name.toLowerCase().endsWith(acceptedType.toLowerCase());
        } else {
          // MIME type check
          return file.type === acceptedType;
        }
      });

      if (!isValidType) {
        alert(
          `Tipo de arquivo não suportado: ${file.type || file.name}. Tipos aceitos: ${mediaConfig.accept}`
        );
        return false;
      }

      // Check file size
      if (file.size > mediaConfig.maxSize) {
        alert(
          `Arquivo muito grande: ${file.name}. Tamanho máximo: ${formatFileSize(mediaConfig.maxSize)}`
        );
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Check max files limit
    const currentCount = Array.isArray(currentMedia[selectedMediaType])
      ? currentMedia[selectedMediaType].length
      : currentMedia[selectedMediaType]
        ? 1
        : 0;

    // Check if location is required but not selected
    if (mediaConfig.requiresLocation && !selectedLocationId) {
      alert('Por favor, selecione uma localização para fazer upload de imagens/vídeos.');
      return;
    }

    if (currentCount + validFiles.length > mediaConfig.maxFiles) {
      alert(`Limite de arquivos excedido. Máximo: ${mediaConfig.maxFiles}`);
      return;
    }

    // Upload files
    validFiles.forEach((file) => {
      const uploadParams = {
        files: [file], // Convert single file to array
        mediaType: selectedMediaType,
        restaurantId: restaurant.id,
        locationId: mediaConfig.requiresLocation ? selectedLocationId : null,
      };

      dispatch(uploadRestaurantMedia(uploadParams)).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          // Refetch media after successful upload
          dispatch(fetchRestaurantMedia({ restaurantId: restaurant.id }));
        }
      });
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleDeleteMedia = (mediaType, mediaId) => {
    if (!isEditing) return;

    // Check if restaurant data is available
    if (!restaurant?.id) {
      alert('Erro: Dados do restaurante não encontrados. Recarregue a página.');
      return;
    }

    // Show confirmation modal instead of browser confirm
    setDeleteConfirmModal({
      mediaType,
      mediaId,
      restaurantId: restaurant.id,
    });
  };

  const confirmDeleteMedia = () => {
    if (!deleteConfirmModal) return;

    const { mediaType, mediaId, restaurantId } = deleteConfirmModal;

    dispatch(
      deleteRestaurantMedia({
        mediaType,
        mediaId,
        restaurantId,
      })
    ).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        // Refetch media after successful deletion
        dispatch(fetchRestaurantMedia({ restaurantId }));
      }
    });

    // Close modal
    setDeleteConfirmModal(null);
  };

  const cancelDeleteMedia = () => {
    setDeleteConfirmModal(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Editing handlers
  const handleStartEditing = () => {
    dispatch(startTabEditing({ tabId, data: restaurantData?.media }));
  };

  const handleCancelEditing = () => {
    dispatch(cancelTabEditing({ tabId }));
  };

  const renderMediaPreview = (mediaType, mediaData) => {
    if (!mediaData) return null;

    const isArray = Array.isArray(mediaData);
    const items = isArray ? mediaData : [mediaData];

    return (
      <div className={`media-preview ${isArray ? 'media-grid' : 'media-single'}`}>
        {items.map((item, index) => (
          <div key={item.id || index} className="media-item">
            <div className="media-content">
              {mediaType === 'videos' ? (
                <video
                  src={item.url}
                  controls
                  className="media-video"
                  preload="metadata"
                  style={{ maxWidth: '200px', maxHeight: '150px' }}
                >
                  <track kind="captions" />
                </video>
              ) : (
                <div className="media-image-container">
                  <button
                    type="button"
                    onClick={() => setSelectedImage(item)}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                    title="Clique para ver em tamanho original"
                  >
                    <img
                      src={item.url}
                      alt={item.alt || `${mediaType} ${index + 1}`}
                      className="media-image"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '150px',
                        objectFit: 'cover',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                  </button>
                </div>
              )}
            </div>

            <div className="media-info">
              <p className="media-name" title={item.name}>
                {item.name}
              </p>
              <p className="media-size">{formatFileSize(item.size)}</p>
              <p className="media-date">{new Date(item.uploadedAt).toLocaleDateString('pt-BR')}</p>
            </div>

            {isEditing && (
              <button
                type="button"
                className="delete-media-btn"
                onClick={() => handleDeleteMedia(mediaType, item.id)}
                title="Excluir arquivo"
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ❌
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderUploadArea = (_mediaType) => {
    const config = mediaTypes[selectedMediaType];
    const currentCount = Array.isArray(currentMedia[selectedMediaType])
      ? currentMedia[selectedMediaType].length
      : currentMedia[selectedMediaType]
        ? 1
        : 0;

    if (currentCount >= config.maxFiles) {
      return (
        <div className="upload-area-full">
          <p>Limite de arquivos atingido ({config.maxFiles})</p>
        </div>
      );
    }

    const handleAreaClick = () => {
      if (isEditing && fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAreaClick();
      }
    };

    return (
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${!isEditing ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleAreaClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={isEditing ? 0 : -1}
        style={{ cursor: isEditing ? 'pointer' : 'default' }}
      >
        <div className="upload-content">
          <span className="upload-icon">📁</span>
          <h4>Arraste arquivos ou clique para selecionar</h4>
          <p>{config.description}</p>
          <p className="upload-specs">
            Formatos: {config.accept.replace(/[a-z]+\//g, '').toUpperCase()} | Tamanho máximo:{' '}
            {formatFileSize(config.maxSize)} | Máximo: {config.maxFiles} arquivo(s)
          </p>

          {isEditing && (
            <input
              ref={fileInputRef}
              type="file"
              accept={config.accept}
              multiple={config.maxFiles > 1}
              onChange={handleFileSelect}
              className="upload-input"
              style={{ display: 'none' }}
            />
          )}
        </div>

        {isUploading && (
          <div className="upload-progress">
            <div className="upload-progress-bar">
              <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p>Enviando... {uploadProgress}%</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="restaurant-media-tab">
      {/* Header with Edit Controls */}
      <div className="tab-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-icon">🎨</span>
            Imagens e Vídeos
            <div className="tab-edit-controls">
              {!isEditing ? (
                <button className="btn btn-primary" onClick={handleStartEditing}>
                  ✏️ Editar
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={handleCancelEditing}>
                  ✕ Cancelar
                </button>
              )}
            </div>
          </h3>
        </div>
      </div>

      {/* Media Type Selector */}
      <div className="media-type-selector">
        <h4 className="subsection-title">Tipo de Mídia</h4>
        <div className="media-type-tabs">
          {Object.entries(mediaTypes).map(([key, config]) => (
            <button
              key={key}
              className={`media-type-tab ${selectedMediaType === key ? 'active' : ''}`}
              onClick={() => {
                setSelectedMediaType(key);
                if (!config.requiresLocation) {
                  setSelectedLocationId(null);
                }
              }}
            >
              <span className="tab-icon">{config.icon}</span>
              <span className="tab-label">{config.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Location Selector (for images and videos) */}
      {mediaTypes[selectedMediaType]?.requiresLocation && (
        <div className="location-selector">
          <h4 className="subsection-title">Selecionar Localização</h4>
          <div className="location-list">
            {locations && locations.length > 0 ? (
              locations.map((location) => (
                <button
                  key={location.id}
                  className={`location-item ${selectedLocationId === location.id ? 'active' : ''}`}
                  onClick={() => setSelectedLocationId(location.id)}
                  disabled={!isEditing}
                >
                  <div className="location-info">
                    <h5>{location.name || 'Localização'}</h5>
                    <p>
                      {location.street_address}, {location.city}
                    </p>
                    {location.url_name && (
                      <span className="location-url-badge">{location.url_name}</span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <p className="no-locations-message">
                Nenhuma localização encontrada. Adicione pelo menos uma localização primeiro.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Selected Media Type Section */}
      <div className="tab-section">
        <h3 className="section-title">
          <span className="section-icon">{mediaTypes[selectedMediaType].icon}</span>
          {mediaTypes[selectedMediaType].title}
        </h3>

        {/* Current Media Preview */}
        {isLoadingMedia ? (
          <div className="loading-media">
            <p>Carregando mídia...</p>
          </div>
        ) : currentMedia[selectedMediaType] ? (
          <div className="current-media-section">
            <h4>Arquivos Atuais</h4>
            {renderMediaPreview(selectedMediaType, currentMedia[selectedMediaType])}
          </div>
        ) : (
          <div className="no-media-message">
            <p>Nenhum arquivo {mediaTypes[selectedMediaType].title.toLowerCase()} encontrado.</p>
          </div>
        )}

        {/* Upload Area */}
        {renderUploadArea(selectedMediaType)}
      </div>

      {/* Media Management Tips */}
      <div className="tab-section">
        <h3 className="section-title">
          <span className="section-icon">💡</span>
          Dicas de Mídia
        </h3>
        <div className="media-tips">
          <div className="tip-item">
            <strong>Logo:</strong> Use imagens em alta resolução (512x512px ou maior) com fundo
            transparente para melhor qualidade.
          </div>
          <div className="tip-item">
            <strong>Favicon:</strong> Deve ser um ícone simples e reconhecível mesmo em tamanhos
            pequenos (32x32px).
          </div>
          <div className="tip-item">
            <strong>Imagens:</strong> Fotos do ambiente, pratos e instalações ajudam a atrair
            clientes. Use boa iluminação.
          </div>
          <div className="tip-item">
            <strong>Vídeos:</strong> Vídeos curtos (30-60 segundos) são mais eficazes. Mantenha o
            tamanho do arquivo otimizado.
          </div>
        </div>
      </div>

      {/* Media Statistics */}
      <div className="tab-section">
        <h3 className="section-title">
          <span className="section-icon">📊</span>
          Resumo da Mídia
        </h3>
        <div className="media-stats">
          {Object.entries(mediaTypes).map(([key, config]) => {
            const current = currentMedia[key];
            const count = Array.isArray(current) ? current.length : current ? 1 : 0;
            const totalSize = Array.isArray(current)
              ? current.reduce((sum, item) => sum + (item.size || 0), 0)
              : current?.size || 0;

            return (
              <div key={key} className="stat-item">
                <div className="stat-header">
                  <span className="stat-icon">{config.icon}</span>
                  <span className="stat-label">{config.title}</span>
                </div>
                <div className="stat-values">
                  <span className="stat-count">
                    {count}/{config.maxFiles}
                  </span>
                  <span className="stat-size">{formatFileSize(totalSize)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!isEditing && (
        <div className="view-mode-info">
          <p className="info-text">
            <span className="info-icon">ℹ️</span>
            Clique em &quot;Editar&quot; para fazer upload ou gerenciar arquivos de mídia.
          </p>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <button
          type="button"
          className="image-modal"
          aria-label="Fechar visualização da imagem"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
            }}
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ✕
            </button>
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              {selectedImage.name}
            </div>
          </div>
        </button>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div
          className="delete-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cancelDeleteMedia();
            }
          }}
          onKeyDown={(e) => e.key === 'Escape' && cancelDeleteMedia()}
          role="button"
          tabIndex={0}
          aria-label="Fechar modal de confirmação"
        >
          <div
            className="delete-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div id="delete-modal-title" className="delete-modal-header">
              <span>⚠️</span>
              Confirmar Exclusão
            </div>

            <div className="delete-modal-message">
              Tem certeza que deseja excluir este arquivo de mídia?
              <br />
              <strong>Esta ação não pode ser desfeita.</strong>
            </div>

            <div className="delete-modal-actions">
              <button type="button" onClick={cancelDeleteMedia}>
                Cancelar
              </button>
              <button type="button" onClick={confirmDeleteMedia}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantMediaTab;
