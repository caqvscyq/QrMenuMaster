-- Migration: Add comprehensive customization options to all menu items
-- Date: 2025-06-20
-- Description: Updates all existing menu items with appropriate customization options

-- Ensure customization_options column exists
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS customization_options JSON DEFAULT '[]';

-- Update 紅燒牛肉麵 (Red Braised Beef Noodles)
UPDATE menu_items 
SET customization_options = '[
  {
    "id": "spice-level",
    "name": "辣度",
    "type": "radio",
    "options": [
      {"id": "mild", "name": "微辣", "price": 0},
      {"id": "medium", "name": "中辣", "price": 0},
      {"id": "hot", "name": "大辣", "price": 0}
    ]
  },
  {
    "id": "extra-meat",
    "name": "加肉",
    "type": "checkbox",
    "price": 50
  }
]'::json
WHERE name = '紅燒牛肉麵';

-- Update 招牌炒飯 (Signature Fried Rice)
UPDATE menu_items 
SET customization_options = '[
  {
    "id": "spice-level",
    "name": "辣度",
    "type": "radio",
    "options": [
      {"id": "mild", "name": "微辣", "price": 0},
      {"id": "medium", "name": "中辣", "price": 0},
      {"id": "hot", "name": "大辣", "price": 0},
      {"id": "extra-hot", "name": "特辣", "price": 10}
    ]
  },
  {
    "id": "extra-peanuts",
    "name": "加花生",
    "type": "checkbox",
    "price": 15
  }
]'::json
WHERE name = '招牌炒飯';

-- Update 鹽酥雞 (Salt & Pepper Chicken)
UPDATE menu_items 
SET customization_options = '[
  {
    "id": "spice-level",
    "name": "辣度",
    "type": "radio",
    "options": [
      {"id": "mild", "name": "微辣", "price": 0},
      {"id": "medium", "name": "中辣", "price": 0},
      {"id": "hot", "name": "大辣", "price": 0},
      {"id": "extra-hot", "name": "特辣", "price": 5}
    ]
  },
  {
    "id": "extra-crispy",
    "name": "加酥脆",
    "type": "checkbox",
    "price": 20
  },
  {
    "id": "portion-size",
    "name": "份量",
    "type": "radio",
    "options": [
      {"id": "small", "name": "小份", "price": -20},
      {"id": "regular", "name": "正常", "price": 0},
      {"id": "large", "name": "大份", "price": 30}
    ]
  }
]'::json
WHERE name = '鹽酥雞';

-- Update 珍珠奶茶 (Bubble Tea)
UPDATE menu_items 
SET customization_options = '[
  {
    "id": "sweetness",
    "name": "甜度",
    "type": "radio",
    "options": [
      {"id": "no-sugar", "name": "無糖", "price": 0},
      {"id": "less-sweet", "name": "微糖", "price": 0},
      {"id": "half-sweet", "name": "半糖", "price": 0},
      {"id": "regular", "name": "正常糖", "price": 0},
      {"id": "extra-sweet", "name": "全糖", "price": 0}
    ]
  },
  {
    "id": "ice-level",
    "name": "冰塊",
    "type": "radio",
    "options": [
      {"id": "no-ice", "name": "去冰", "price": 0},
      {"id": "less-ice", "name": "微冰", "price": 0},
      {"id": "regular-ice", "name": "正常冰", "price": 0},
      {"id": "extra-ice", "name": "多冰", "price": 0}
    ]
  },
  {
    "id": "extra-pearls",
    "name": "加珍珠",
    "type": "checkbox",
    "price": 10
  },
  {
    "id": "size",
    "name": "杯型",
    "type": "radio",
    "options": [
      {"id": "medium", "name": "中杯", "price": 0},
      {"id": "large", "name": "大杯", "price": 15}
    ]
  }
]'::json
WHERE name = '珍珠奶茶';

-- Update 清燉牛肉麵 (Clear Beef Noodle Soup)
UPDATE menu_items 
SET customization_options = '[
  {
    "id": "noodle-type",
    "name": "麵條種類",
    "type": "radio",
    "options": [
      {"id": "thin", "name": "細麵", "price": 0},
      {"id": "thick", "name": "粗麵", "price": 0},
      {"id": "flat", "name": "寬麵", "price": 5}
    ]
  },
  {
    "id": "extra-meat",
    "name": "加肉",
    "type": "checkbox",
    "price": 50
  },
  {
    "id": "extra-vegetables",
    "name": "加青菜",
    "type": "checkbox",
    "price": 20
  },
  {
    "id": "soup-richness",
    "name": "湯頭濃度",
    "type": "radio",
    "options": [
      {"id": "light", "name": "清淡", "price": 0},
      {"id": "regular", "name": "正常", "price": 0},
      {"id": "rich", "name": "濃郁", "price": 10}
    ]
  }
]'::json
WHERE name = '清燉牛肉麵';

