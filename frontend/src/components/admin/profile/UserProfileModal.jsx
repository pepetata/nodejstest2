import React from 'react';
import PropTypes from 'prop-types';
import { FaTimes, FaEdit, FaArrowLeft } from 'react-icons/fa';
import '../../../styles/admin/profile/userProfileModal.scss';

const UserProfileModal = ({
  user,
  onClose,
  onEdit,
  roles = [],
  locations = [],
  restaurant = null,
  showBackButton = false,
}) => {
  if (!user) {
    return null;
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper function to get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { text: 'Ativo', class: 'active' };
      case 'inactive':
        return { text: 'Inativo', class: 'inactive' };
      case 'pending':
        return { text: 'Pendente', class: 'pending' };
      case 'suspended':
        return { text: 'Suspenso', class: 'suspended' };
      default:
        return { text: 'Desconhecido', class: 'unknown' };
    }
  };

  // Helper function to get grouped role-location data
  const getGroupedRoleLocations = (user) => {
    if (!user.role_location_pairs || user.role_location_pairs.length === 0) {
      return [];
    }

    // Group by role_id and collect locations
    const grouped = user.role_location_pairs.reduce((acc, pair) => {
      const existingRole = acc.find((item) => item.role_id === pair.role_id);

      if (existingRole) {
        // Add location to existing role if not already present
        if (!existingRole.locations.find((loc) => loc.id === pair.location_id)) {
          const location = locations.find((l) => String(l.id) === String(pair.location_id));
          if (location) {
            existingRole.locations.push({
              id: pair.location_id,
              name: location.name,
            });
          }
        }
      } else {
        // Create new role entry
        const role = roles.find((r) => String(r.id) === String(pair.role_id));
        const location = locations.find((l) => String(l.id) === String(pair.location_id));

        if (role) {
          acc.push({
            role_id: pair.role_id,
            role_name: role.display_name || role.name,
            role_description: role.description || 'Sem descrição disponível',
            locations: location
              ? [
                  {
                    id: pair.location_id,
                    name: location.name,
                  },
                ]
              : [],
          });
        }
      }

      return acc;
    }, []);

    return grouped;
  };

  const statusInfo = getStatusInfo(user.status);

  return (
    <div className="user-profile-modal-overlay">
      <div className="user-profile-modal" role="dialog" aria-modal="true" tabIndex={-1}>
        <div className="modal-header">
          <h2 className="modal-title">Meu Perfil</h2>
          <div className="modal-header-actions">
            {showBackButton && (
              <button className="back-button btn-secondary" onClick={onClose} title="Voltar">
                <FaArrowLeft />
                <span>Voltar</span>
              </button>
            )}
            <button className="edit-button btn-primary" onClick={onEdit} title="Editar Perfil">
              <FaEdit />
              <span>Editar</span>
            </button>
            {!showBackButton && (
              <button className="close-button" onClick={onClose} title="Fechar">
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        <div className="modal-body">
          <div className="user-profile-section">
            <div className="user-avatar">
              {user.profile_picture ? (
                <img src={user.profile_picture} alt={user.full_name} />
              ) : (
                <div className="avatar-placeholder">
                  {user.full_name?.charAt(0)?.toUpperCase() ||
                    user.name?.charAt(0)?.toUpperCase() ||
                    'U'}
                </div>
              )}
            </div>
            <div className="user-basic-info">
              <h3 className="user-name">{user.full_name || user.name}</h3>
              <p className="user-email">{user.email || 'Email não informado'}</p>
              <div className="user-status">
                <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>
              </div>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-card">
              <div className="detail-content">
                <h4>Nome Completo</h4>
                <p>{user.full_name || user.name || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-content">
                <h4>Email</h4>
                <p>{user.email || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-content">
                <h4>Nome de Usuário</h4>
                <p>{user.username || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-content">
                <h4>Telefone</h4>
                <p>{user.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-content">
                <h4>WhatsApp</h4>
                <p>{user.whatsapp || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-content">
                <h4>Data de Criação</h4>
                <p>{formatDate(user.created_at)}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-content">
                <h4>Última Atualização</h4>
                <p>{formatDate(user.updated_at)}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-content">
                <h4>Último Login</h4>
                <p>{formatDate(user.last_login_at) || 'Nunca logou'}</p>
              </div>
            </div>
          </div>

          {/* Role-Location Display (Read Only) */}
          <div className="roles-locations-section">
            <h4>{restaurant?.business_type === 'single' ? 'Perfis' : 'Perfis e Unidades'}</h4>
            {getGroupedRoleLocations(user).length > 0 ? (
              <div className="role-location-list">
                {getGroupedRoleLocations(user).map((roleGroup) => (
                  <div key={roleGroup.role_id} className="role-card">
                    <div className="role-header">
                      <h5 className="role-name">{roleGroup.role_name}</h5>
                      <p className="role-description">{roleGroup.role_description}</p>
                    </div>
                    {restaurant?.business_type !== 'single' && (
                      <div className="role-locations">
                        <span className="locations-label">Unidades:</span>
                        <div className="location-tags">
                          {roleGroup.locations.map((location) => (
                            <span key={location.id} className="location-tag">
                              {location.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-roles-message">
                <p>Nenhum perfil atribuído</p>
              </div>
            )}
          </div>

          {user.is_admin && (
            <div className="admin-badge-section">
              <div className="status-badge admin-badge">
                <span className="status-text">Administrador</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

UserProfileModal.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    full_name: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    username: PropTypes.string,
    phone: PropTypes.string,
    whatsapp: PropTypes.string,
    role_id: PropTypes.string,
    role_display_name: PropTypes.string,
    role_description: PropTypes.string,
    location_id: PropTypes.string,
    role_location_pairs: PropTypes.arrayOf(
      PropTypes.shape({
        role_id: PropTypes.string,
        location_id: PropTypes.string,
        role_name: PropTypes.string,
        location_name: PropTypes.string,
      })
    ),
    status: PropTypes.string.isRequired,
    is_admin: PropTypes.bool,
    profile_picture: PropTypes.string,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
    created_by: PropTypes.string,
    created_by_name: PropTypes.string,
    last_login_at: PropTypes.string,
  }).isRequired,
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      display_name: PropTypes.string,
      description: PropTypes.string,
    })
  ).isRequired,
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  restaurant: PropTypes.shape({
    business_type: PropTypes.string,
    name: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  showBackButton: PropTypes.bool,
};

export default UserProfileModal;
