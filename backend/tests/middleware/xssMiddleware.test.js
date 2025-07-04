const XSSMiddleware = require('../../src/middleware/xssMiddleware');

describe('XSSMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      path: '/test',
      method: 'POST',
    };
    res = {};
    next = jest.fn();
  });

  describe('sanitizeAll', () => {
    it('should sanitize malicious script in request body', () => {
      req.body = {
        name: 'Test <script>alert("xss")</script> Location',
        description: 'A nice place <img src=x onerror=alert(1)>',
      };

      XSSMiddleware.sanitizeAll(req, res, next);

      expect(req.body.name).toBe(
        'Test &lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt; Location'
      );
      expect(req.body.description).toBe('A nice place &lt;img src=x onerror=alert(1)&gt;');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize query parameters', () => {
      req.query = {
        search: '<script>alert("xss")</script>',
        filter: 'javascript:alert(1)',
      };

      XSSMiddleware.sanitizeAll(req, res, next);

      expect(req.query.search).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(req.query.filter).toBe('javascript:alert(1)'); // Basic sanitization doesn't remove javascript:
      expect(next).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      req.body = {
        location: {
          address: {
            street: 'Main St <script>alert(1)</script>',
            city: 'Test City',
          },
        },
      };

      XSSMiddleware.sanitizeAll(req, res, next);

      expect(req.body.location.address.street).toBe(
        'Main St &lt;script&gt;alert(1)&lt;&#x2F;script&gt;'
      );
      expect(req.body.location.address.city).toBe('Test City');
      expect(next).toHaveBeenCalled();
    });

    it('should handle arrays', () => {
      req.body = {
        features: ['Feature 1', '<script>alert(1)</script>', 'Feature 3'],
      };

      XSSMiddleware.sanitizeAll(req, res, next);

      expect(req.body.features[0]).toBe('Feature 1');
      expect(req.body.features[1]).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
      expect(req.body.features[2]).toBe('Feature 3');
      expect(next).toHaveBeenCalled();
    });

    it('should handle null and undefined values', () => {
      req.body = {
        name: 'Test',
        description: null,
        address: undefined,
      };

      XSSMiddleware.sanitizeAll(req, res, next);

      expect(req.body.name).toBe('Test');
      expect(req.body.description).toBeNull();
      expect(req.body.address).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should handle non-string values', () => {
      req.body = {
        name: 'Test',
        count: 42,
        active: true,
        tags: ['tag1', 'tag2'],
      };

      XSSMiddleware.sanitizeAll(req, res, next);

      expect(req.body.name).toBe('Test');
      expect(req.body.count).toBe(42);
      expect(req.body.active).toBe(true);
      expect(req.body.tags).toEqual(['tag1', 'tag2']);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('sanitizeLocationData', () => {
    it('should sanitize location-specific fields', () => {
      req.body = {
        name: 'Location <script>alert(1)</script>',
        address_street: '123 Main St <img src=x onerror=alert(1)>',
        selected_features: ['WiFi', '<script>bad</script>'],
      };

      XSSMiddleware.sanitizeLocationData(req, res, next);

      // The sanitizeLocationData uses XSSSanitizer.sanitizeName which removes scripts entirely
      expect(req.body.name).toBe('Location');
      expect(req.body.address_street).toBe('123 Main St &lt;img src=x alert(1)&gt;');
      expect(req.body.selected_features[1]).toBe('&lt;script&gt;bad&lt;&#x2F;script&gt;');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle errors and call next with error', () => {
      // Simulate an error by passing invalid data
      req.body = null;
      Object.defineProperty(req, 'body', {
        get: () => {
          throw new Error('Test error');
        },
      });

      XSSMiddleware.sanitizeAll(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
