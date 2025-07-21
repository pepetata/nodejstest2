import React from 'react';
import PropTypes from 'prop-types';
import {
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaPause,
  FaPlay,
  FaTrash,
  FaEye,
} from 'react-icons/fa';

const UserTable = ({
  users,
  roles,
  locations,
  loading,
  currentUser,
  currentPage,
  totalPages,
  totalCount,
  onEdit,
  onView,
  onToggleStatus,
  onDelete,
  onPageChange,
}) => {
  // Helper function to get role name by ID
  const getRoleName = (roleId) => {
    const role = roles.find((r) => String(r.id) === String(roleId));
    return role ? role.display_name || role.name : 'N/A';
  };

  // Helper function to get role description by ID
  const getRoleDescription = (roleId) => {
    const role = roles.find((r) => String(r.id) === String(roleId));
    return role ? role.description || 'Sem descrição disponível' : 'Sem descrição disponível';
  };

  // Helper function to get role name from user data directly (when available)
  const getUserRoleName = (user) => {
    // First check if there's a display name directly on the user
    if (user.role_display_name) {
      return user.role_display_name;
    }

    // Then check if we have role_location_pairs with role display names
    if (user.role_location_pairs && user.role_location_pairs.length > 0) {
      const roleDisplayNames = user.role_location_pairs
        .map((pair) => pair.role_display_name || pair.role_name)
        .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
        .join(', ');

      if (roleDisplayNames) {
        return roleDisplayNames;
      }
    }

    // Fallback to role lookup by ID
    return getRoleName(user.role_id);
  };

  // Helper function to get role description from user data directly (when available)
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

  // Helper function to check if user is restaurant administrator
  const isRestaurantAdmin = (user) => {
    return (
      user.role_display_name === 'Administrador do Restaurante' ||
      user.role_name === 'restaurant_administrator'
    );
  };

  // Helper function to check if user is the only restaurant administrator
  const isOnlyRestaurantAdmin = (user) => {
    if (!isRestaurantAdmin(user)) {
      return false;
    }

    const activeRestaurantAdmins = users.filter(
      (u) =>
        u.id !== user.id && // Exclude current user
        u.is_active && // Only active users
        isRestaurantAdmin(u)
    );

    return activeRestaurantAdmins.length === 0;
  };

  // Helper function to determine if actions should be disabled
  const shouldDisableActions = (user) => {
    // Prevent current user from performing actions on themselves
    if (currentUser && String(user.id) === String(currentUser.id)) {
      return true;
    }

    // Existing logic: prevent actions on the only restaurant admin
    return isOnlyRestaurantAdmin(user);
  };

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <button
        key="prev"
        className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <FaChevronLeft />
      </button>
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Next button
    pages.push(
      <button
        key="next"
        className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <FaChevronRight />
      </button>
    );

    return (
      <div className="table-pagination">
        <div className="pagination-info">
          Página {currentPage} de {totalPages} ({totalCount} usuários)
        </div>
        <div className="pagination-controls">{pages}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="table-empty">
        <div className="empty-icon">
          <FaUsers />
        </div>
        <h3>Nenhum usuário encontrado</h3>
        <p>Não há usuários cadastrados que correspondam aos filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="users-table">
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Localização</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={user.status !== 'active' ? 'user-inactive' : ''}>
                <td>
                  <div className="user-info">
                    <div className="user-details">
                      <div className="user-name">{user.full_name}</div>
                    </div>
                  </div>
                </td>
                <td>{user.email || user.username || '-'}</td>
                <td>
                  <span className="role-badge" title={getUserRoleDescription(user)}>
                    {getUserRoleName(user)}
                  </span>
                </td>
                <td>
                  <span className="location-badge">{getUserLocationNames(user)}</span>
                </td>
                <td>
                  <span
                    className={`status-badge ${user.status === 'active' ? 'active' : 'inactive'}`}
                  >
                    {user.status === 'active' ? <FaCheckCircle /> : <FaTimesCircle />}
                    {user.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-outline-info"
                      onClick={() => onView(user)}
                      title="Ver detalhes completos do usuário"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onEdit(user)}
                      title="Editar usuário"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className={`btn btn-sm ${
                        user.is_active ? 'btn-outline-warning' : 'btn-outline-success'
                      }`}
                      onClick={() => onToggleStatus(user.id, user.is_active)}
                      title={
                        shouldDisableActions(user)
                          ? 'Não é possível desativar o único administrador do restaurante'
                          : user.is_active
                            ? 'Desativar usuário'
                            : 'Ativar usuário'
                      }
                      disabled={shouldDisableActions(user)}
                    >
                      {user.is_active ? <FaPause /> : <FaPlay />}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(user)}
                      title={
                        shouldDisableActions(user)
                          ? 'Não é possível excluir o único administrador do restaurante'
                          : 'Excluir usuário'
                      }
                      disabled={shouldDisableActions(user)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination />
    </div>
  );
};

UserTable.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired, // UUIDs are strings
      full_name: PropTypes.string.isRequired,
      email: PropTypes.string, // Optional - users can have email or username
      username: PropTypes.string,
      role_id: PropTypes.string, // Role IDs are also UUIDs (strings)
      location_id: PropTypes.string, // Location IDs are also UUIDs (strings)
      status: PropTypes.string.isRequired, // active, inactive, pending, suspended
      is_admin: PropTypes.bool,
      profile_picture: PropTypes.string,
    })
  ).isRequired,
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, // Support both string and number IDs
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, // Support both string and number IDs
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
    full_name: PropTypes.string,
    email: PropTypes.string,
    username: PropTypes.string,
  }),
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onEdit: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default UserTable;
