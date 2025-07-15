import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import restaurantService from '../services/restaurantService';

// Async thunks for restaurant operations
export const fetchRestaurantProfile = createAsyncThunk(
  'restaurant/fetchProfile',
  async (restaurantId, { rejectWithValue }) => {
    try {
      console.log('fetchRestaurantProfile - API call starting for ID:', restaurantId);
      const response = await restaurantService.getById(restaurantId);
      console.log('fetchRestaurantProfile - API response:', response);
      console.log('fetchRestaurantProfile - Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('fetchRestaurantProfile - API error:', error);
      return rejectWithValue(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Erro ao carregar perfil do restaurante'
      );
    }
  }
);

export const fetchRestaurantLocations = createAsyncThunk(
  'restaurant/fetchLocations',
  async (restaurantId, { rejectWithValue }) => {
    try {
      console.log('fetchRestaurantLocations - API call starting for ID:', restaurantId);
      const response = await restaurantService.getLocations(restaurantId);
      console.log('fetchRestaurantLocations - API response:', response);
      console.log('fetchRestaurantLocations - Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('fetchRestaurantLocations - API error:', error);
      return rejectWithValue(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Erro ao carregar localizações'
      );
    }
  }
);

export const updateRestaurantProfile = createAsyncThunk(
  'restaurant/updateProfile',
  async ({ restaurantId, data }, { rejectWithValue }) => {
    try {
      const response = await restaurantService.update(restaurantId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Erro ao atualizar perfil do restaurante'
      );
    }
  }
);

export const updateRestaurantLocation = createAsyncThunk(
  'restaurant/updateLocation',
  async ({ restaurantId, locationId, data }, { rejectWithValue }) => {
    try {
      const response = await restaurantService.updateLocation(restaurantId, locationId, data);
      // The API returns { success: true, data: { location: updatedLocation }, message: "..." }
      return response.data.data.location;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Erro ao atualizar localização'
      );
    }
  }
);

export const fetchRestaurantMedia = createAsyncThunk(
  'restaurant/fetchMedia',
  async ({ restaurantId, locationId }, { rejectWithValue }) => {
    try {
      console.log('🔍 fetchRestaurantMedia called with:', { restaurantId, locationId });
      const response = await restaurantService.getMedia(restaurantId, locationId);
      console.log('📡 fetchRestaurantMedia full response:', response);
      console.log('📡 fetchRestaurantMedia response.data:', response.data);
      console.log('📡 fetchRestaurantMedia response.data type:', typeof response.data);
      return response.data;
    } catch (error) {
      console.error('❌ fetchRestaurantMedia error:', error);
      console.error('❌ fetchRestaurantMedia error.response:', error.response);
      console.error('❌ fetchRestaurantMedia error.response.data:', error.response?.data);
      return rejectWithValue(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Erro ao carregar mídia do restaurante'
      );
    }
  }
);

export const uploadRestaurantMedia = createAsyncThunk(
  'restaurant/uploadMedia',
  async ({ restaurantId, files, mediaType, locationId }, { rejectWithValue }) => {
    try {
      const response = await restaurantService.uploadMedia(
        restaurantId,
        files,
        mediaType,
        locationId
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Erro ao fazer upload da mídia'
      );
    }
  }
);

export const deleteRestaurantMedia = createAsyncThunk(
  'restaurant/deleteMedia',
  async ({ restaurantId, mediaId, mediaType }, { rejectWithValue }) => {
    try {
      const response = await restaurantService.deleteMedia(restaurantId, mediaId, mediaType);
      return { mediaId, mediaType, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Erro ao deletar mídia'
      );
    }
  }
);

const initialState = {
  // Current restaurant data
  profile: null,
  locations: [],
  media: {
    logo: null,
    favicon: null,
    images: [],
    videos: [],
  },

  // UI state
  activeTab: 'general',
  selectedLocationIndex: 0,

  // Per-tab editing state
  editingTabs: {}, // { tabId: boolean }
  editData: {}, // { tabId: data }
  hasUnsavedChanges: {}, // { tabId: boolean }

  // Form state
  fieldErrors: {},
  touchedFields: {},

  // Async state
  loading: {
    profile: false,
    locations: false,
    media: false,
    updating: false,
    uploading: false,
  },

  error: {
    profile: null,
    locations: null,
    media: null,
    updating: null,
    uploading: null,
  },
};

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {
    // UI actions
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      state.fieldErrors = {};
      state.touchedFields = {};
    },

    setSelectedLocationIndex: (state, action) => {
      state.selectedLocationIndex = action.payload;
      state.fieldErrors = {};
      state.touchedFields = {};
    },

    // Per-tab editing actions
    startTabEditing: (state, action) => {
      const { tabId } = action.payload || {};
      if (!tabId) return;

      // Ensure state properties are initialized as objects
      if (!state.editingTabs) state.editingTabs = {};
      if (!state.editData) state.editData = {};
      if (!state.hasUnsavedChanges) state.hasUnsavedChanges = {};

      state.editingTabs[tabId] = true;

      // Initialize edit data for this tab
      if (tabId === 'general' && state.profile) {
        state.editData[tabId] = JSON.parse(JSON.stringify(state.profile));
        // Ensure features and subscription plan have default values
        if (!state.editData[tabId].selected_features) {
          state.editData[tabId].selected_features = ['digital_menu'];
        }
        if (!state.editData[tabId].subscription_plan) {
          state.editData[tabId].subscription_plan = 'starter';
        }
      } else if (tabId === 'locations' && state.locations.length > 0) {
        state.editData[tabId] = JSON.parse(JSON.stringify(state.locations));
      } else if (tabId === 'features' && state.profile) {
        state.editData[tabId] = {
          selected_features: state.profile.selected_features || ['digital_menu'],
          subscription_plan: state.profile.subscription_plan || 'starter',
        };
      }

      state.hasUnsavedChanges[tabId] = false;
      state.fieldErrors = {};
      state.touchedFields = {};
    },

    cancelTabEditing: (state, action) => {
      const { tabId } = action.payload || {};
      if (!tabId) return;

      // Ensure state properties are initialized as objects
      if (!state.editingTabs) state.editingTabs = {};
      if (!state.editData) state.editData = {};
      if (!state.hasUnsavedChanges) state.hasUnsavedChanges = {};
      if (!state.fieldErrors) state.fieldErrors = {};
      if (!state.touchedFields) state.touchedFields = {};

      state.editingTabs[tabId] = false;
      delete state.editData[tabId];
      delete state.hasUnsavedChanges[tabId];
      state.fieldErrors = {};
      state.touchedFields = {};
    },

    // Form data actions
    updateTabEditData: (state, action) => {
      const { tabId, field, value } = action.payload || {};
      if (!tabId || !field) return;

      // Ensure state properties are initialized as objects
      if (!state.editData) state.editData = {};
      if (!state.hasUnsavedChanges) state.hasUnsavedChanges = {};

      if (!state.editData[tabId]) return;

      // Handle nested field updates for locations (e.g., "0.name", "1.operating_hours.monday.open")
      if (tabId === 'locations' && field.includes('.')) {
        const fieldParts = field.split('.');
        const index = parseInt(fieldParts[0], 10);

        if (!isNaN(index) && state.editData[tabId][index]) {
          const location = state.editData[tabId][index];

          if (fieldParts.length === 2) {
            // Simple nested field: "0.name"
            location[fieldParts[1]] = value;
          } else if (fieldParts.length === 3 && fieldParts[1] === 'address') {
            // Address field: "0.address.address_street_number"
            const [, , addressField] = fieldParts;
            if (!location.address) location.address = {};
            location.address[addressField] = value;
          } else if (fieldParts.length === 4 && fieldParts[1] === 'operating_hours') {
            // Operating hours field: "0.operating_hours.monday.open"
            const [, , day, timeType] = fieldParts;
            if (!location.operating_hours) location.operating_hours = {};
            if (!location.operating_hours[day]) location.operating_hours[day] = {};
            location.operating_hours[day][timeType] = value;
          }
        }
      } else {
        state.editData[tabId][field] = value;
      }

      state.hasUnsavedChanges[tabId] = true;
    },

    // Legacy reducer for backward compatibility
    updateEditData: (state, action) => {
      const { field, value } = action.payload || {};
      if (!field) return;

      const currentTab = state.activeTab;

      if (!state.editData[currentTab]) {
        state.editData[currentTab] = {};
      }

      state.editData[currentTab][field] = value;
      state.hasUnsavedChanges[currentTab] = true;
    },

    // Validation actions
    setFieldError: (state, action) => {
      const { field, error } = action.payload || {};
      if (!field) return;
      state.fieldErrors[field] = error;
    },

    setFieldTouched: (state, action) => {
      const { field } = action.payload || {};
      if (!field) return;
      state.touchedFields[field] = true;
    },

    clearFieldError: (state, action) => {
      const { field } = action.payload || {};
      if (!field) return;
      delete state.fieldErrors[field];
    },

    clearAllErrors: (state) => {
      state.fieldErrors = {};
      state.error = {
        profile: null,
        locations: null,
        updating: null,
        uploading: null,
      };
    },

    // Reset state
    resetRestaurantState: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      // Fetch restaurant profile
      .addCase(fetchRestaurantProfile.pending, (state) => {
        state.loading.profile = true;
        state.error.profile = null;
      })
      .addCase(fetchRestaurantProfile.fulfilled, (state, action) => {
        console.log('fetchRestaurantProfile.fulfilled - action.payload:', action.payload);
        state.loading.profile = false;

        // Handle different API response structures
        let restaurantData = null;
        if (action.payload.restaurant) {
          restaurantData = action.payload.restaurant;
        } else if (action.payload.data && action.payload.data.restaurant) {
          restaurantData = action.payload.data.restaurant;
        } else if (action.payload.data) {
          restaurantData = action.payload.data;
        } else {
          restaurantData = action.payload;
        }

        state.profile = restaurantData;
        state.media = action.payload.media || initialState.media;
        console.log('fetchRestaurantProfile.fulfilled - state.profile set to:', state.profile);
      })
      .addCase(fetchRestaurantProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error.profile = action.payload;
      })

      // Fetch restaurant locations
      .addCase(fetchRestaurantLocations.pending, (state) => {
        state.loading.locations = true;
        state.error.locations = null;
      })
      .addCase(fetchRestaurantLocations.fulfilled, (state, action) => {
        console.log('fetchRestaurantLocations.fulfilled - action.payload:', action.payload);
        state.loading.locations = false;

        // Handle different API response structures
        let locationsData = [];
        if (action.payload.locations) {
          locationsData = action.payload.locations;
        } else if (action.payload.data && action.payload.data.locations) {
          locationsData = action.payload.data.locations;
        } else if (action.payload.data && Array.isArray(action.payload.data)) {
          locationsData = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          locationsData = action.payload;
        } else {
          locationsData = [];
        }

        state.locations = locationsData;
        console.log(
          'fetchRestaurantLocations.fulfilled - state.locations set to:',
          state.locations
        );
      })
      .addCase(fetchRestaurantLocations.rejected, (state, action) => {
        state.loading.locations = false;
        state.error.locations = action.payload;
      })

      // Update restaurant profile
      .addCase(updateRestaurantProfile.pending, (state) => {
        state.loading.updating = true;
        state.error.updating = null;
      })
      .addCase(updateRestaurantProfile.fulfilled, (state, action) => {
        state.loading.updating = false;

        // Handle different response structures
        let restaurantData;
        if (action.payload.restaurant) {
          restaurantData = action.payload.restaurant;
        } else if (action.payload.data && action.payload.data.restaurant) {
          restaurantData = action.payload.data.restaurant;
        } else if (action.payload.data) {
          restaurantData = action.payload.data;
        } else {
          restaurantData = action.payload;
        }

        // Update the profile with the new data
        state.profile = restaurantData;

        // Keep editData as an object, don't set to null
        // The cancelTabEditing action will clean up the specific tab data

        state.fieldErrors = {};
        state.touchedFields = {};
      })
      .addCase(updateRestaurantProfile.rejected, (state, action) => {
        state.loading.updating = false;
        state.error.updating = action.payload;
      })

      // Update restaurant location
      .addCase(updateRestaurantLocation.pending, (state) => {
        state.loading.updating = true;
        state.error.updating = null;
      })
      .addCase(updateRestaurantLocation.fulfilled, (state, action) => {
        state.loading.updating = false;
        // Update the specific location in the locations array
        // The payload should contain the updated location data directly
        const updatedLocation = action.payload;
        const locationIndex = state.locations.findIndex(
          (loc) => loc && loc.id === updatedLocation?.id
        );
        if (locationIndex !== -1 && updatedLocation) {
          state.locations[locationIndex] = updatedLocation;
        }
      })
      .addCase(updateRestaurantLocation.rejected, (state, action) => {
        state.loading.updating = false;
        state.error.updating = action.payload;
      })

      // Fetch restaurant media
      .addCase(fetchRestaurantMedia.pending, (state) => {
        state.loading.media = true;
        state.error.media = null;
      })
      .addCase(fetchRestaurantMedia.fulfilled, (state, action) => {
        state.loading.media = false;
        console.log('✅ fetchRestaurantMedia.fulfilled payload:', action.payload);
        console.log('✅ fetchRestaurantMedia.fulfilled payload type:', typeof action.payload);
        console.log(
          '✅ fetchRestaurantMedia.fulfilled payload keys:',
          Object.keys(action.payload || {})
        );

        // Update media in state
        state.media = {
          logo: action.payload.data.logo,
          favicon: action.payload.data.favicon,
          images: action.payload.data.images || [],
          videos: action.payload.data.videos || [],
        };
        console.log('📊 Updated media state:', state.media);
      })
      .addCase(fetchRestaurantMedia.rejected, (state, action) => {
        state.loading.media = false;
        state.error.media = action.payload;
      })

      // Upload restaurant media
      .addCase(uploadRestaurantMedia.pending, (state) => {
        state.loading.uploading = true;
        state.error.uploading = null;
      })
      .addCase(uploadRestaurantMedia.fulfilled, (state, action) => {
        state.loading.uploading = false;
        // Update media in state
        const { mediaType, files } = action.payload;

        // Ensure files is an array
        const filesArray = Array.isArray(files) ? files : files ? [files] : [];

        if (mediaType === 'logo' || mediaType === 'favicon') {
          state.media[mediaType] = filesArray[0];
        } else {
          // Ensure the media array exists before spreading
          if (!state.media[mediaType]) {
            state.media[mediaType] = [];
          }
          state.media[mediaType] = [...state.media[mediaType], ...filesArray];
        }
      })
      .addCase(uploadRestaurantMedia.rejected, (state, action) => {
        state.loading.uploading = false;
        state.error.uploading = action.payload;
      })

      // Delete restaurant media
      .addCase(deleteRestaurantMedia.pending, (state) => {
        state.loading.uploading = true;
        state.error.uploading = null;
      })
      .addCase(deleteRestaurantMedia.fulfilled, (state, action) => {
        state.loading.uploading = false;
        // Remove deleted media from state
        const { mediaId, mediaType } = action.payload;
        if (mediaType === 'logo' || mediaType === 'favicon') {
          state.media[mediaType] = null;
        } else {
          // Ensure the media array exists before filtering
          if (!state.media[mediaType]) {
            state.media[mediaType] = [];
          }
          state.media[mediaType] = state.media[mediaType].filter((file) => file.id !== mediaId);
        }
      })
      .addCase(deleteRestaurantMedia.rejected, (state, action) => {
        state.loading.uploading = false;
        state.error.uploading = action.payload;
      });
  },
});

export const {
  setActiveTab,
  setSelectedLocationIndex,
  startTabEditing,
  cancelTabEditing,
  updateTabEditData,
  updateEditData,
  setFieldError,
  setFieldTouched,
  clearFieldError,
  clearAllErrors,
  resetRestaurantState,
} = restaurantSlice.actions;

export default restaurantSlice.reducer;
