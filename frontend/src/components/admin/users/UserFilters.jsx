import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaSearch, FaTimes, FaSlidersH, FaFilter } from 'react-icons/fa';

const UserFilters = ({ filters, roles, locations, onFilterChange, loading }) => {
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: '',
    role: '',
    location: '',
    is_admin: '',
    sortBy: 'name',
    sortOrder: 'asc',
    ...filters,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

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
      is_admin: '',
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1,
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      localFilters.search ||
      localFilters.status ||
      localFilters.role ||
      localFilters.location ||
      localFilters.is_admin
    );
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

        {/* Quick Filters */}
        <div className="filter-group quick-filters">
          <select
            className="form-control"
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            disabled={loading}
          >
            <option value="">Todos os Status</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
          </select>

          <select
            className="form-control"
            value={localFilters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            disabled={loading}
          >
            <option value="">Todos os Perfis</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          <select
            className="form-control"
            value={localFilters.is_admin}
            onChange={(e) => handleFilterChange('is_admin', e.target.value)}
            disabled={loading}
          >
            <option value="">Tipo de Usuário</option>
            <option value="true">Apenas Admins</option>
            <option value="false">Usuários Comuns</option>
          </select>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="filter-group filter-actions">
          <button
            className={`btn btn-outline-secondary ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={loading}
          >
            <FaSlidersH />
            Filtros Avançados
          </button>

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

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="advanced-filters">
          <div className="advanced-filters-container">
            <div className="filter-group">
              <label htmlFor="location-filter">Localização:</label>
              <select
                id="location-filter"
                className="form-control"
                value={localFilters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                disabled={loading}
              >
                <option value="">Todas as Localizações</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sort-by">Ordenar por:</label>
              <select
                id="sort-by"
                className="form-control"
                value={localFilters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                disabled={loading}
              >
                <option value="name">Nome</option>
                <option value="email">Email</option>
                <option value="created_at">Data de Criação</option>
                <option value="last_login">Último Acesso</option>
              </select>
            </div>

            <div className="filter-group">
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
        </div>
      )}

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
                Status: {localFilters.status === 'active' ? 'Ativo' : 'Inativo'}
                <button onClick={() => handleFilterChange('status', '')}>
                  <FaTimes />
                </button>
              </span>
            )}
            {localFilters.role && (
              <span className="filter-tag">
                Perfil: {roles.find((r) => r.id === parseInt(localFilters.role))?.name}
                <button onClick={() => handleFilterChange('role', '')}>
                  <FaTimes />
                </button>
              </span>
            )}
            {localFilters.location && (
              <span className="filter-tag">
                Localização: {locations.find((l) => l.id === parseInt(localFilters.location))?.name}
                <button onClick={() => handleFilterChange('location', '')}>
                  <FaTimes />
                </button>
              </span>
            )}
            {localFilters.is_admin && (
              <span className="filter-tag">
                Tipo: {localFilters.is_admin === 'true' ? 'Admin' : 'Usuário Comum'}
                <button onClick={() => handleFilterChange('is_admin', '')}>
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
    is_admin: PropTypes.string,
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
