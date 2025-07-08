const restaurantModel = require('../models/RestaurantModel');
const { logger } = require('../utils/logger');
const ResponseFormatter = require('../utils/responseFormatter');

/**
 * Restaurant Service
 * Handles business logic for restaurant management operations
 * Provides dependency injection interface for controllers
 */
class RestaurantService {
  constructor(restaurantModelInstance = restaurantModel) {
    this.restaurantModel = restaurantModelInstance;
    this.logger = logger.child({ service: 'RestaurantService' });
  }

  /**
   * Create a new restaurant
   * @param {Object} restaurantData - Restaurant data
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Created restaurant
   */
  async createRestaurant(restaurantData, currentUser = null) {
    const operationId = `create_restaurant_${Date.now()}`;
    const serviceLogger = this.logger.child({
      operation: 'createRestaurant',
      operationId,
      currentUserId: currentUser?.id,
    });

    serviceLogger.info('Creating new restaurant', {
      name: restaurantData.restaurant_name,
      urlName: restaurantData.restaurant_url_name,
      businessType: restaurantData.business_type,
    });

    try {
      // Add created_by field if current user exists
      if (currentUser) {
        restaurantData.created_by = currentUser.id;
      }

      // Check for unique URL name
      await this.validateUrlNameUniqueness(restaurantData.restaurant_url_name);

      const newRestaurant = await this.restaurantModel.create(restaurantData);

      serviceLogger.info('Restaurant created successfully', {
        restaurantId: newRestaurant.id,
        name: newRestaurant.restaurant_name,
        status: newRestaurant.status,
      });

      return newRestaurant;
    } catch (error) {
      serviceLogger.error('Failed to create restaurant', {
        error: error.message,
        code: error.code,
      });
      throw error;
    }
  }

  /**
   * Get restaurant by ID
   * @param {String} restaurantId - Restaurant ID
   * @param {Boolean} includeLocations - Include locations in response
   * @returns {Promise<Object|null>} Restaurant data or null
   */
  async getRestaurantById(restaurantId, includeLocations = false) {
    const serviceLogger = this.logger.child({
      operation: 'getRestaurantById',
      restaurantId,
    });

    serviceLogger.debug('Fetching restaurant by ID');

    try {
      const restaurant = await this.restaurantModel.findById(restaurantId);

      if (!restaurant) {
        serviceLogger.warn('Restaurant not found', { restaurantId });
        return null;
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
    const serviceLogger = this.logger.child({
      operation: 'getRestaurantByUrlName',
      urlName,
    });

    serviceLogger.debug('Fetching restaurant by URL name');

    try {
      const restaurant = await this.restaurantModel.findByUrlName(urlName);

      if (!restaurant) {
        serviceLogger.warn('Restaurant not found', { urlName });
        return null;
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
    const serviceLogger = this.logger.child({
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

      const result = await this.restaurantModel.findWithPagination(filters, queryOptions);

      const totalPages = Math.ceil(result.total / limit);

      serviceLogger.info('Restaurants retrieved successfully', {
        total: result.total,
        page,
        totalPages,
        returned: result.restaurants.length,
      });

      return {
        restaurants: result.restaurants,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
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
    const serviceLogger = this.logger.child({
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
    const serviceLogger = this.logger.child({
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
    const serviceLogger = this.logger.child({
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
    const serviceLogger = this.logger.child({
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
   * Validate URL name uniqueness
   * @param {String} urlName - Restaurant URL name
   * @throws {Error} If URL name already exists
   */
  async validateUrlNameUniqueness(urlName) {
    const existingRestaurant = await this.restaurantModel.findByUrlName(urlName);

    if (existingRestaurant) {
      const error = new Error('Restaurant URL name already exists');
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
    const serviceLogger = this.logger.child({
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
    const serviceLogger = this.logger.child({
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
}

module.exports = RestaurantService;
