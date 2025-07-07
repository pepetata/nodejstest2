const { logger } = require('../utils/logger');

const versionLogger = logger.child({ middleware: 'apiVersioning' });

/**
 * API Versioning Middleware
 * Handles API version routing and backward compatibility
 */
class ApiVersioningMiddleware {
  /**
   * Extract API version from request
   * Supports version extraction from:
   * 1. URL path (/api/v1/...)
   * 2. Accept header (application/json;version=1)
   * 3. Custom header (X-API-Version)
   * 4. Query parameter (?version=1)
   */
  static extractVersion(req, res, next) {
    let version = '1'; // Default to v1

    // 1. Check URL path for version
    const pathMatch = req.path.match(/^\/api\/v(\d+)\//);
    if (pathMatch) {
      version = pathMatch[1];
    }
    // 2. Check Accept header
    else if (req.headers.accept) {
      const acceptMatch = req.headers.accept.match(/version=(\d+)/);
      if (acceptMatch) {
        version = acceptMatch[1];
      }
    }
    // 3. Check custom header
    else if (req.headers['x-api-version']) {
      version = req.headers['x-api-version'];
    }
    // 4. Check query parameter
    else if (req.query.version) {
      version = req.query.version;
    }

    // Validate version
    const supportedVersions = ['1'];
    if (!supportedVersions.includes(version)) {
      versionLogger.warn('Unsupported API version requested', {
        requestedVersion: version,
        supportedVersions,
        ip: req.ip,
        path: req.path,
      });

      return res.status(400).json({
        error: 'Unsupported API version',
        message: `API version ${version} is not supported. Supported versions: ${supportedVersions.join(', ')}`,
        supportedVersions,
        timestamp: new Date().toISOString(),
      });
    }

    // Add version to request object
    req.apiVersion = version;

    // Add version to response headers
    res.set('X-API-Version', version);

    versionLogger.debug('API version extracted', {
      version,
      path: req.path,
      method: req.method,
    });

    next();
  }

  /**
   * Version-specific middleware factory
   * Returns middleware that only applies to specific API versions
   */
  static forVersion(version, middleware) {
    return (req, res, next) => {
      if (req.apiVersion === version) {
        return middleware(req, res, next);
      }
      next();
    };
  }

  /**
   * Deprecation warning middleware
   * Adds deprecation warnings to response headers for older API versions
   */
  static addDeprecationWarnings(req, res, next) {
    const version = req.apiVersion;

    // Add deprecation warnings for older versions
    if (version === '1') {
      // Currently v1 is the only version, so no deprecation warning
      // When v2 is released, add deprecation warning here
    }

    next();
  }

  /**
   * Version compatibility middleware
   * Handles backward compatibility transformations
   */
  static handleCompatibility(req, res, next) {
    const version = req.apiVersion;

    // Store original res.json to wrap it
    const originalJson = res.json;

    res.json = function (data) {
      let transformedData = data;

      // Apply version-specific transformations
      switch (version) {
        case '1':
          // v1 transformations (if needed)
          transformedData = ApiVersioningMiddleware.transformForV1(data);
          break;
        default:
          // No transformation needed
          break;
      }

      // Add version info to response
      if (
        transformedData &&
        typeof transformedData === 'object' &&
        !Array.isArray(transformedData)
      ) {
        transformedData._version = version;
        transformedData._timestamp = new Date().toISOString();
      }

      return originalJson.call(this, transformedData);
    };

    next();
  }

  /**
   * Transform data for API v1 compatibility
   */
  static transformForV1(data) {
    // Add any v1-specific transformations here
    // For now, return data as-is since v1 is current
    return data;
  }

  /**
   * API documentation version routing
   */
  static routeDocumentation(req, res, next) {
    const version = req.apiVersion;

    // Add documentation links to responses
    if (req.path.includes('/api/') && !req.path.includes('/docs')) {
      res.set('Link', `</api/v${version}/docs>; rel="documentation"`);
    }

    next();
  }

  /**
   * Complete versioning middleware stack
   * Combines all versioning middleware in the correct order
   */
  static apply() {
    return [
      ApiVersioningMiddleware.extractVersion,
      ApiVersioningMiddleware.addDeprecationWarnings,
      ApiVersioningMiddleware.handleCompatibility,
      ApiVersioningMiddleware.routeDocumentation,
    ];
  }
}

module.exports = ApiVersioningMiddleware;