-- Update 餛飩麵 (Wonton Noodles)
UPDATE menu_items 
SET customization_options = '[
  {
    "id": "wonton-count",
    "name": "餛飩數量",
    "type": "radio",
    "options": [
      {"id": "regular", "name": "正常 (6顆)", "price": 0},
      {"id": "extra", "name": "加量 (8顆)", "price": 25},
      {"id": "double", "name": "雙倍 (12顆)", "price": 50}
    ]
  },
  {
    "id": "noodle-type",
    "name": "麵條種類",
    "type": "radio",
    "options": [
      {"id": "thin", "name": "細麵", "price": 0},
      {"id": "thick", "name": "粗麵", "price": 0}
    ]
  },
  {
    "id": "extra-vegetables",
    "name": "加青菜",
    "type": "checkbox",
    "price": 15
  }
]'::json
WHERE name = '餛飩麵';

-- Update 乾拌麵 (Dry Mixed Noodles)
UPDATE menu_items 
SET customization_options = '[
  {
    "id": "sauce-level",
    "name": "醬汁濃度",
    "type": "radio",
    "options": [
      {"id": "light", "name": "清淡", "price": 0},
      {"id": "regular", "name": "正常", "price": 0},
      {"id": "rich", "name": "濃郁", "price": 5}
    ]
  },
  {
    "id": "spice-level",
    "name": "辣度",
    "type": "radio",
    "options": [
      {"id": "no-spice", "name": "不辣", "price": 0},
      {"id": "mild", "name": "微辣", "price": 0},
      {"id": "medium", "name": "中辣", "price": 0},
      {"id": "hot", "name": "大辣", "price": 0}
    ]
  },
  {
    "id": "extra-meat-sauce",
    "name": "加肉燥",
    "type": "checkbox",
    "price": 30
  },
  {
    "id": "add-egg",
    "name": "加蛋",
    "type": "checkbox",
    "price": 15
  }
]'::json
WHERE name = '乾拌麵';

-- Add customizations for any remaining menu items without customizations
UPDATE menu_items
SET customization_options = '[
  {
    "id": "spice-level",
    "name": "辣度",
    "type": "radio",
    "options": [
      {"id": "mild", "name": "微辣", "price": 0},
      {"id": "medium", "name": "中辣", "price": 0},
      {"id": "hot", "name": "大辣", "price": 0}
    ]
  },
  {
    "id": "extra-portion",
    "name": "加量",
    "type": "checkbox",
    "price": 30
  }
]'::json
WHERE customization_options IS NULL OR customization_options = '[]'::json OR customization_options::text = 'null';

-- Ensure no menu items have null customization_options
UPDATE menu_items
SET customization_options = '[]'::json
WHERE customization_options IS NULL;

-- Add specific customizations for drinks that don't have any
UPDATE menu_items
SET customization_options = '[
  {
    "id": "sweetness",
    "name": "甜度",
    "type": "radio",
    "options": [
      {"id": "no-sugar", "name": "無糖", "price": 0},
      {"id": "less-sweet", "name": "微糖", "price": 0},
      {"id": "half-sweet", "name": "半糖", "price": 0},
      {"id": "regular", "name": "正常糖", "price": 0}
    ]
  },
  {
    "id": "ice-level",
    "name": "冰塊",
    "type": "radio",
    "options": [
      {"id": "no-ice", "name": "去冰", "price": 0},
      {"id": "less-ice", "name": "微冰", "price": 0},
      {"id": "regular-ice", "name": "正常冰", "price": 0}
    ]
  },
  {
    "id": "size",
    "name": "杯型",
    "type": "radio",
    "options": [
      {"id": "medium", "name": "中杯", "price": 0},
      {"id": "large", "name": "大杯", "price": 15}
    ]
  }
]'::json
WHERE name LIKE '%茶%' OR name LIKE '%飲%' OR name LIKE '%汁%' OR name LIKE '%水%';
