-- Seed: Admin user
-- Created: 2025-07-02

INSERT INTO users (email, password, name, role) 
VALUES ('admin@restaurant.com', 
        '$2b$12$Ht0VFCQrwEkt9Il9X7vqEuIX6iEwJpzpUYI5Oxx0k7jxNQQXtdrXK', -- hashed password: 'admin123'
        'Admin User',
        'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, name, role)
VALUES ('customer@example.com', 
        '$2b$12$aIZ5VX2S9KUzXFTBZnIXuei8GCrZq9S5MZLv0ZpfTnDRQnS8KgYfm', -- hashed password: 'customer123'
        'Test Customer',
        'customer')
ON CONFLICT (email) DO NOTHING;
