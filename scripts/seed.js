require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Product = require('../models/Product');

const sampleProducts = [
  {
    name: 'Sony WH-1000XM5 Wireless Headphones',
    sku: 'ELEC-SNY-001',
    description: 'Industry-leading noise canceling headphones with Auto NC Optimizer and 30-hour battery life.',
    category: 'Electronics',
    price: 29990.00,
    costPrice: 22000.00,
    quantityInStock: 25,
    lowStockThreshold: 8,
    tags: ['audio', 'wireless', 'anc', 'bluetooth'],
    supplier: { name: 'Sony India Pvt Ltd', contactEmail: 'supply@sony.co.in' },
  },
  {
    name: 'Apple MacBook Air M3 (13-inch, 16GB)',
    sku: 'ELEC-APL-002',
    description: 'Ultra-thin, lightweight laptop powered by the Apple M3 chip with 18 hours of battery life.',
    category: 'Electronics',
    price: 114900.00,
    costPrice: 95000.00,
    quantityInStock: 12,
    lowStockThreshold: 5,
    tags: ['laptop', 'apple', 'm3', 'macos'],
    supplier: { name: 'Apple India Authorized Distributor', contactEmail: 'orders@apple-dist.in' },
  },
  {
    name: 'Logitech MX Master 3S Wireless Mouse',
    sku: 'ELEC-LOG-003',
    description: 'Performance wireless ergonomic mouse with 8K DPI sensor and quiet clicks.',
    category: 'Electronics',
    price: 8995.00,
    costPrice: 6200.00,
    quantityInStock: 4, // Low stock trigger
    lowStockThreshold: 10,
    tags: ['mouse', 'ergonomic', 'office', 'peripherals'],
    supplier: { name: 'Logitech India Distribution', contactEmail: 'b2b@logitech.in' },
  },
  {
    name: 'Raymond Premium Merino Wool Sweater',
    sku: 'CLTH-MRN-101',
    description: '100% fine Merino wool knit sweater crafted for cold weather warmth and comfort.',
    category: 'Clothing',
    price: 2999.00,
    costPrice: 1400.00,
    quantityInStock: 50,
    lowStockThreshold: 15,
    tags: ['apparel', 'winter', 'wool', 'menswear'],
    supplier: { name: 'Raymond Textiles Ltd', contactEmail: 'info@raymond.in' },
  },
  {
    name: 'Chemex Pour-Over Glass Coffee Brewer',
    sku: 'HOME-CHM-201',
    description: 'Classic eight-cup pour-over coffee brewer crafted from non-porous Borosilicate glass.',
    category: 'Home & Kitchen',
    price: 4499.00,
    costPrice: 2500.00,
    quantityInStock: 18,
    lowStockThreshold: 5,
    tags: ['kitchen', 'coffee', 'pour-over', 'glassware'],
    supplier: { name: 'Barista Supplies India', contactEmail: 'support@baristasupplies.in' },
  },
  {
    name: 'InstaCuppa Stainless Steel French Press',
    sku: 'HOME-FRP-202',
    description: 'Double-walled vacuum insulated stainless steel coffee maker that keeps brews hot for hours.',
    category: 'Home & Kitchen',
    price: 1699.00,
    costPrice: 850.00,
    quantityInStock: 0, // Out of stock trigger
    lowStockThreshold: 6,
    tags: ['coffee', 'insulated', 'stainless-steel'],
    supplier: { name: 'InstaCuppa Direct', contactEmail: 'sales@instacuppa.in' },
  },
  {
    name: 'Designing Data-Intensive Applications',
    sku: 'BOOK-DDIA-301',
    description: 'The definitive guide to the architecture of modern data systems by Martin Kleppmann.',
    category: 'Books',
    price: 2150.00,
    costPrice: 1200.00,
    quantityInStock: 35,
    lowStockThreshold: 10,
    tags: ['software', 'distributed-systems', 'database', 'architecture'],
    supplier: { name: "Shroff Publishers & Dist. Pvt. Ltd.", contactEmail: 'books@shroff.in' },
  },
  {
    name: 'Milton Thermosteel 1000ml Bottle',
    sku: 'SPRT-MLT-401',
    description: 'Double-walled vacuum insulation keeps beverages hot or cold for up to 24 hours.',
    category: 'Sports',
    price: 999.00,
    costPrice: 520.00,
    quantityInStock: 42,
    lowStockThreshold: 12,
    tags: ['fitness', 'hydration', 'sports', 'outdoor'],
    supplier: { name: 'Hamilton Housewares Pvt Ltd', contactEmail: 'sales@milton.in' },
  },
];

const seedDatabase = async () => {
  try {
    console.log('[Seeder] Connecting to MongoDB...');
    const conn = await connectDB();

    if (!conn) {
      console.error('[Seeder] Could not connect to MongoDB. Aborting seed operation.');
      process.exit(1);
    }

    console.log('[Seeder] Clearing existing products...');
    await Product.deleteMany({});

    console.log(`[Seeder] Inserting ${sampleProducts.length} sample products...`);
    const inserted = await Product.create(sampleProducts);

    console.log(`[Seeder] Successfully seeded ${inserted.length} products!`);
    console.log('[Seeder] Disconnecting from database...');
    await mongoose.connection.close();
    console.log('[Seeder] Done.');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]', error);
    process.exit(1);
  }
};

seedDatabase();
