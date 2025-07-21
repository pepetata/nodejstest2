const restaurantModel = require('../models/RestaurantModel');
const RestaurantLocationModel = require('../models/RestaurantLocationModel');
const RestaurantMediaModel = require('../models/restaurantMediaModel');
const { logger } = require('../utils/logger');
const ResponseFormatter = require('../utils/responseFormatter');
const UserService = require('./userService');
const userService = new UserService();
const fs = require('fs').promises;
const path = require('path');

/**
 * Restaurant Service
 * Handles business logic for restaurant management operations
 * Provides dependency injection interface for controllers
 */
class RestaurantService {
  constructor(restaurantModelInstance = restaurantModel) {
    this.restaurantModel = restaurantModelInstance;

    // Defensive logger initialization
    try {
      if (logger && typeof logger.child === 'function') {
        this.logger = logger.child({ service: 'RestaurantService' });
      } else {
        // Fallback logger if child method is not available
        this.logger = {
          child: (context) => ({
            info: () => {},
            warn: () => {},
            error: () => {},
            debug: () => {},
          }),
          info: () => {},
          warn: () => {},
          error: () => {},
          debug: () => {},
        };
      }
    } catch (error) {
      // Fallback noop logger
      this.logger = {
        child: (context) => ({
          info: () => {},
          warn: () => {},
          error: () => {},
          debug: () => {},
        }),
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
    }
  }

  /**
   * Helper method to safely create a service logger with fallback
   * @param {Object} context - Additional context for logging
   * @returns {Object} Logger instance
   */
  _createServiceLogger(context = {}) {
    if (this.logger && typeof this.logger.child === 'function') {
      return this.logger.child(context);
    } else {
      // Fallback noop logger
      return {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
    }
  }

  /**
   * Create a new restaurant
   * @param {Object} restaurantData - Restaurant data
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Created restaurant
   */
  async createRestaurant(data, currentUser = null) {
    const restaurantData = data;
    const userData = data.userPayload;
    // remove userPayload from restaurantData
    delete restaurantData.userPayload;
    const operationId = `create_restaurant_${Date.now()}`;

    const serviceLogger = this._createServiceLogger({
      operation: 'createRestaurant',
      operationId,
      currentUserId: currentUser?.id,
    });

    serviceLogger.info('Creating new restaurant (service)', {
      name: restaurantData.restaurant_name,
      urlName: restaurantData.restaurant_url_name,
      businessType: restaurantData.business_type,
    });

    console.log(`Creating new restaurant (service) ======`);
    try {
      // Add created_by field if current user exists
      if (currentUser) {
        restaurantData.created_by = currentUser.id;
      }

      // Check for unique URL name (case-insensitive)
      await this.validateUrlNameUniqueness(restaurantData.restaurant_url_name);
      // Validate business_type value
      const allowedBusinessTypes = ['single', 'multi'];
      if (!allowedBusinessTypes.includes(restaurantData.business_type)) {
        throw new Error('Tipo de negócio inválido. Valores permitidos: single, multi.');
      }

      // --- CHECK USER EXISTS BEFORE CREATING RESTAURANT ---
      const existingUser = await userService.getUserByEmail(userData.email);
      if (existingUser) {
        serviceLogger.warn('User already exists with this email, aborting restaurant creation', {
          email: userData.email,
        });
        throw new Error(
          'Já existe um usuário cadastrado com este e-mail. O restaurante não foi criado.'
        );
      }
      // --- END CHECK USER EXISTS ---

      // Save restaurant
      const newRestaurant = await this.restaurantModel.create(restaurantData);
      userData.restaurant_id = newRestaurant.id;

      // --- SAVE LOCATIONS ---
      if (Array.isArray(data.locations) && data.locations.length > 0) {
        try {
          const isSingleLocation = restaurantData.business_type === 'single';
          // Backend validation: prevent duplicate url_name for multi-location (case-insensitive)
          if (!isSingleLocation) {
            const urlNames = data.locations
              .map((loc) => loc.urlName?.trim().toLowerCase())
              .filter(Boolean);
            const urlNameSet = new Set();
            for (const name of urlNames) {
              if (urlNameSet.has(name)) {
                throw new Error(
                  'Nome da URL da Unidade duplicado. Cada unidade deve ter uma URL única.'
                );
              }
              urlNameSet.add(name);
            }
          }
          for (let i = 0; i < data.locations.length; i++) {
            const loc = data.locations[i];
            // Map frontend keys to backend keys
            const mappedLoc = {
              ...loc,
              url_name: loc.urlName,
              operating_hours: loc.operatingHours,
              selected_features: loc.selectedFeatures,
              restaurant_id: newRestaurant.id,
            };
            // Flatten address fields if present
            if (loc.address) {
              mappedLoc.address_zip_code = loc.address.zipCode;
              mappedLoc.address_street = loc.address.street;
              mappedLoc.address_street_number = loc.address.streetNumber;
              mappedLoc.address_complement = loc.address.complement;
              mappedLoc.address_city = loc.address.city;
              mappedLoc.address_state = loc.address.state;
              delete mappedLoc.address;
            }
            // Set is_primary true for single-location
            if (isSingleLocation) {
              mappedLoc.is_primary = true;
            }
            delete mappedLoc.urlName;
            delete mappedLoc.operatingHours;
            delete mappedLoc.selectedFeatures;

            await RestaurantLocationModel.create(mappedLoc);
          }
        } catch (locationError) {
          // Cleanup: delete restaurant and user if created
          await this.restaurantModel.deleteRestaurant(newRestaurant.id);
          if (userData && userData.email) {
            try {
              await userService.deleteUserByEmail(userData.email);
            } catch (userDeleteError) {
              // Log but do not block error propagation
              serviceLogger.error('Failed to delete user after location error', {
                error: userDeleteError.message,
                email: userData.email,
              });
            }
          }
          // Throw user-friendly error
          throw new Error(
            'Erro ao salvar localização do restaurante. O restaurante e o usuário foram removidos. Detalhes: ' +
              (locationError.message || 'Erro desconhecido.')
          );
        }
      }
      // --- END SAVE LOCATIONS ---

      serviceLogger.info('Restaurant created successfully', {
        restaurantId: newRestaurant.id,
        name: newRestaurant.restaurant_name,
        status: newRestaurant.status,
      });

      try {
        //check if user email exists in the database before Creating
        const existingUser = await userService.getUserByEmail(userData.email);
        if (!existingUser) {
          // Create user with restaurant_administrator role
          // Pass role_assignments from frontend if available
          const roleAssignments = data.role_assignments || null;
          await userService.createRestaurantAdministrator(
            userData,
            newRestaurant.id,
            null,
            roleAssignments
          );
        } else {
          // If user exists, assign restaurant_administrator role for this restaurant
          await userService.assignRolesToUser(existingUser.id, [
            {
              roleName: 'restaurant_administrator',
              restaurantId: newRestaurant.id,
              isPrimary: true,
            },
          ]);
        }
      } catch (error) {
        serviceLogger.error('Failed to create user', {
          error: error.message,
          userData,
        });
        serviceLogger.info('Deleting new restaurant (service)', {
          name: restaurantData.restaurant_name,
          urlName: restaurantData.restaurant_url_name,
          businessType: restaurantData.business_type,
        });
        await this.restaurantModel.deleteRestaurant(newRestaurant.id);

        // Log the full error details for debugging
        serviceLogger.error('User creation failed during restaurant creation', {
          error: error.message,
          details: error.details || null,
          stack: error.stack?.split('\n').slice(0, 5),
          userData: {
            email: userData.email,
            username: userData.username,
            hasRoles: !!userData.role_location_pairs,
            rolesCount: userData.role_location_pairs?.length || 0,
          },
        });

        // Translate user-related errors for end user
        let mensagemErroUsuario = error.message;

        // Handle validation errors with specific details
        if (mensagemErroUsuario === 'Validation failed' && error.details) {
          const validationErrors = error.details
            .map((detail) => `${detail.field}: ${detail.message}`)
            .join(', ');
          mensagemErroUsuario = `Erro de validação: ${validationErrors}`;
        } else if (
          mensagemErroUsuario.includes('duplicate key') &&
          mensagemErroUsuario.includes('email')
        ) {
          mensagemErroUsuario = 'Já existe um usuário cadastrado com este e-mail.';
        } else if (mensagemErroUsuario === 'User not found') {
          mensagemErroUsuario = 'Usuário não encontrado.';
        } else if (mensagemErroUsuario === 'Insufficient permissions to access this user') {
          mensagemErroUsuario = 'Permissões insuficientes para acessar este usuário.';
        } else if (mensagemErroUsuario === 'Cannot deactivate your own account') {
          mensagemErroUsuario = 'Não é possível desativar a sua própria conta.';
        } else if (mensagemErroUsuario === 'Unauthorized to change this password') {
          mensagemErroUsuario = 'Não autorizado a alterar esta senha.';
        } else if (mensagemErroUsuario === 'Current password is incorrect') {
          mensagemErroUsuario = 'A senha atual está incorreta.';
        } else if (mensagemErroUsuario === 'User not found') {
          mensagemErroUsuario = 'Usuário não encontrado.';
        }
        throw new Error(
          'Erro ao criar o usuário. O restaurante foi removido. Detalhes: ' + mensagemErroUsuario
        );
      }

      return newRestaurant;
    } catch (error) {
      // Translate error for end user
      let mensagemErro = error.message;
      if (mensagemErro === 'URL name is already taken') {
        mensagemErro = 'O nome da URL do restaurante já está em uso.';
      } else if (mensagemErro === 'Restaurant not found') {
        mensagemErro = 'Restaurante não encontrado.';
      } else if (mensagemErro === 'Cannot delete restaurant with active locations') {
        mensagemErro = 'Não é possível excluir o restaurante com unidades ativas.';
      } else if (mensagemErro.startsWith('Location limit reached')) {
        mensagemErro = 'Limite de unidades atingido para o plano de assinatura.';
      } else if (mensagemErro === 'Insufficient permissions to access this restaurant') {
        mensagemErro = 'Permissões insuficientes para acessar este restaurante.';
      } else if (mensagemErro === 'Insufficient permissions to access this user') {
        mensagemErro = 'Permissões insuficientes para acessar este usuário.';
      }
      serviceLogger.error('Failed to create restaurant', {
        error: mensagemErro,
        code: error.code,
      });
      // Always throw error in Portuguese for end user
      throw new Error(mensagemErro);
    }
  }

  /**
   * Get restaurant by ID
   * @param {String} restaurantId - Restaurant ID
   * @param {Boolean} includeLocations - Include locations in response
   * @returns {Promise<Object|null>} Restaurant data or null
   */
  async getRestaurantById(restaurantId, includeLocations = false) {
    const serviceLogger = this._createServiceLogger({
      operation: 'getRestaurantById',
      restaurantId,
    });

    serviceLogger.debug('Fetching restaurant by ID');

    try {
      const restaurant = await this.restaurantModel.findById(restaurantId);

      if (!restaurant) {
        serviceLogger.warn('Restaurant not found', { restaurantId });
        const error = new Error('Restaurant not found');
        error.statusCode = 404;
        throw error;
      }

      // Include locations if requested
      if (includeLocations) {
        const locations = await this.restaurantModel.getRestaurantLocations(restaurantId);
        restaurant.locations = locations;
      }

      serviceLogger.debug('Restaurant retrieved successfully', {
        restaurantId: restaurant.id,
        name: restaurant.restaurant_name,
        status: restaurant.status,
      });

      return restaurant;
    } catch (error) {
      serviceLogger.error('Failed to get restaurant by ID', {
        error: error.message,
        restaurantId,
      });
      throw error;
    }
  }

  /**
   * Get restaurant by URL name
   * @param {String} urlName - Restaurant URL name
   * @param {Boolean} includeLocations - Include locations in response
   * @returns {Promise<Object|null>} Restaurant data or null
   */
  async getRestaurantByUrlName(urlName, includeLocations = false) {
    const serviceLogger = this._createServiceLogger({
      operation: 'getRestaurantByUrlName',
      urlName,
    });

    serviceLogger.debug('Fetching restaurant by URL name');

    try {
      const restaurant = await this.restaurantModel.findByUrlName(urlName);

      if (!restaurant) {
        serviceLogger.warn('Restaurant not found', { urlName });
        const error = new Error('Restaurant not found');
        error.statusCode = 404;
        throw error;
      }

      // Include locations if requested
      if (includeLocations) {
        const locations = await this.restaurantModel.getRestaurantLocations(restaurant.id);
        restaurant.locations = locations;
      }

      serviceLogger.debug('Restaurant retrieved successfully', {
        restaurantId: restaurant.id,
        name: restaurant.restaurant_name,
      });

      return restaurant;
    } catch (error) {
      serviceLogger.error('Failed to get restaurant by URL name', {
        error: error.message,
        urlName,
      });
      throw error;
    }
  }

  /**
   * Get restaurants with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated restaurants list
   */
  async getRestaurants(options) {
    const serviceLogger = this._createServiceLogger({
      operation: 'getRestaurants',
      filters: options,
    });

    serviceLogger.debug('Fetching restaurants with filters');

    try {
      const {
        page = 1,
        limit = 20,
        status,
        cuisine_type,
        business_type,
        search,
        sort_by = 'created_at',
        sort_order = 'desc',
      } = options;

      // Build query filters
      const filters = {};

      // Only include active restaurants in public queries
      if (status) {
        filters.status = status;
      } else {
        filters.status = 'active'; // Default to active restaurants
      }

      if (cuisine_type) filters.cuisine_type = cuisine_type;
      if (business_type) filters.business_type = business_type;

      // Build query options
      const queryOptions = {
        limit,
        offset: (page - 1) * limit,
        orderBy: `${sort_by} ${sort_order.toUpperCase()}`,
      };

      // Add search if provided
      if (search) {
        queryOptions.search = {
          fields: ['restaurant_name', 'description', 'cuisine_type'],
          term: search,
        };
      }

      const result = await this.restaurantModel.find(filters, queryOptions);
      const total = await this.restaurantModel.count(filters);

      const totalPages = Math.ceil(total / limit);

      serviceLogger.info('Restaurants retrieved successfully', {
        total,
        page,
        totalPages,
        returned: result.length,
      });

      return {
        restaurants: result,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        filters: filters,
      };
    } catch (error) {
      serviceLogger.error('Failed to get restaurants', {
        error: error.message,
        options,
      });
      throw error;
    }
  }

  /**
   * Update restaurant
   * @param {String} restaurantId - Restaurant ID
   * @param {Object} updateData - Update data
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Updated restaurant
   */
  async updateRestaurant(restaurantId, updateData, currentUser) {
    const operationId = `update_restaurant_${restaurantId}_${Date.now()}`;
    const serviceLogger = this._createServiceLogger({
      operation: 'updateRestaurant',
      operationId,
      restaurantId,
      currentUserId: currentUser?.id,
    });

    serviceLogger.info('Updating restaurant', {
      fieldsToUpdate: Object.keys(updateData),
    });

    try {
      // Get existing restaurant to validate access
      const existingRestaurant = await this.restaurantModel.findById(restaurantId);
      if (!existingRestaurant) {
        const error = new Error('Restaurant not found');
        error.statusCode = 404;
        throw error;
      }

      // Validate access to update this restaurant
      await this.validateRestaurantOwnership(existingRestaurant, currentUser);

      // Validate URL name uniqueness if being updated
      if (
        updateData.restaurant_url_name &&
        updateData.restaurant_url_name !== existingRestaurant.restaurant_url_name
      ) {
        await this.validateUrlNameUniqueness(updateData.restaurant_url_name);
      }

      const updatedRestaurant = await this.restaurantModel.update(restaurantId, updateData);

      serviceLogger.info('Restaurant updated successfully', {
        restaurantId: updatedRestaurant.id,
        updatedFields: Object.keys(updateData),
      });

      return updatedRestaurant;
    } catch (error) {
      serviceLogger.error('Failed to update restaurant', {
        error: error.message,
        restaurantId,
        updateData: Object.keys(updateData),
      });
      throw error;
    }
  }

  /**
   * Delete restaurant (soft delete)
   * @param {String} restaurantId - Restaurant ID
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Boolean>} Success status
   */
  async deleteRestaurant(restaurantId, currentUser) {
    const serviceLogger = this._createServiceLogger({
      operation: 'deleteRestaurant',
      restaurantId,
      currentUserId: currentUser?.id,
    });

    serviceLogger.info('Deleting restaurant');

    try {
      // Get existing restaurant to validate access
      const existingRestaurant = await this.restaurantModel.findById(restaurantId);
      if (!existingRestaurant) {
        const error = new Error('Restaurant not found');
        error.statusCode = 404;
        throw error;
      }

      // Validate access to delete this restaurant
      await this.validateRestaurantOwnership(existingRestaurant, currentUser, 'delete');

      // Check if restaurant has any active locations
      const hasActiveLocations = await this.restaurantModel.hasActiveLocations(restaurantId);
      if (hasActiveLocations) {
        const error = new Error('Cannot delete restaurant with active locations');
        error.statusCode = 400;
        throw error;
      }

      const result = await this.restaurantModel.deleteRestaurant(restaurantId);

      serviceLogger.info('Restaurant deleted successfully', {
        restaurantId,
        deleted: result,
      });

      return result;
    } catch (error) {
      serviceLogger.error('Failed to delete restaurant', {
        error: error.message,
        restaurantId,
      });
      throw error;
    }
  }

  /**
   * Add restaurant location
   * @param {String} restaurantId - Restaurant ID
   * @param {Object} locationData - Location data
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Created location
   */
  async addLocation(restaurantId, locationData, currentUser) {
    const serviceLogger = this._createServiceLogger({
      operation: 'addLocation',
      restaurantId,
      currentUserId: currentUser?.id,
    });

    serviceLogger.info('Adding restaurant location');

    try {
      // Get existing restaurant to validate access
      const existingRestaurant = await this.restaurantModel.findById(restaurantId);
      if (!existingRestaurant) {
        const error = new Error('Restaurant not found');
        error.statusCode = 404;
        throw error;
      }

      // Validate access to modify this restaurant
      await this.validateRestaurantOwnership(existingRestaurant, currentUser);

      // Check subscription plan limitations
      await this.validateLocationLimit(restaurantId);

      // Add restaurant_id to location data
      locationData.restaurant_id = restaurantId;

      // Add created_by information
      if (currentUser) {
        locationData.created_by = currentUser.id;
      }

      const newLocation = await this.restaurantModel.addLocation(locationData);

      serviceLogger.info('Restaurant location added successfully', {
        restaurantId,
        locationId: newLocation.id,
        locationName: newLocation.location_name,
      });

      return newLocation;
    } catch (error) {
      serviceLogger.error('Failed to add restaurant location', {
        error: error.message,
        restaurantId,
      });
      throw error;
    }
  }

  /**
   * Get restaurant locations
   * @param {String} restaurantId - Restaurant ID
   * @param {Object} currentUser - Current authenticated user (optional for public endpoints)
   * @returns {Promise<Array>} Locations list
   */
  async getLocations(restaurantId, currentUser = null) {
    const serviceLogger = this._createServiceLogger({
      operation: 'getLocations',
      restaurantId,
      currentUserId: currentUser?.id,
    });

    serviceLogger.debug('Fetching restaurant locations');

    try {
      // Get existing restaurant
      const existingRestaurant = await this.restaurantModel.findById(restaurantId);
      if (!existingRestaurant) {
        const error = new Error('Restaurant not found');
        error.statusCode = 404;
        throw error;
      }

      // If user is provided, validate access
      if (currentUser) {
        // For admin operations that need validation
        await this.validateRestaurantAccess(existingRestaurant, currentUser);
      } else {
        // For public endpoints, only allow active restaurants
        if (existingRestaurant.status !== 'active') {
          const error = new Error('Restaurant not found');
          error.statusCode = 404;
          throw error;
        }
      }

      const locations = await this.restaurantModel.getRestaurantLocations(restaurantId);

      serviceLogger.debug('Restaurant locations retrieved successfully', {
        restaurantId,
        locationsCount: locations.length,
      });

      return locations;
    } catch (error) {
      serviceLogger.error('Failed to get restaurant locations', {
        error: error.message,
        restaurantId,
      });
      throw error;
    }
  }

  /**
   * Get restaurant statistics
   * @param {String} restaurantId - Restaurant ID
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Restaurant statistics
   */
  async getRestaurantStats(restaurantId, currentUser = null) {
    const serviceLogger = this._createServiceLogger({
      operation: 'getRestaurantStats',
      restaurantId,
      currentUserId: currentUser?.id,
    });

    serviceLogger.info('Getting restaurant statistics');

    try {
      // First verify the restaurant exists
      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant) {
        const error = new Error('Restaurant not found');
        error.statusCode = 404;
        throw error;
      }

      // For now, return basic stats with the restaurant info
      // In a real application, you might query orders, reviews, etc.
      const stats = {
        id: restaurant.id,
        restaurant_name: restaurant.restaurant_name,
        status: restaurant.status,
        created_at: restaurant.created_at,
        updated_at: restaurant.updated_at,
        // Add more statistics as needed
        total_orders: 0, // Placeholder - would query orders table
        total_reviews: 0, // Placeholder - would query reviews table
        average_rating: 0, // Placeholder - would calculate from reviews
        total_menu_items: 0, // Placeholder - would query menu items
        location_count: 0, // Placeholder - would query locations
      };

      serviceLogger.info('Restaurant statistics retrieved successfully', {
        restaurantId,
        statsKeys: Object.keys(stats).length,
      });

      return stats;
    } catch (error) {
      serviceLogger.error('Failed to get restaurant statistics', {
        restaurantId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Validate URL name uniqueness
   * @param {String} urlName - Restaurant URL name
   * @throws {Error} If URL name already exists
   */
  async validateUrlNameUniqueness(urlName) {
    if (!urlName) return;
    const existingRestaurant = await this.restaurantModel.findByUrlName(urlName.toLowerCase());
    if (existingRestaurant) {
      const error = new Error('URL name is already taken');
      error.statusCode = 409; // Conflict
      throw error;
    }
  }

  /**
   * Validate restaurant ownership
   * @param {Object} restaurant - Restaurant object
   * @param {Object} currentUser - Current authenticated user
   * @param {String} operation - Operation type (update, delete, etc.)
   * @throws {Error} If user doesn't have sufficient permissions
   */
  async validateRestaurantOwnership(restaurant, currentUser, operation = 'update') {
    const serviceLogger = this._createServiceLogger({
      operation: 'validateRestaurantOwnership',
      restaurantId: restaurant.id,
      currentUserId: currentUser?.id,
      accessOperation: operation,
    });

    // Super admin can access everything
    if (this.isSuperAdmin(currentUser)) {
      return true;
    }

    // Restaurant administrators can only manage their own restaurant
    if (currentUser.role === 'restaurant_administrator') {
      if (currentUser.restaurant_id !== restaurant.id) {
        const error = new Error('Insufficient permissions to access this restaurant');
        error.statusCode = 403;
        serviceLogger.warn('Access denied - different restaurant', {
          currentUserRestaurant: currentUser.restaurant_id,
          targetRestaurant: restaurant.id,
        });
        throw error;
      }
      return true;
    }

    const error = new Error('Insufficient permissions to access this restaurant');
    error.statusCode = 403;
    serviceLogger.warn('Access denied - insufficient permissions');
    throw error;
  }

  /**
   * Validate restaurant access (read access)
   * @param {Object} restaurant - Restaurant object
   * @param {Object} currentUser - Current authenticated user
   * @throws {Error} If user doesn't have sufficient permissions
   */
  async validateRestaurantAccess(restaurant, currentUser) {
    const serviceLogger = this._createServiceLogger({
      operation: 'validateRestaurantAccess',
      restaurantId: restaurant.id,
      currentUserId: currentUser?.id,
    });

    // Super admin can access everything
    if (this.isSuperAdmin(currentUser)) {
      return true;
    }

    // Active restaurants are public
    if (restaurant.status === 'active') {
      return true;
    }

    // Restaurant administrators can access their own restaurant
    if (
      currentUser.role === 'restaurant_administrator' &&
      currentUser.restaurant_id === restaurant.id
    ) {
      return true;
    }

    // Staff can access their restaurant
    if (currentUser.restaurant_id === restaurant.id) {
      return true;
    }

    const error = new Error('Insufficient permissions to access this restaurant');
    error.statusCode = 403;
    serviceLogger.warn('Access denied - insufficient permissions');
    throw error;
  }

  /**
   * Validate location limit based on subscription
   * @param {String} restaurantId - Restaurant ID
   * @throws {Error} If location limit exceeded
   */
  async validateLocationLimit(restaurantId) {
    const restaurant = await this.restaurantModel.findById(restaurantId);

    if (!restaurant) {
      const error = new Error('Restaurant not found');
      error.statusCode = 404;
      throw error;
    }

    // Get current location count
    const locations = await this.restaurantModel.getRestaurantLocations(restaurantId);
    const locationCount = locations.length;

    // Check subscription plan limits
    const planLimits = {
      starter: 1,
      professional: 3,
      premium: 10,
      enterprise: 999, // effectively unlimited
    };

    const maxLocations = planLimits[restaurant.subscription_plan] || 1;

    if (locationCount >= maxLocations) {
      const error = new Error(
        `Location limit reached for ${restaurant.subscription_plan} plan (${maxLocations} locations)`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  /**
   * Check URL name availability
   * @param {String} urlName - URL name to check
   * @param {String} excludeId - Restaurant ID to exclude from check (for updates)
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Boolean>} True if available
   */
  async checkUrlAvailability(urlName, excludeId = null, currentUser = null) {
    const operationId = `check_url_availability_${Date.now()}`;
    const serviceLogger = this._createServiceLogger({
      operation: 'checkUrlAvailability',
      operationId,
      urlName,
      excludeId,
      currentUserId: currentUser?.id,
    });

    serviceLogger.info('Checking URL name availability', {
      urlName,
      excludeId,
    });

    try {
      const isAvailable = await this.restaurantModel.isUrlNameAvailable(urlName, excludeId);

      serviceLogger.info('URL availability check completed', {
        urlName,
        isAvailable,
      });

      return isAvailable;
    } catch (error) {
      serviceLogger.error('Error checking URL availability', {
        error: error.message,
        urlName,
      });
      throw error;
    }
  }

  /**
   * Check if user is super admin
   * @param {Object} user - User object
   * @returns {Boolean} Is super admin
   */
  isSuperAdmin(user) {
    return user.role === 'restaurant_administrator' && !user.restaurant_id;
  }

  /**
   * Check if user is admin (any admin role)
   * @param {Object} user - User object
   * @returns {Boolean} Is admin
   */
  isAdmin(user) {
    return ['restaurant_administrator', 'location_administrator'].includes(user.role);
  }

  /**
   * Get restaurant locations
   * @param {String} restaurantId - Restaurant ID
   * @param {Object} user - User object
   * @returns {Array} Array of locations
   */
  async getRestaurantLocations(restaurantId, user) {
    const serviceLogger = this.logger.child({ method: 'getRestaurantLocations' });

    try {
      serviceLogger.debug('Getting restaurant locations', {
        restaurantId,
        userId: user?.id,
      });

      // Check if restaurant exists
      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant) {
        const error = new Error('Restaurant not found');
        error.statusCode = 404;
        throw error;
      }

      // Get all locations for this restaurant
      const locations = await RestaurantLocationModel.getByRestaurantId(restaurantId);

      serviceLogger.debug('Restaurant locations retrieved', {
        locationCount: locations.length,
      });

      return locations;
    } catch (error) {
      serviceLogger.error('Error getting restaurant locations', {
        error: error.message,
        restaurantId,
      });
      throw error;
    }
  }

  /**
   * Update restaurant location
   * @param {String} restaurantId - Restaurant ID
   * @param {String} locationId - Location ID
   * @param {Object} locationData - Location data to update
   * @param {Object} user - User object
   * @returns {Object} Updated location
   */
  async updateRestaurantLocation(restaurantId, locationId, locationData, user) {
    const serviceLogger = this.logger.child({ method: 'updateRestaurantLocation' });

    try {
      serviceLogger.debug('Updating restaurant location', {
        restaurantId,
        locationId,
        userId: user?.id,
      });

      // Check if restaurant exists
      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant) {
        const error = new Error('Restaurant not found');
        error.statusCode = 404;
        throw error;
      }

      // Check if location exists and belongs to this restaurant
      const location = await RestaurantLocationModel.findById(locationId);
      if (!location || location.restaurant_id !== restaurantId) {
        const error = new Error('Location not found');
        error.statusCode = 404;
        throw error;
      }

      // Update the location
      const updatedLocation = await RestaurantLocationModel.update(locationId, locationData);

      serviceLogger.debug('Restaurant location updated successfully');

      return updatedLocation;
    } catch (error) {
      serviceLogger.error('Error updating restaurant location', {
        error: error.message,
        restaurantId,
        locationId,
      });
      throw error;
    }
  }

  /**
   * Get restaurant media
   * @param {String} restaurantId - Restaurant ID
   * @param {Object} user - User object
   * @param {String} locationId - Location ID (optional)
   * @returns {Object} Media data organized by type
   */
  async getRestaurantMedia(restaurantId, user, locationId = null) {
    const serviceLogger = this.logger.child({ method: 'getRestaurantMedia' });

    try {
      serviceLogger.debug('Fetching restaurant media', {
        restaurantId,
        locationId,
        userId: user?.id,
      });

      // Check if restaurant exists
      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant) {
        const error = new Error('Restaurant not found');
        error.statusCode = 404;
        throw error;
      }

      // Fetch media from database
      const mediaRecords = await RestaurantMediaModel.getByRestaurant(restaurantId, locationId);

      serviceLogger.debug('Raw media records from database:', {
        restaurantId,
        locationId,
        recordCount: mediaRecords.length,
        records: mediaRecords.map((r) => ({
          id: r.id,
          media_type: r.media_type,
          filename: r.filename,
          original_filename: r.original_filename,
          file_url: r.file_url,
          file_size: r.file_size,
          location_id: r.location_id,
        })),
      });

      console.log('🔍 Raw media records from database:', {
        restaurantId,
        locationId,
        recordCount: mediaRecords.length,
        records: mediaRecords.map((r) => ({
          id: r.id,
          media_type: r.media_type,
          filename: r.filename,
          original_filename: r.original_filename,
          file_url: r.file_url,
          file_size: r.file_size,
          location_id: r.location_id,
        })),
      });

      // Organize media by type
      const organizedMedia = {
        logo: null,
        favicon: null,
        images: [],
        videos: [],
      };

      mediaRecords.forEach((record) => {
        const mediaItem = {
          id: record.id,
          name: record.original_filename,
          filename: record.filename,
          url: record.file_url,
          size: record.file_size,
          mimeType: record.mime_type,
          uploadedAt: record.created_at,
          locationId: record.location_id,
        };

        serviceLogger.debug('Processing media record:', {
          recordId: record.id,
          mediaType: record.media_type,
          filename: record.filename,
          originalFilename: record.original_filename,
          fileUrl: record.file_url,
          mediaItem,
        });

        if (record.media_type === 'logo' || record.media_type === 'favicon') {
          // Single file types
          organizedMedia[record.media_type] = mediaItem;
        } else if (record.media_type === 'images' || record.media_type === 'videos') {
          // Multiple file types (plural)
          organizedMedia[record.media_type].push(mediaItem);
        } else if (record.media_type === 'image') {
          // Handle singular 'image' -> 'images'
          organizedMedia.images.push(mediaItem);
          serviceLogger.debug('Mapped singular "image" to "images" array');
        } else if (record.media_type === 'video') {
          // Handle singular 'video' -> 'videos'
          organizedMedia.videos.push(mediaItem);
          serviceLogger.debug('Mapped singular "video" to "videos" array');
        } else {
          serviceLogger.warn('Unknown media type encountered', {
            mediaType: record.media_type,
            recordId: record.id,
          });
        }
      });

      serviceLogger.debug('Organized media result:', {
        restaurantId,
        locationId,
        organizedMedia,
        logoCount: organizedMedia.logo ? 1 : 0,
        faviconCount: organizedMedia.favicon ? 1 : 0,
        imagesCount: organizedMedia.images.length,
        videosCount: organizedMedia.videos.length,
      });

      return organizedMedia;
    } catch (error) {
      serviceLogger.error('Error fetching restaurant media', {
        error: error.message,
        restaurantId,
        locationId,
        userId: user?.id,
      });
      throw error;
    }
  }

  /**
   * Upload restaurant media
   * @param {String} restaurantId - Restaurant ID
   * @param {Array} files - Array of files to upload
   * @param {String} mediaType - Type of media (logo, favicon, images, videos)
   * @param {Object} user - User object
   * @returns {Object} Upload result
   */
  async uploadRestaurantMedia(restaurantId, files, mediaType, user, locationId = null) {
    const serviceLogger = this.logger.child({ method: 'uploadRestaurantMedia' });

    try {
      serviceLogger.debug('Uploading restaurant media', {
        restaurantId,
        locationId,
        mediaType,
        fileCount: files?.length || 0,
        userId: user?.id,
      });

      // Check if restaurant exists and get its URL name
      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant) {
        const error = new Error('Restaurant not found');
        error.statusCode = 404;
        throw error;
      }

      const restaurantUrlName = restaurant.restaurant_url_name;
      if (!restaurantUrlName) {
        const error = new Error('Restaurant URL name is required for media upload');
        error.statusCode = 400;
        throw error;
      }

      // For location-specific media (images/videos), get location URL name
      let locationUrlName = null;
      if (['images', 'videos'].includes(mediaType)) {
        if (!locationId) {
          const error = new Error('Location ID is required for images and videos upload');
          error.statusCode = 400;
          throw error;
        }

        const location = await RestaurantLocationModel.findById(locationId);
        if (!location || location.restaurant_id !== restaurantId) {
          const error = new Error('Location not found or does not belong to this restaurant');
          error.statusCode = 404;
          throw error;
        }

        locationUrlName = location.url_name;
        if (!locationUrlName) {
          const error = new Error('Location URL name is required for media upload');
          error.statusCode = 400;
          throw error;
        }
      }

      // Determine folder path based on media type
      let folderPath;
      switch (mediaType) {
        case 'logo':
          folderPath = `logo/${restaurantUrlName}`;
          break;
        case 'favicon':
          folderPath = `favicons/${restaurantUrlName}`;
          break;
        case 'images':
          folderPath = `restaurant_images/${restaurantUrlName}/${locationUrlName}`;
          break;
        case 'videos':
          folderPath = `restaurant_videos/${restaurantUrlName}/${locationUrlName}`;
          break;
        default:
          const error = new Error(`Unsupported media type: ${mediaType}`);
          error.statusCode = 400;
          throw error;
      }

      // Create organized folder structure
      const publicDir = path.join(__dirname, '../../public');
      const fullFolderPath = path.join(publicDir, folderPath);

      try {
        await fs.mkdir(fullFolderPath, { recursive: true });
      } catch (mkdirError) {
        serviceLogger.error('Error creating folder structure', {
          error: mkdirError.message,
          folderPath: fullFolderPath,
        });
        throw mkdirError;
      }

      // Process and move files from temp to organized folders
      const uploadedFiles = [];

      for (const file of files || []) {
        try {
          // Generate unique filename to avoid conflicts
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 15);
          const ext = path.extname(file.originalname || '');
          const uniqueFilename = `${timestamp}_${random}${ext}`;

          const finalPath = path.join(fullFolderPath, uniqueFilename);

          // Move file from temp location to organized folder
          await fs.rename(file.path, finalPath);

          // Create database record
          const mediaRecord = await RestaurantMediaModel.create({
            restaurant_id: restaurantId,
            location_id: locationId,
            media_type: mediaType,
            filename: uniqueFilename,
            original_filename: file.originalname,
            file_path: path.join(folderPath, uniqueFilename).replace(/\\/g, '/'),
            file_url: `/uploads/${path.join(folderPath, uniqueFilename).replace(/\\/g, '/')}`,
            file_size: file.size,
            mime_type: file.mimetype,
            uploaded_by: user?.id,
          });

          uploadedFiles.push({
            id: mediaRecord.id,
            name: file.originalname,
            filename: uniqueFilename,
            url: `/uploads/${folderPath}/${uniqueFilename}`.replace(/\\/g, '/'),
            size: file.size,
            mimeType: file.mimetype,
            uploadedAt: mediaRecord.created_at,
            mediaType,
            restaurantId,
            locationId,
          });
        } catch (fileError) {
          serviceLogger.error('Error processing file', {
            error: fileError.message,
            filename: file.originalname,
          });

          // Clean up temp file if it still exists
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            // Ignore cleanup errors
          }

          throw fileError;
        }
      }

      serviceLogger.debug('Restaurant media uploaded successfully', {
        uploadedCount: uploadedFiles.length,
        folderPath,
      });

      return { files: uploadedFiles, folderPath };
    } catch (error) {
      serviceLogger.error('Error uploading restaurant media', {
        error: error.message,
        restaurantId,
        mediaType,
        userId: user?.id,
      });

      // Clean up any temp files on error
      if (files) {
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            // Ignore cleanup errors
          }
        }
      }

      throw error;
    }
  }

