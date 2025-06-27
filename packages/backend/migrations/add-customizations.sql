-- Migration: Add customization support to menu items, cart items, and order items
-- Date: 2025-06-20

-- Add customization options to menu items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS customization_options JSON DEFAULT '[]';

-- Add customizations and special instructions to cart items
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS customizations JSON DEFAULT '{}',
ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Add customizations and special instructions to order items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS customizations JSON DEFAULT '{}',
ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Update existing menu items with sample customization options
UPDATE menu_items 
SET customization_options = '[
  {
    "id": "spice-level",
    "name": "Spice Level",
    "type": "radio",
    "options": [
      {"id": "mild", "name": "Mild", "price": 0},
      {"id": "medium", "name": "Medium", "price": 0},
      {"id": "hot", "name": "Hot", "price": 0}
    ]
  },
  {
    "id": "extra-portion",
    "name": "Extra Portion",
    "type": "checkbox",
    "price": 30
  }
]'::json
WHERE name LIKE '%麵%' OR name LIKE '%飯%' OR name LIKE '%雞%' OR name LIKE '%牛%';

-- Add specific customizations for popular items
UPDATE menu_items 
SET customization_options = '[
  {
    "id": "spice-level",
    "name": "Spice Level",
    "type": "radio",
    "options": [
      {"id": "mild", "name": "Mild", "price": 0},
      {"id": "medium", "name": "Medium", "price": 0},
      {"id": "hot", "name": "Hot", "price": 0},
      {"id": "extra-hot", "name": "Extra Hot", "price": 10}
    ]
  },
  {
    "id": "extra-meat",
    "name": "Extra Meat",
    "type": "checkbox",
    "price": 50
  },
  {
    "id": "oil-level",
    "name": "Oil Level",
    "type": "radio",
    "options": [
      {"id": "less", "name": "Less", "price": 0},
      {"id": "regular", "name": "Regular", "price": 0},
      {"id": "extra", "name": "Extra", "price": 5}
    ]
  }
]'::json
WHERE name = '紅燒牛肉麵';

UPDATE menu_items 
SET customization_options = '[
  {
    "id": "spice-level",
    "name": "Spice Level",
    "type": "radio",
    "options": [
      {"id": "mild", "name": "Mild", "price": 0},
      {"id": "medium", "name": "Medium", "price": 0},
      {"id": "hot", "name": "Hot", "price": 0},
      {"id": "extra-hot", "name": "Extra Hot", "price": 10}
    ]
  },
  {
    "id": "extra-peanuts",
    "name": "Extra Peanuts",
    "type": "checkbox",
    "price": 15
  }
]'::json
WHERE name = '宮保雞丁';
