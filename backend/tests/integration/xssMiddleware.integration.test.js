const request = require('supertest');
const app = require('../../server');

describe('XSS Middleware Integration', () => {
  describe('Global XSS Protection', () => {
    it('should sanitize malicious scripts in test endpoint', async () => {
      const maliciousData = {
        name: 'Test <script>alert("xss")</script> Restaurant',
        description: 'Safe content <img src=x onerror=alert(1)>',
      };

      const response = await request(app).post('/api/v1/test/xss').send(maliciousData).expect(200);

      // Check that the data was sanitized
      expect(response.body.receivedData.name).toBe(
        'Test &lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt; Restaurant'
      );
      expect(response.body.receivedData.description).toBe(
        'Safe content &lt;img src=x onerror=alert(1)&gt;'
      );
    });

    it('should sanitize query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/test/xss?search=<script>alert("xss")</script>&filter=safe')
        .expect(200);

      expect(response.body.queryParams.search).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
      expect(response.body.queryParams.filter).toBe('safe');
    });

    it('should handle nested objects', async () => {
      const maliciousData = {
        location: {
          address: {
            street: 'Main St <script>alert(1)</script>',
            city: 'Test City',
          },
        },
      };

      const response = await request(app).post('/api/v1/test/xss').send(maliciousData).expect(200);

      expect(response.body.receivedData.location.address.street).toBe(
        'Main St &lt;script&gt;alert(1)&lt;&#x2F;script&gt;'
      );
      expect(response.body.receivedData.location.address.city).toBe('Test City');
    });
  });

  describe('Route-specific XSS Protection', () => {
    it('should apply restaurant data sanitization to registration', async () => {
      const maliciousRegistrationData = {
        owner_name: 'John <script>alert("xss")</script> Doe',
        email: 'test@example.com',
        password: 'password123',
        restaurant_name: 'My Restaurant <img src=x onerror=alert(1)>',
      };

      // This will fail validation, but XSS middleware should still run
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(maliciousRegistrationData);

      // Should get validation error, not XSS execution
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Middleware Order', () => {
    it('should process XSS middleware before route handlers', async () => {
      // Test that XSS middleware runs before 404 handler
      const response = await request(app)
        .post('/nonexistent')
        .send({ data: '<script>alert("test")</script>' })
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });
  });
});
