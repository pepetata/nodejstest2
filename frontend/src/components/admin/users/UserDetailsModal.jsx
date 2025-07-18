import React from 'react';
import PropTypes from 'prop-types';
import { FaTimes, FaCheck } from 'react-icons/fa';
import '../../../styles/admin/users/userDetailsModal.scss';

const UserDetailsModal = ({ user, roles, locations, onClose, show }) => {
  if (!show || !user) return null;

  // Helper function to get role name
  const getRoleName = (roleId) => {
    const role = roles.find((r) => String(r.id) === String(roleId));
    return role ? role.display_name || role.name : 'N/A';
  };

  // Helper function to get role description
  const getRoleDescription = (roleId) => {
    const role = roles.find((r) => String(r.id) === String(roleId));
    return role ? role.description || 'Sem descrição disponível' : 'Sem descrição disponível';
  };

  // Helper function to get location name
  const getLocationName = (locationId) => {
    const location = locations.find((l) => String(l.id) === String(locationId));
    return location ? location.name : 'Matriz';
  };

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

  const statusInfo = getStatusInfo(user.status);

  return (
    <div className="user-details-modal-overlay">
      <div className="user-details-modal" role="dialog" aria-modal="true" tabIndex={-1}>
        <div className="modal-header">
          <h2 className="modal-title">Detalhes do Usuário</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="user-profile-section">
            <div className="user-avatar">
              {user.profile_picture ? (
                <img src={user.profile_picture} alt={user.full_name} />
              ) : (
                <div className="avatar-placeholder">
                  {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="user-basic-info">
              <h3 className="user-name">{user.full_name}</h3>
              <p className="user-email">{user.email}</p>
              <div className="user-status">
                <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>
              </div>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-card">
              <div className="detail-content">
                <h4>Nome de Usuário</h4>
                <p>{user.username || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-content">
                <h4>Perfil</h4>
                <p>{user.role_display_name || getRoleName(user.role_id)}</p>
                <small>{user.role_description || getRoleDescription(user.role_id)}</small>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-content">
                <h4>Localização</h4>
                <p>{getLocationName(user.location_id)}</p>
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
                <h4>Criado Por</h4>
                <p>{user.created_by_name || 'Sistema'}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-content">
                <h4>Último Login</h4>
                <p>{formatDate(user.last_login) || 'Nunca logou'}</p>
              </div>
            </div>
          </div>

          {user.is_admin && (
            <div className="admin-badge-section">
              <div className="status-badge">
                <span className="status-text">{user.is_admin ? 'Administrador' : 'Usuário'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ok" onClick={onClose}>
            <FaCheck />
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

UserDetailsModal.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    full_name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    username: PropTypes.string,
    role_id: PropTypes.string,
    role_display_name: PropTypes.string,
    role_description: PropTypes.string,
    location_id: PropTypes.string,
    status: PropTypes.string.isRequired,
    is_admin: PropTypes.bool,
    profile_picture: PropTypes.string,
    created_at: PropTypes.string,
    created_by_name: PropTypes.string,
    last_login: PropTypes.string,
  }),
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
  onClose: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default UserDetailsModal;
