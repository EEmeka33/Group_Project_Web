const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/database.db');

const products = [
  {
    name: 'Smartphone',
    description: 'Latest Android phone with amazing features.',
    price: 699.99,
    image: '',
    category: 'Electronics'
  },
  {
    name: 'Wireless Headphones',
    description: 'Noise-cancelling over-ear headphones.',
    price: 199.99,
    image: '',
    category: 'Electronics'
  },
  {
    name: 'Running Shoes',
    description: 'Comfortable shoes for everyday running.',
    price: 89.99,
    image: '',
    category: 'Sportswear'
  },
  {
    name: 'Coffee Maker',
    description: 'Brew coffee like a pro at home.',
    price: 49.99,
    image: '',
    category: 'Home Appliances'
  },
  {
    name: 'Backpack',
    description: 'Durable backpack with multiple compartments.',
    price: 59.99,
    image: '',
    category: 'Accessories'
  }
];

db.serialize(() => {
  const stmt = db.prepare('INSERT INTO products (name, description, price, image, category) VALUES (?, ?, ?, ?, ?)');
  products.forEach(p => {
    stmt.run(p.name, p.description, p.price, p.image, p.category);
  });
  stmt.finalize();
});

db.close();
console.log("Dummy product data inserted.");
