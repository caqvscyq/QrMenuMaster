-- Create all necessary tables for the QR Menu system

-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  email TEXT,
  phone TEXT,
  shop_id INTEGER REFERENCES shops(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create desks table
CREATE TABLE IF NOT EXISTS desks (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER REFERENCES shops(id) NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
  capacity INTEGER DEFAULT 4,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  shop_id INTEGER REFERENCES shops(id) NOT NULL
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INTEGER REFERENCES categories(id) NOT NULL,
  shop_id INTEGER REFERENCES shops(id) NOT NULL,
  image_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'discontinued')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  table_number TEXT NOT NULL,
  desk_id INTEGER REFERENCES desks(id),
  shop_id INTEGER REFERENCES shops(id) NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'expired', 'completed')),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_activity TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  metadata JSON DEFAULT '{}'
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) NOT NULL,
  menu_item_id INTEGER REFERENCES menu_items(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  desk_id INTEGER REFERENCES desks(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  shop_id INTEGER REFERENCES shops(id) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) NOT NULL,
  menu_item_id INTEGER REFERENCES menu_items(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create shop_admins table
CREATE TABLE IF NOT EXISTS shop_admins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  shop_id INTEGER REFERENCES shops(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_table_number ON sessions(table_number);
CREATE INDEX IF NOT EXISTS idx_sessions_shop_id ON sessions(shop_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_desk_id ON cart_items(desk_id);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_shop_id ON menu_items(shop_id);
