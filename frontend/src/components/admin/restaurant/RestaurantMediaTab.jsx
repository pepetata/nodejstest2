import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  uploadRestaurantMedia,
  deleteRestaurantMedia,
  updateEditData,
} from '../../../store/restaurantSlice';

const RestaurantMediaTab = () => {
  const dispatch = useDispatch();
  const { restaurantData, isEditing, uploadProgress, isUploading } = useSelector(
    (state) => state.restaurant
  );

  const [dragActive, setDragActive] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('logo');

  const mediaTypes = {
    logo: {
      title: 'Logo do Restaurante',
      icon: '🏪',
      description: 'Logo principal do restaurante (recomendado: 512x512px)',
      accept: 'image/jpeg,image/png,image/webp',
      maxSize: 5 * 1024 * 1024, // 5MB
      maxFiles: 1,
    },
    favicon: {
      title: 'Favicon',
      icon: '🔖',
      description: 'Ícone do site (recomendado: 32x32px)',
      accept: 'image/x-icon,image/png',
      maxSize: 1 * 1024 * 1024, // 1MB
      maxFiles: 1,
    },
    images: {
      title: 'Imagens do Restaurante',
      icon: '🖼️',
      description: 'Fotos do ambiente, pratos e instalações',
      accept: 'image/jpeg,image/png,image/webp',
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 20,
    },
    videos: {
      title: 'Vídeos do Restaurante',
      icon: '🎥',
      description: 'Vídeos promocionais e do ambiente',
      accept: 'video/mp4,video/webm,video/mov',
      maxSize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
    },
  };

  const currentMedia = restaurantData?.media || {
    logo: null,
    favicon: null,
    images: [],
    videos: [],
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    if (!isEditing) return;

    const mediaConfig = mediaTypes[selectedMediaType];
    const validFiles = files.filter((file) => {
      // Check file type
      if (!mediaConfig.accept.includes(file.type)) {
        alert(`Tipo de arquivo não suportado: ${file.type}`);
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

    if (currentCount + validFiles.length > mediaConfig.maxFiles) {
      alert(`Limite de arquivos excedido. Máximo: ${mediaConfig.maxFiles}`);
      return;
    }

    // Upload files
    validFiles.forEach((file) => {
      dispatch(
        uploadRestaurantMedia({
          file,
          mediaType: selectedMediaType,
          restaurantId: restaurantData.id,
        })
      );
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

    if (window.confirm('Tem certeza que deseja excluir este arquivo?')) {
      dispatch(
        deleteRestaurantMedia({
          mediaType,
          mediaId,
          restaurantId: restaurantData.id,
        })
      );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                <video src={item.url} controls className="media-video" preload="metadata" />
              ) : (
                <img
                  src={item.url}
                  alt={item.alt || `${mediaType} ${index + 1}`}
                  className="media-image"
                />
              )}
            </div>

            <div className="media-info">
              <p className="media-name">{item.name}</p>
              <p className="media-size">{formatFileSize(item.size)}</p>
              <p className="media-date">{new Date(item.uploadedAt).toLocaleDateString('pt-BR')}</p>
            </div>

            {isEditing && (
              <button
                type="button"
                className="delete-media-btn"
                onClick={() => handleDeleteMedia(mediaType, item.id)}
                title="Excluir arquivo"
              >
                ❌
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderUploadArea = (mediaType) => {
    const config = mediaTypes[mediaType];
    const currentCount = Array.isArray(currentMedia[mediaType])
      ? currentMedia[mediaType].length
      : currentMedia[mediaType]
        ? 1
        : 0;

    if (currentCount >= config.maxFiles) {
      return (
        <div className="upload-area-full">
          <p>Limite de arquivos atingido ({config.maxFiles})</p>
        </div>
      );
    }

    return (
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${!isEditing ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
              type="file"
              accept={config.accept}
              multiple={config.maxFiles > 1}
              onChange={handleFileSelect}
              className="upload-input"
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
      {/* Media Type Selector */}
      <div className="media-type-selector">
        <h3 className="section-title">
          <span className="section-icon">🎨</span>
          Tipo de Mídia
        </h3>
        <div className="media-type-tabs">
          {Object.entries(mediaTypes).map(([key, config]) => (
            <button
              key={key}
              className={`media-type-tab ${selectedMediaType === key ? 'active' : ''}`}
              onClick={() => setSelectedMediaType(key)}
            >
              <span className="tab-icon">{config.icon}</span>
              <span className="tab-label">{config.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Media Type Section */}
      <div className="tab-section">
        <h3 className="section-title">
          <span className="section-icon">{mediaTypes[selectedMediaType].icon}</span>
          {mediaTypes[selectedMediaType].title}
        </h3>

        {/* Current Media Preview */}
        {currentMedia[selectedMediaType] && (
          <div className="current-media-section">
            <h4>Arquivos Atuais</h4>
            {renderMediaPreview(selectedMediaType, currentMedia[selectedMediaType])}
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
            Clique em "Editar" para fazer upload ou gerenciar arquivos de mídia.
          </p>
        </div>
      )}
    </div>
  );
};

export default RestaurantMediaTab;
