const RestaurantService = require('../services/restaurantService');
const RestaurantValidation = require('../validations/restaurantValidation');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Restaurant Controller
 * Handles all restaurant-related HTTP requests with comprehensive
 * validation, error handling, logging, and response formatting
 * Uses RestaurantService for business logic and dependency injection
 */
class RestaurantController {
  constructor(injectedLogger = null, restaurantServiceInstance = null) {
    // Use injected logger (for testing) or import the real logger
    if (injectedLogger) {
      this.logger = injectedLogger;
    } else {
      try {
        const { logger } = require('../utils/logger');
        this.logger = logger.child({ controller: 'RestaurantController' });
      } catch (error) {
        // Fallback logger for testing or when logger is not available
        this.logger = {
          child: () => ({
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

    // Ensure logger is always defined with fallback
    if (!this.logger) {
      this.logger = {
        child: () => ({
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

    // Use injected service (for testing) or use the singleton instance
    this.restaurantService = restaurantServiceInstance || RestaurantService;
  }

  /**
   * Create a new restaurant
   * POST /api/v1/restaurants
   */
  createRestaurant = asyncHandler(async (req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;

    // Defensive logger access with fallback
    let controllerLogger;
    if (this.logger && typeof this.logger.child === 'function') {
      controllerLogger = this.logger.child({
        method: 'createRestaurant',
        requestId,
        userId: req.user?.id,
      });
    } else {
      // Fallback noop logger
      controllerLogger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
    }

    try {
      controllerLogger.info('Creating new restaurant (controller)', {
        restaurantName: req.body.restaurant_name,
        urlName: req.body.restaurant_url_name,
        websiteRaw: req.body.website,
        requestBody: req.body,
      });

      const restaurant = await this.restaurantService.createRestaurant(req.body, req.user);

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

      // Handle specific service errors
      if (error.statusCode === 409) {
        return res.status(409).json(
          ResponseFormatter.error(error.message, 409, {
            field: 'restaurant_url_name',
          })
        );
      }

      next(error);
    }
  });

  /**
   * Get all restaurants with filtering and pagination
   * GET /api/v1/restaurants
   */
  getRestaurants = asyncHandler(async (req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;

    // Defensive logger access with fallback
    let controllerLogger;
    if (this.logger && typeof this.logger.child === 'function') {
      controllerLogger = this.logger.child({
        method: 'getRestaurants',
        requestId,
      });
    } else {
      // Fallback noop logger
      controllerLogger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
    }

    try {
      controllerLogger.debug('Fetching restaurants', {
        filters: req.query,
        page: req.query.page,
        limit: req.query.limit,
      });

      const result = await this.restaurantService.getRestaurants(req.query, req.user);

      controllerLogger.info('Restaurants fetched successfully', {
        totalCount: result.pagination.total,
        returnedCount: result.restaurants.length,
        page: result.pagination.page,
      });

      res.status(200).json(
        ResponseFormatter.success(result.restaurants, 'Restaurants retrieved successfully', {
          pagination: result.pagination,
          filters: result.filters,
        })
      );
    } catch (error) {
      controllerLogger.error('Error fetching restaurants', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  });

  /**
   * Get a restaurant by ID
   * GET /api/v1/restaurants/:id
   */
  getRestaurantById = asyncHandler(async (req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;

    // Defensive logger access with fallback
    let controllerLogger;
    if (this.logger && typeof this.logger.child === 'function') {
      controllerLogger = this.logger.child({
        method: 'getRestaurantById',
        requestId,
        restaurantId: req.params.id,
      });
    } else {
      // Fallback noop logger
      controllerLogger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
    }

    try {
      controllerLogger.debug('Fetching restaurant by ID');

      const restaurant = await this.restaurantService.getRestaurantById(req.params.id, req.user);

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

      // Handle specific service errors
      if (error.statusCode === 404) {
        return res.status(404).json(ResponseFormatter.error('Restaurant not found', 404));
      }

      next(error);
    }
  });

  /**
   * Get a restaurant by URL name
   * GET /api/v1/restaurants/by-url/:urlName
   */
  getRestaurantByUrlName = asyncHandler(async (req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;

    // Defensive logger access with fallback
    let controllerLogger;
    if (this.logger && typeof this.logger.child === 'function') {
      controllerLogger = this.logger.child({
        method: 'getRestaurantByUrlName',
        requestId,
        urlName: req.params.urlName,
      });
    } else {
      // Fallback noop logger
      controllerLogger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
    }

    try {
      controllerLogger.debug('Fetching restaurant by URL name');

      const restaurant = await this.restaurantService.getRestaurantByUrlName(
        req.params.urlName,
        req.user
      );

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

      // Handle specific service errors
      if (error.statusCode === 404) {
        return res.status(404).json(ResponseFormatter.error('Restaurant not found', 404));
      }

      next(error);
    }
  });

  /**
   * Update a restaurant
   * PUT /api/v1/restaurants/:id
   */
  updateRestaurant = asyncHandler(async (req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;

    // Defensive logger access with fallback
    let controllerLogger;
    if (this.logger && typeof this.logger.child === 'function') {
      controllerLogger = this.logger.child({
        method: 'updateRestaurant',
        requestId,
        restaurantId: req.params.id,
        userId: req.user?.id,
      });
    } else {
      // Fallback noop logger
      controllerLogger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
    }

    try {
      controllerLogger.info('Updating restaurant', {
        updateFields: Object.keys(req.body),
      });

      const updatedRestaurant = await this.restaurantService.updateRestaurant(
        req.params.id,
        req.body,
        req.user
      );

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

      // Handle specific service errors
      if (error.statusCode === 404) {
        return res.status(404).json(ResponseFormatter.error('Restaurant not found', 404));
      }
      if (error.statusCode === 409) {
        return res.status(409).json(
          ResponseFormatter.error(error.message, 409, {
            field: 'restaurant_url_name',
          })
        );
      }

      next(error);
    }
  });

  /**
   * Delete a restaurant
   * DELETE /api/v1/restaurants/:id
   */
  deleteRestaurant = asyncHandler(async (req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;

    // Defensive logger access with fallback
    let controllerLogger;
    if (this.logger && typeof this.logger.child === 'function') {
      controllerLogger = this.logger.child({
        method: 'deleteRestaurant',
        requestId,
        restaurantId: req.params.id,
        userId: req.user?.id,
      });
    } else {
      // Fallback noop logger
      controllerLogger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
    }

    try {
      controllerLogger.info('Deleting restaurant');

      const result = await this.restaurantService.deleteRestaurant(req.params.id, req.user);

      controllerLogger.info('Restaurant deleted successfully');

      res.status(200).json(ResponseFormatter.success(null, 'Restaurant deleted successfully'));
    } catch (error) {
      controllerLogger.error('Error deleting restaurant', {
        error: error.message,
        stack: error.stack,
      });

      // Handle specific service errors
      if (error.statusCode === 404) {
        return res.status(404).json(ResponseFormatter.error('Restaurant not found', 404));
      }
      if (error.statusCode === 400) {
        return res.status(400).json(ResponseFormatter.error(error.message, 400));
      }

      next(error);
    }
  });

  /**
   * Get restaurant statistics
   * GET /api/v1/restaurants/:id/stats
   */
  getRestaurantStats = asyncHandler(async (req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;

    // Defensive logger access with fallback
    let controllerLogger;
    if (this.logger && typeof this.logger.child === 'function') {
      controllerLogger = this.logger.child({
        method: 'getRestaurantStats',
        requestId,
        restaurantId: req.params.id,
      });
    } else {
      // Fallback noop logger
      controllerLogger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
    }

    try {
      controllerLogger.debug('Fetching restaurant statistics');

      const stats = await this.restaurantService.getRestaurantStats(req.params.id, req.user);

      controllerLogger.info('Restaurant statistics fetched successfully');

      res
        .status(200)
        .json(ResponseFormatter.success(stats, 'Restaurant statistics retrieved successfully'));
    } catch (error) {
      controllerLogger.error('Error fetching restaurant statistics', {
        error: error.message,
        stack: error.stack,
      });

      // Handle specific service errors
      if (error.statusCode === 404) {
        return res.status(404).json(ResponseFormatter.error('Restaurant not found', 404));
      }

      next(error);
    }
  });

  /**
   * Check if URL name is available
   * GET /api/restaurants/check-url/:urlName
   */
  checkUrlAvailability = asyncHandler(async (req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;

    // Defensive logger access with fallback
    let controllerLogger;
    if (this.logger && typeof this.logger.child === 'function') {
      controllerLogger = this.logger.child({
        method: 'checkUrlAvailability',
        requestId,
        urlName: req.params.urlName,
      });
    } else {
      // Fallback noop logger
      controllerLogger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      };
    }

    try {
      controllerLogger.debug('Checking URL name availability');

      const isAvailable = await this.restaurantService.checkUrlAvailability(
        req.params.urlName,
        req.query.exclude,
        req.user
      );

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
  });

  /**
   * Get restaurant locations
   * GET /api/v1/restaurants/:id/locations
   */
  getRestaurantLocations = asyncHandler(async (req, res, next) => {
    const controllerLogger = this.logger.child({ method: 'getRestaurantLocations' });

    try {
      controllerLogger.info('Getting restaurant locations', {
        restaurantId: req.params.id,
        userId: req.user?.id,
      });

      const locations = await this.restaurantService.getRestaurantLocations(
        req.params.id,
        req.user
      );

      controllerLogger.debug('Restaurant locations retrieved successfully', {
        locationCount: locations.length,
      });

      res
        .status(200)
        .json(
          ResponseFormatter.success({ locations }, 'Restaurant locations retrieved successfully')
        );
    } catch (error) {
      controllerLogger.error('Error getting restaurant locations', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  });

  /**
   * Get restaurant media
   * GET /api/v1/restaurants/:id/media
   */
  getRestaurantMedia = asyncHandler(async (req, res, next) => {
    const controllerLogger = this.logger.child({ method: 'getRestaurantMedia' });

    try {
      controllerLogger.info('Fetching restaurant media', {
        restaurantId: req.params.id,
        userId: req.user?.id,
        locationId: req.query.locationId,
        headers: req.headers.authorization
          ? 'Authorization header present'
          : 'No authorization header',
      });

      console.log('🔍 getRestaurantMedia called with:', {
        restaurantId: req.params.id,
        userId: req.user?.id,
        locationId: req.query.locationId,
        userRole: req.user?.role,
        hasAuthHeader: !!req.headers.authorization,
      });

      const mediaData = await this.restaurantService.getRestaurantMedia(
        req.params.id,
        req.user,
        req.query.locationId
      );

      console.log('📡 getRestaurantMedia result:', {
        logoPresent: !!mediaData.logo,
        faviconPresent: !!mediaData.favicon,
        imagesCount: mediaData.images?.length || 0,
        videosCount: mediaData.videos?.length || 0,
        fullResult: mediaData,
      });

      controllerLogger.info('Restaurant media retrieved successfully', {
        restaurantId: req.params.id,
        mediaCount: Object.keys(mediaData).length,
      });

      res.json(ResponseFormatter.success(mediaData, 'Restaurant media retrieved successfully'));
    } catch (error) {
      console.error('❌ getRestaurantMedia error:', error);
      controllerLogger.error('Error fetching restaurant media', {
        restaurantId: req.params.id,
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  });

  /**
   * Upload restaurant media
   * POST /api/v1/restaurants/:id/media
   */
  uploadRestaurantMedia = asyncHandler(async (req, res, next) => {
    const controllerLogger = this.logger.child({ method: 'uploadRestaurantMedia' });

    try {
      controllerLogger.info('Uploading restaurant media', {
        restaurantId: req.params.id,
        locationId: req.body.locationId,
        mediaType: req.body.mediaType,
        fileCount: req.files?.length || 0,
        userId: req.user?.id,
      });

      const mediaData = await this.restaurantService.uploadRestaurantMedia(
        req.params.id,
        req.files,
        req.body.mediaType,
        req.user,
        req.body.locationId
      );

      controllerLogger.debug('Restaurant media uploaded successfully', {
        uploadedFiles: mediaData.files?.length || 0,
        folderPath: mediaData.folderPath,
      });

      res.status(201).json(
        ResponseFormatter.success(
          {
            mediaType: req.body.mediaType,
            files: mediaData.files,
            folderPath: mediaData.folderPath,
          },
          'Media uploaded successfully'
        )
      );
    } catch (error) {
      controllerLogger.error('Error uploading restaurant media', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  });

  /**
   * Delete restaurant media
   * DELETE /api/v1/restaurants/:id/media/:mediaId
   */
  deleteRestaurantMedia = asyncHandler(async (req, res, next) => {
    const controllerLogger = this.logger.child({ method: 'deleteRestaurantMedia' });

    try {
      controllerLogger.info('Deleting restaurant media', {
        restaurantId: req.params.id,
        mediaId: req.params.mediaId,
        mediaType: req.query.type,
        userId: req.user?.id,
      });

      await this.restaurantService.deleteRestaurantMedia(
        req.params.id,
        req.params.mediaId,
        req.query.type,
        req.user
      );

      controllerLogger.debug('Restaurant media deleted successfully');

      res.status(200).json(ResponseFormatter.success(null, 'Media deleted successfully'));
    } catch (error) {
      controllerLogger.error('Error deleting restaurant media', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  });

  /**
   * Update restaurant location
   * PUT /api/v1/restaurants/:restaurantId/locations/:locationId
   */
  updateRestaurantLocation = asyncHandler(async (req, res, next) => {
    const controllerLogger = this.logger.child({ method: 'updateRestaurantLocation' });

    try {
      controllerLogger.info('Updating restaurant location', {
        restaurantId: req.params.restaurantId,
        locationId: req.params.locationId,
        userId: req.user?.id,
      });

      const updatedLocation = await this.restaurantService.updateRestaurantLocation(
        req.params.restaurantId,
        req.params.locationId,
        req.body,
        req.user
      );

      controllerLogger.debug('Restaurant location updated successfully');

      res
        .status(200)
        .json(
          ResponseFormatter.success({ location: updatedLocation }, 'Location updated successfully')
        );
    } catch (error) {
      controllerLogger.error('Error updating restaurant location', {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  });
}

module.exports = RestaurantController;
