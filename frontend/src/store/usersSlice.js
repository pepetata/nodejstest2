import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../services/userService';

// Async thunks for user management operations
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await userService.getUsers(filters);
      const responseData = response.data;
      return {
        users: responseData.data, // The actual users array
        total: responseData.meta?.pagination?.total || responseData.data.length,
        meta: responseData.meta,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Erro ao carregar usuários'
      );
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userService.getById(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Erro ao carregar usuário'
      );
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await userService.createUser(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Erro ao criar usuário'
      );
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await userService.updateUser(userId, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Erro ao atualizar usuário'
      );
    }
  }
);

export const toggleUserStatus = createAsyncThunk(
  'users/toggleUserStatus',
  async ({ userId, status }, { rejectWithValue }) => {
    try {
      const response = await userService.toggleStatus(userId, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Erro ao alterar status do usuário'
      );
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await userService.deleteUser(userId);
      return userId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Erro ao excluir usuário'
      );
    }
  }
);

export const fetchRoles = createAsyncThunk('users/fetchRoles', async (_, { rejectWithValue }) => {
  try {
    const response = await userService.getRoles();
    return response.data.data; // Extract the actual data array from the API response
  } catch (error) {
    return rejectWithValue(
      error.response?.data?.error || error.message || 'Erro ao carregar funções'
    );
  }
});

export const fetchLocations = createAsyncThunk(
  'users/fetchLocations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getLocations();
      return response.data.data; // Extract the actual data array from the API response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Erro ao carregar localizações'
      );
    }
  }
);

const initialState = {
  // Users data
  users: [],
  currentUser: null,
  totalUsers: 0,

  // Roles and locations for user creation/editing
  roles: [],
  locations: [],

  // UI state
  loading: {
    users: false,
    userDetails: false,
    creating: false,
    updating: false,
    deleting: false,
    roles: false,
    locations: false,
  },

  // Filters and pagination
  filters: {
    search: '',
    role: '',
    location: '',
    status: '',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  sorting: {
    field: 'full_name',
    direction: 'asc',
  },

  // Error handling
  error: null,

  // Success messages
  successMessage: '',

  // Form state
  isCreating: false,
  isEditing: false,
  editingUserId: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // UI actions
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSorting: (state, action) => {
      state.sorting = action.payload;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = '';
    },
    setIsCreating: (state, action) => {
      state.isCreating = action.payload;
    },
    setIsEditing: (state, action) => {
      state.isEditing = action.payload.isEditing;
      state.editingUserId = action.payload.userId || null;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    resetState: (state) => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading.users = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading.users = false;
        state.users = action.payload.users || action.payload;
        state.totalUsers = action.payload.total || action.payload.length;
        state.pagination.total = action.payload.total || action.payload.length;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading.users = false;
        state.error = action.payload;
      })

      // Fetch user by ID
      .addCase(fetchUserById.pending, (state) => {
        state.loading.userDetails = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading.userDetails = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading.userDetails = false;
        state.error = action.payload;
      })

      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading.creating = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading.creating = false;
        state.users.unshift(action.payload);
        state.totalUsers += 1;
        state.successMessage = 'Usuário criado com sucesso';
        state.isCreating = false;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading.creating = false;
        state.error = action.payload;
      })

      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading.updating = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading.updating = false;
        const index = state.users.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.currentUser = action.payload;
        state.successMessage = 'Usuário atualizado com sucesso';
        state.isEditing = false;
        state.editingUserId = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading.updating = false;
        state.error = action.payload;
      })

      // Toggle user status
      .addCase(toggleUserStatus.pending, (state) => {
        state.loading.updating = true;
        state.error = null;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        state.loading.updating = false;
        const index = state.users.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.successMessage = `Status do usuário ${action.payload.status === 'active' ? 'ativado' : 'desativado'} com sucesso`;
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        state.loading.updating = false;
        state.error = action.payload;
      })

      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading.deleting = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading.deleting = false;
        state.users = state.users.filter((user) => user.id !== action.payload);
        state.totalUsers -= 1;
        state.successMessage = 'Usuário excluído com sucesso';
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading.deleting = false;
        state.error = action.payload;
      })

      // Fetch roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading.roles = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading.roles = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading.roles = false;
        state.error = action.payload;
      })

      // Fetch locations
      .addCase(fetchLocations.pending, (state) => {
        state.loading.locations = true;
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.loading.locations = false;
        state.locations = action.payload;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.loading.locations = false;
        state.error = action.payload;
      });
  },
});

export const {
  setFilters,
  setSorting,
  setPagination,
  clearError,
  clearSuccessMessage,
  setIsCreating,
  setIsEditing,
  clearCurrentUser,
  resetState,
} = usersSlice.actions;

// Selectors
export const selectUsers = (state) => state.users.users;
export const selectUsersLoading = (state) => state.users.loading.users;
export const selectUsersError = (state) => state.users.error;
export const selectUsersPagination = (state) => state.users.pagination;
export const selectRoles = (state) => state.users.roles;
export const selectLocations = (state) => state.users.locations;
export const selectUsersFilters = (state) => state.users.filters;
export const selectUsersSorting = (state) => state.users.sorting;
export const selectCurrentUser = (state) => state.users.currentUser;
export const selectIsCreating = (state) => state.users.isCreating;
export const selectIsEditing = (state) => state.users.isEditing;
export const selectEditingUserId = (state) => state.users.editingUserId;
export const selectSuccessMessage = (state) => state.users.successMessage;

export default usersSlice.reducer;
