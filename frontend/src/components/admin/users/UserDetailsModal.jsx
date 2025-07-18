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

  // Helper function to get user's role from role_location_pairs
  const getUserRoleName = (user) => {
    // First check if there's a display name directly on the user
    if (user.role_display_name) {
      return user.role_display_name;
    }

    // Then check if we have role_location_pairs with role names
    if (user.role_location_pairs && user.role_location_pairs.length > 0) {
      const roleNames = user.role_location_pairs
        .map((pair) => pair.role_name)
        .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
        .join(', ');

      if (roleNames) {
        return roleNames;
      }
    }

    // Fallback to role lookup by ID
    return getRoleName(user.role_id);
  };

  // Helper function to get user's role description
  const getUserRoleDescription = (user) => {
    if (user.role_description) {
      return user.role_description;
    }

    // Check if we have role_location_pairs with role descriptions
    if (user.role_location_pairs && user.role_location_pairs.length > 0) {
      const firstPair = user.role_location_pairs[0];
      if (firstPair.role_id) {
        return getRoleDescription(firstPair.role_id);
      }
    }

    return getRoleDescription(user.role_id);
  };

  // Helper function to get user's location from role_location_pairs
  const getUserLocationNames = (user) => {
    if (!user.role_location_pairs || user.role_location_pairs.length === 0) {
      return 'Matriz';
    }

    const locationNames = user.role_location_pairs
      .map((pair) => {
        const location = locations.find((l) => String(l.id) === String(pair.location_id));
        return location ? location.name : 'Matriz';
      })
      .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
      .join(', ');

    return locationNames || 'Matriz';
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
              <p className="user-email">{user.email || 'Email não informado'}</p>
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
                <p>{getUserRoleName(user)}</p>
                <small>{getUserRoleDescription(user)}</small>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-content">
                <h4>Localização</h4>
                <p>{getUserLocationNames(user)}</p>
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
    email: PropTypes.string, // Email can be null, not required
    username: PropTypes.string,
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
    created_by_name: PropTypes.string,
    last_login: PropTypes.string,
  }).isRequired, // The user object itself is required
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
