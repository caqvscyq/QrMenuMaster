-- Simple test order creation
INSERT INTO orders (shop_id, desk_id, session_id, status, paid, subtotal, service_fee, total, customer_name, notes) 
VALUES (1, 7, 'session-test-b2', 'pending', false, '25.98', '2.60', '28.58', 'Test Customer for Table B2', 'Order tracking test');

-- Get the order ID
\set order_id (SELECT id FROM orders WHERE desk_id = 7 ORDER BY id DESC LIMIT 1)

-- Add order item without menu_item_id (since it's nullable)
INSERT INTO order_items (order_id, quantity, price, item_name) 
VALUES (currval('orders_id_seq'), 1, '12.99', 'Test Caesar Salad'),
       (currval('orders_id_seq'), 1, '15.99', 'Test Grilled Chicken');

-- Check the result
SELECT 'Orders for desk 7:' as info;
SELECT o.id, o.desk_id, o.status, o.total, o.customer_name, 
       array_agg(oi.item_name || ' x' || oi.quantity) as items
FROM orders o 
LEFT JOIN order_items oi ON o.id = oi.order_id 
WHERE o.desk_id = 7 
GROUP BY o.id, o.desk_id, o.status, o.total, o.customer_name; 