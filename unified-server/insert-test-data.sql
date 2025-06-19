-- Insert test data for QR Menu system

-- Insert shop
INSERT INTO shops (name, address, phone) VALUES 
('Afly Restaurant', '123 Main St', '555-0123')
ON CONFLICT (name) DO NOTHING;

-- Insert categories
INSERT INTO categories (name, shop_id) VALUES 
('麵食類', 1),
('飯類', 1),
('開胃菜', 1),
('飲料', 1)
ON CONFLICT DO NOTHING;

-- Insert menu items
INSERT INTO menu_items (name, description, price, category_id, shop_id, image_url, rating, review_count, is_popular, is_available, status) VALUES 
('紅燒牛肉麵', '精選牛腱肉，搭配濃郁湯頭', 280.00, 1, 1, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624', 4.8, 156, true, true, 'available'),
('招牌炒飯', '蛋香四溢，配菜豐富', 180.00, 2, 1, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b', 4.6, 89, true, true, 'available'),
('鹽酥雞', '酥脆外皮，多汁內餡', 120.00, 3, 1, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58', 4.7, 234, true, true, 'available'),
('珍珠奶茶', 'Q彈珍珠，香濃奶茶', 65.00, 4, 1, 'https://images.unsplash.com/photo-1570197788417-0e82375c9371', 4.4, 145, false, true, 'available')
ON CONFLICT DO NOTHING;

-- Insert desks
INSERT INTO desks (shop_id, name, status, capacity) VALUES 
(1, 'A1', 'available', 4),
(1, 'A2', 'available', 4),
(1, 'B1', 'available', 4),
(1, 'B2', 'available', 4),
(1, 'C1', 'available', 4)
ON CONFLICT DO NOTHING;

-- Insert admin user (password: admin123, hashed with bcrypt)
INSERT INTO users (username, password, role, email, shop_id) VALUES 
('admin', '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ', 'admin', 'admin@restaurant.com', 1)
ON CONFLICT (username) DO NOTHING;

-- Insert test sessions
INSERT INTO sessions (id, table_number, shop_id, expires_at, metadata) VALUES 
('session-A1-' || EXTRACT(EPOCH FROM NOW())::bigint || '-test001', 'A1', 1, NOW() + INTERVAL '4 hours', '{"test": true}'),
('session-B2-' || EXTRACT(EPOCH FROM NOW())::bigint || '-test002', 'B2', 1, NOW() + INTERVAL '4 hours', '{"test": true}')
ON CONFLICT (id) DO NOTHING;