  /**
   * Delete restaurant media
   * @param {String} restaurantId - Restaurant ID
   * @param {String} mediaId - Media ID to delete
   * @param {String} mediaType - Type of media
   * @param {Object} user - User object
   * @returns {Boolean} Success status
   */
  async deleteRestaurantMedia(restaurantId, mediaId, mediaType, user) {
    const serviceLogger = this.logger.child({ method: 'deleteRestaurantMedia' });

    try {
      serviceLogger.debug('Deleting restaurant media', {
        restaurantId,
        mediaId,
        mediaType,
        userId: user?.id,
      });

      // Check if restaurant exists
      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant) {
        const error = new Error('Restaurant not found');
        error.statusCode = 404;
        throw error;
      }

      // Get media record from database
      const mediaRecord = await RestaurantMediaModel.getById(mediaId);
      if (!mediaRecord) {
        const error = new Error('Media not found');
        error.statusCode = 404;
        throw error;
      }

      // Verify the media belongs to the restaurant
      if (mediaRecord.restaurant_id !== restaurantId) {
        const error = new Error('Media does not belong to this restaurant');
        error.statusCode = 403;
        throw error;
      }

      // Delete physical file
      const publicDir = path.join(__dirname, '../../public');
      const filePath = path.join(publicDir, mediaRecord.file_path);

      serviceLogger.debug('Attempting to delete physical file', {
        mediaId,
        filePath: mediaRecord.file_path,
        fullPath: filePath,
      });

      try {
        // Check if file exists before trying to delete
        await fs.access(filePath);
        await fs.unlink(filePath);
        serviceLogger.info('Physical file deleted successfully', {
          mediaId,
          filePath: mediaRecord.file_path,
        });
      } catch (fileError) {
        if (fileError.code === 'ENOENT') {
          serviceLogger.warn('Physical file already deleted or not found', {
            mediaId,
            filePath: mediaRecord.file_path,
          });
        } else {
          serviceLogger.error('Failed to delete physical file', {
            mediaId,
            filePath: mediaRecord.file_path,
            error: fileError.message,
          });
        }
        // Continue with database deletion even if file deletion fails
      }

      // Delete database record
      await RestaurantMediaModel.delete(mediaId);

      serviceLogger.debug('Restaurant media deleted successfully', {
        mediaId,
        fileName: mediaRecord.filename,
      });

      return true;
    } catch (error) {
      serviceLogger.error('Error deleting restaurant media', {
        error: error.message,
        restaurantId,
        mediaId,
      });
      throw error;
    }
  }
}

module.exports = new RestaurantService();
