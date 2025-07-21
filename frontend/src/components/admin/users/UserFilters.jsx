import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaSearch, FaTimes } from 'react-icons/fa';

const UserFilters = ({ filters, roles, locations, onFilterChange, loading }) => {
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: '',
    role: '',
    location: '',
    sortBy: 'full_name',
    sortOrder: 'asc',
    ...filters,
  });

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters((prev) => ({
      ...prev,
      ...filters,
    }));
  }, [filters]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...localFilters,
      [key]: value,
      page: 1, // Reset to first page when filtering
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalFilters((prev) => ({ ...prev, search: value }));

    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      handleFilterChange('search', value);
    }, 500);
  };

  // Reset all filters
  const handleReset = () => {
    const resetFilters = {
      search: '',
      status: '',
      role: '',
      location: '',
      sortBy: 'full_name',
      sortOrder: 'asc',
      page: 1,
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return localFilters.search || localFilters.status || localFilters.role || localFilters.location;
  };

  return (
    <div className="user-filters">
      <div className="filters-container">
        {/* Search */}
        <div className="filter-group search-group">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="form-control search-input"
              placeholder="Buscar por nome, email ou telefone..."
              value={localFilters.search}
              onChange={handleSearchChange}
              disabled={loading}
            />
            {localFilters.search && (
              <button
                className="clear-search"
                onClick={() => handleFilterChange('search', '')}
                title="Limpar busca"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="filter-group filters-row">
          <select
            className="form-control"
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            disabled={loading}
          >
            <option value="">Todos os Status</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
            <option value="suspended">Suspensos</option>
          </select>

          <select
            className="form-control"
            value={localFilters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            disabled={loading}
          >
            <option value="">Todos os Perfis</option>
            {roles
              .filter((role) => role.role_name !== 'superadmin') // Exclude superadmin role
              .map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_display_name || role.display_name || role.name}
                </option>
              ))}
          </select>

          <select
            className="form-control"
            value={localFilters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            disabled={loading}
          >
            <option value="">Todas as Unidades</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <div className="filter-group filter-actions">
          {hasActiveFilters() && (
            <button
              className="btn btn-outline-danger"
              onClick={handleReset}
              disabled={loading}
              title="Limpar todos os filtros"
            >
              <FaTimes />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Sort Options Row */}
      <div className="sort-container">
        <div className="sort-group">
          <label htmlFor="sort-by">Ordenar por:</label>
          <select
            id="sort-by"
            className="form-control"
            value={localFilters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            disabled={loading}
          >
            <option value="full_name">Nome</option>
            <option value="email">Email</option>
            <option value="created_at">Data de Criação</option>
            <option value="last_login_at">Último Acesso</option>
          </select>
        </div>

        <div className="sort-group">
          <label htmlFor="sort-order">Ordem:</label>
          <select
            id="sort-order"
            className="form-control"
            value={localFilters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            disabled={loading}
          >
            <option value="asc">Crescente</option>
            <option value="desc">Decrescente</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="active-filters">
          <span className="active-filters-label">Filtros ativos:</span>
          <div className="active-filters-list">
            {localFilters.search && (
              <span className="filter-tag">
                Busca: &quot;{localFilters.search}&quot;
                <button onClick={() => handleFilterChange('search', '')}>
                  <FaTimes />
                </button>
              </span>
            )}
            {localFilters.status && (
              <span className="filter-tag">
                Status:{' '}
                {localFilters.status === 'active'
                  ? 'Ativo'
                  : localFilters.status === 'inactive'
                    ? 'Inativo'
                    : localFilters.status === 'pending'
                      ? 'Pendente'
                      : localFilters.status === 'suspended'
                        ? 'Suspenso'
                        : localFilters.status}
                <button onClick={() => handleFilterChange('status', '')}>
                  <FaTimes />
                </button>
              </span>
            )}
            {localFilters.role && (
              <span className="filter-tag">
                Perfil:{' '}
                {roles.find((r) => String(r.id) === String(localFilters.role))?.role_display_name ||
                  roles.find((r) => String(r.id) === String(localFilters.role))?.display_name ||
                  roles.find((r) => String(r.id) === String(localFilters.role))?.name ||
                  'Desconhecido'}
                <button onClick={() => handleFilterChange('role', '')}>
                  <FaTimes />
                </button>
              </span>
            )}
            {localFilters.location && (
              <span className="filter-tag">
                Localização:{' '}
                {locations.find((l) => String(l.id) === String(localFilters.location))?.name ||
                  'Desconhecida'}
                <button onClick={() => handleFilterChange('location', '')}>
                  <FaTimes />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

UserFilters.propTypes = {
  filters: PropTypes.shape({
    search: PropTypes.string,
    status: PropTypes.string,
    role: PropTypes.string,
    location: PropTypes.string,
    sortBy: PropTypes.string,
    sortOrder: PropTypes.string,
    page: PropTypes.number,
  }).isRequired,
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
  onFilterChange: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default UserFilters;
