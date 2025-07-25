import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaPlus,
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
} from 'react-icons/fa';
import {
  fetchUsers,
  fetchRoles,
  fetchLocations,
  deleteUser,
  toggleUserStatus,
  selectUsers,
  selectUsersLoading,
  selectUsersError,
  selectUsersPagination,
  selectRoles,
  selectLocations,
} from '../../../store/usersSlice';
import UserTable from './UserTable';
import UserFilters from './UserFilters';
import UserDetailsModal from './UserDetailsModal';
import '../../../styles/admin/users/usersPage.scss';

const AdminUsersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const users = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const pagination = useSelector(selectUsersPagination);
  const roles = useSelector(selectRoles);
  const locations = useSelector(selectLocations);
  const currentUser = useSelector((state) => state.auth.user);
  const restaurant = useSelector((state) => state.auth.restaurant);

  // State for modals and forms
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userToView, setUserToView] = useState(null);

  // State for filters
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    location: '',
    status: '',
    is_admin: '',
    sortBy: 'full_name',
    sortOrder: 'asc',
    page: 1,
    limit: 10,
  });

  // Load initial data
  useEffect(() => {
    // Load roles and locations with error handling
    const loadInitialData = async () => {
      try {
        await dispatch(fetchRoles()).unwrap();
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }

      try {
        await dispatch(fetchLocations()).unwrap();
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    };

    loadInitialData();
  }, [dispatch]);

  // Load users when filters change
  useEffect(() => {
    dispatch(fetchUsers(filters));
  }, [dispatch, filters]);

  // Calculate statistics using useMemo to avoid recalculation on every render
  const statistics = useMemo(() => {
    if (!users) {
      return { total: 0, active: 0, inactive: 0, admins: 0 };
    }

    return users.reduce(
      (acc, user) => {
        acc.total++;
        if (user.status === 'active') acc.active++;
        else acc.inactive++;
        if (user.is_admin) acc.admins++;
        return acc;
      },
      { total: 0, active: 0, inactive: 0, admins: 0 }
    );
  }, [users]);

  // Handlers
  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset page when filters change
    }));
  }, []);

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleCreateUser = useCallback(() => {
    navigate('/admin/users/new');
  }, [navigate]);

  const handleEditUser = useCallback(
    (user) => {
      navigate(`/admin/users/${user.id}/edit`);
    },
    [navigate]
  );

  const handleViewUser = useCallback((user) => {
    setUserToView(user);
    setShowUserDetails(true);
  }, []);

  const handleDeleteUser = useCallback((user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (userToDelete) {
      try {
        await dispatch(deleteUser(userToDelete.id)).unwrap();
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        // Refresh users list
        dispatch(fetchUsers(filters));
      } catch (error) {
        console.error('Error deleting user:', error);
        // Error handling is managed by the slice
      }
    }
  }, [userToDelete, dispatch, filters]);

  const handleToggleStatus = useCallback(
    async (userId, currentStatus) => {
      try {
        await dispatch(toggleUserStatus({ userId, status: !currentStatus })).unwrap();
        // Refresh users list
        dispatch(fetchUsers(filters));
      } catch (error) {
        console.error('Error toggling user status:', error);
      }
    },
    [dispatch, filters]
  );

  if (error) {
    return (
      <div className="admin-users-page">
        <div className="alert alert-danger">
          <FaExclamationTriangle className="me-2" />
          Erro ao carregar usuários:{' '}
          {typeof error === 'string' ? error : error?.message || 'Erro desconhecido'}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="page-title-section">
            <h1 className="page-title">Gerenciamento de Usuários</h1>
            <p className="page-subtitle">
              Gerencie os usuários do seu restaurante, perfis e permissões de acesso.
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleCreateUser} disabled={loading}>
            <FaPlus className="me-2" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="statistics-row">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>{statistics.total}</h3>
            <p>Total de Usuários</p>
          </div>
        </div>

        <div className="stat-card active">
          <div className="stat-icon">
            <FaUserCheck />
          </div>
          <div className="stat-content">
            <h3>{statistics.active}</h3>
            <p>Usuários Ativos</p>
          </div>
        </div>

        <div className="stat-card inactive">
          <div className="stat-icon">
            <FaUserTimes />
          </div>
          <div className="stat-content">
            <h3>{statistics.inactive}</h3>
            <p>Usuários Inativos</p>
          </div>
        </div>

        <div className="stat-card admin">
          <div className="stat-icon">
            <FaEdit />
          </div>
          <div className="stat-content">
            <h3>{statistics.admins}</h3>
            <p>Administradores</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <UserFilters
        filters={filters}
        roles={roles}
        locations={locations}
        restaurant={restaurant}
        onFilterChange={handleFilterChange}
        loading={loading}
      />

      {/* Users Table */}
      <UserTable
        users={users || []}
        roles={roles || []}
        locations={locations || []}
        loading={loading}
        currentUser={currentUser}
        restaurant={restaurant}
        currentPage={pagination?.page || 1}
        totalPages={pagination?.totalPages || 1}
        totalCount={pagination?.total || 0}
        onEdit={handleEditUser}
        onView={handleViewUser}
        onDelete={handleDeleteUser}
        onToggleStatus={handleToggleStatus}
        onPageChange={handlePageChange}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FaTrash className="me-2" />
                  Confirmar Exclusão
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Tem certeza que deseja excluir o usuário <strong>{userToDelete?.name}</strong>?
                </p>
                <p className="text-muted">Esta ação não pode ser desfeita.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                >
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                  <FaTrash className="me-2" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        user={userToView}
        roles={roles || []}
        locations={locations || []}
        restaurant={restaurant}
        show={showUserDetails}
        onClose={() => {
          setShowUserDetails(false);
          setUserToView(null);
        }}
      />

      {/* Modal Backdrop */}
      {showDeleteConfirm && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default AdminUsersPage;
