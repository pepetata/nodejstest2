const restaurantModel = require('../models/RestaurantModel');
const RestaurantValidation = require('../validations/restaurantValidation');
const ResponseFormatter = require('../utils/responseFormatter');
const { logger } = require('../utils/logger');

/**
 * Restaurant Controller
 * Handles all restaurant-related HTTP requests with comprehensive
 * validation, error handling, logging, and response formatting
 */
class RestaurantController {
  constructor() {
    this.logger = logger.child({ controller: 'RestaurantController' });
  }

  /**
   * Create a new restaurant
   * POST /api/restaurants
   */
  async createRestaurant(req, res, next) {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    const controllerLogger = this.logger.child({
      method: 'createRestaurant',
      requestId,
      userId: req.user?.id,
    });

    try {
      controllerLogger.info('Creating new restaurant', {
        restaurantName: req.body.restaurant_name,
        urlName: req.body.restaurant_url_name,
      });

      // Check if URL name is available
      const isUrlAvailable = await restaurantModel.isUrlNameAvailable(req.body.restaurant_url_name);
      if (!isUrlAvailable) {
        controllerLogger.warn('Restaurant creation failed: URL name already exists', {
          urlName: req.body.restaurant_url_name,
        });
        return res.status(409).json(
          ResponseFormatter.error('URL name is already taken', 409, {
            field: 'restaurant_url_name',
          })
        );
      }

      // Create restaurant
      const restaurant = await restaurantModel.create(req.body);

      controllerLogger.info('Restaurant created successfully', {
        restaurantId: restaurant.id,
        restaurantName: restaurant.restaurant_name,
      });

      res
        .status(201)
        .json(ResponseFormatter.success(restaurant, 'Restaurant created successfully'));
    } catch (error) {
      controllerLogger.error('Error creating restaurant', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Get all restaurants with filtering and pagination
   * GET /api/restaurants
   */
  async getRestaurants(req, res, next) {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    const controllerLogger = this.logger.child({
      method: 'getRestaurants',
      requestId,
    });

    try {
      controllerLogger.debug('Fetching restaurants', {
        filters: req.query,
        page: req.query.page,
        limit: req.query.limit,
      });

      // Extract pagination and filters from validated query
      const { page, limit, sortBy, sortOrder, ...filters } = req.query;

      const pagination = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'created_at',
        sortOrder: sortOrder || 'DESC',
      };

      // Remove empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== '' && value !== null
        )
      );

      const result = await restaurantModel.getRestaurants(cleanFilters, pagination);

      controllerLogger.info('Restaurants fetched successfully', {
        totalCount: result.pagination.total,
        returnedCount: result.restaurants.length,
        page: result.pagination.page,
      });

      res.status(200).json(
        ResponseFormatter.success(result.restaurants, 'Restaurants retrieved successfully', {
          pagination: result.pagination,
          filters: cleanFilters,
        })
      );
    } catch (error) {
      controllerLogger.error('Error fetching restaurants', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Get a restaurant by ID
   * GET /api/restaurants/:id
   */
  async getRestaurantById(req, res, next) {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    const controllerLogger = this.logger.child({
      method: 'getRestaurantById',
      requestId,
      restaurantId: req.params.id,
    });

    try {
      controllerLogger.debug('Fetching restaurant by ID');

      const restaurant = await restaurantModel.findById(req.params.id);

      if (!restaurant) {
        controllerLogger.warn('Restaurant not found');
        return res.status(404).json(ResponseFormatter.error('Restaurant not found', 404));
      }

      controllerLogger.info('Restaurant fetched successfully', {
        restaurantName: restaurant.restaurant_name,
      });

      res
        .status(200)
        .json(ResponseFormatter.success(restaurant, 'Restaurant retrieved successfully'));
    } catch (error) {
      controllerLogger.error('Error fetching restaurant', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Get a restaurant by URL name
   * GET /api/restaurants/by-url/:urlName
   */
  async getRestaurantByUrlName(req, res, next) {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    const controllerLogger = this.logger.child({
      method: 'getRestaurantByUrlName',
      requestId,
      urlName: req.params.urlName,
    });

    try {
      controllerLogger.debug('Fetching restaurant by URL name');

      const restaurant = await restaurantModel.findByUrlName(req.params.urlName);

      if (!restaurant) {
        controllerLogger.warn('Restaurant not found');
        return res.status(404).json(ResponseFormatter.error('Restaurant not found', 404));
      }

      controllerLogger.info('Restaurant fetched successfully', {
        restaurantId: restaurant.id,
        restaurantName: restaurant.restaurant_name,
      });

      res
        .status(200)
        .json(ResponseFormatter.success(restaurant, 'Restaurant retrieved successfully'));
    } catch (error) {
      controllerLogger.error('Error fetching restaurant by URL name', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Update a restaurant
   * PUT /api/restaurants/:id
   */
  async updateRestaurant(req, res, next) {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    const controllerLogger = this.logger.child({
      method: 'updateRestaurant',
      requestId,
      restaurantId: req.params.id,
      userId: req.user?.id,
    });

    try {
      controllerLogger.info('Updating restaurant', {
        updateFields: Object.keys(req.body),
      });

      // Check if restaurant exists
      const existingRestaurant = await restaurantModel.findById(req.params.id);
      if (!existingRestaurant) {
        controllerLogger.warn('Restaurant not found for update');
        return res.status(404).json(ResponseFormatter.error('Restaurant not found', 404));
      }

      // Check URL name availability if it's being updated
      if (
        req.body.restaurant_url_name &&
        req.body.restaurant_url_name !== existingRestaurant.restaurant_url_name
      ) {
        const isUrlAvailable = await restaurantModel.isUrlNameAvailable(
          req.body.restaurant_url_name,
          req.params.id
        );
        if (!isUrlAvailable) {
          controllerLogger.warn('Restaurant update failed: URL name already exists', {
            urlName: req.body.restaurant_url_name,
          });
          return res.status(409).json(
            ResponseFormatter.error('URL name is already taken', 409, {
              field: 'restaurant_url_name',
            })
          );
        }
      }

      const updatedRestaurant = await restaurantModel.update(req.params.id, req.body);

      controllerLogger.info('Restaurant updated successfully', {
        restaurantName: updatedRestaurant.restaurant_name,
      });

      res
        .status(200)
        .json(ResponseFormatter.success(updatedRestaurant, 'Restaurant updated successfully'));
    } catch (error) {
      controllerLogger.error('Error updating restaurant', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Delete a restaurant
   * DELETE /api/restaurants/:id
   */
  async deleteRestaurant(req, res, next) {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    const controllerLogger = this.logger.child({
      method: 'deleteRestaurant',
      requestId,
      restaurantId: req.params.id,
      userId: req.user?.id,
    });

    try {
      controllerLogger.info('Deleting restaurant');

      // Check if restaurant exists
      const existingRestaurant = await restaurantModel.findById(req.params.id);
      if (!existingRestaurant) {
        controllerLogger.warn('Restaurant not found for deletion');
        return res.status(404).json(ResponseFormatter.error('Restaurant not found', 404));
      }

      const result = await restaurantModel.deleteRestaurant(req.params.id);

      if (!result.success) {
        controllerLogger.warn('Restaurant deletion failed', {
          reason: result.message,
        });
        return res.status(400).json(ResponseFormatter.error(result.message, 400));
      }

      controllerLogger.info('Restaurant deleted successfully', {
        restaurantName: existingRestaurant.restaurant_name,
      });

      res.status(200).json(ResponseFormatter.success(null, 'Restaurant deleted successfully'));
    } catch (error) {
      controllerLogger.error('Error deleting restaurant', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Get restaurant statistics
   * GET /api/restaurants/:id/stats
   */
  async getRestaurantStats(req, res, next) {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    const controllerLogger = this.logger.child({
      method: 'getRestaurantStats',
      requestId,
      restaurantId: req.params.id,
    });

    try {
      controllerLogger.debug('Fetching restaurant statistics');

      // Check if restaurant exists
      const restaurant = await restaurantModel.findById(req.params.id);
      if (!restaurant) {
        controllerLogger.warn('Restaurant not found for stats');
        return res.status(404).json(ResponseFormatter.error('Restaurant not found', 404));
      }

      const stats = await restaurantModel.getRestaurantStats(req.params.id);

      controllerLogger.info('Restaurant statistics fetched successfully');

      res
        .status(200)
        .json(ResponseFormatter.success(stats, 'Restaurant statistics retrieved successfully'));
    } catch (error) {
      controllerLogger.error('Error fetching restaurant statistics', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  /**
   * Check if URL name is available
   * GET /api/restaurants/check-url/:urlName
   */
  async checkUrlAvailability(req, res, next) {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
    const controllerLogger = this.logger.child({
      method: 'checkUrlAvailability',
      requestId,
      urlName: req.params.urlName,
    });

    try {
      controllerLogger.debug('Checking URL name availability');

      const isAvailable = await restaurantModel.isUrlNameAvailable(req.params.urlName);

      controllerLogger.debug('URL availability check completed', {
        isAvailable,
      });

      res
        .status(200)
        .json(
          ResponseFormatter.success(
            { available: isAvailable },
            isAvailable ? 'URL name is available' : 'URL name is already taken'
          )
        );
    } catch (error) {
      controllerLogger.error('Error checking URL availability', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }
}

module.exports = new RestaurantController();
