// routes/admin_panel.js
const express = require('express');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

function getDB() {
  return new sqlite3.Database('./db/database.db');
}

function isAdmin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');

  const db = getDB();
  db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    db.close();
    if (err || !user || user.role !== 'admin') {
      return res.status(403).send('Access denied.');
    }
    next();
  });
}


// Display Admin Panel
router.get('/admin', (req, res) => {
  if (!req.session.userId) return res.send('Unauthorized');
  const db = getDB();
  db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    db.close();
    if (err || !user || user.role !== 'admin') return res.send('Access denied');
    res.send(`
      <h1>Admin Dashboard</h1>
      <script src="/script.js" defer></script>
      <ul>
        <li><a href="/admin/users">Manage Users</a></li>
        <li><a href="/admin/products">Manage Products</a></li>
        <li><a href="/admin/orders">Manage Orders</a></li>
      </ul>
    `);
  });
});




// Handle stock updates
router.post('/admin/update-stock', (req, res) => {
  const { id, stock } = req.body;

  if (!req.session.userId) return res.send('Unauthorized');

  const db = getDB();
  db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user || user.role !== 'admin') {
      db.close();
      return res.send('Access denied');
    }

    db.run('UPDATE products SET stock = ? WHERE id = ?', [stock, id], (err) => {
      db.close();
      if (err) return res.send('Error updating stock');
      res.redirect('/admin/products');
    });
  });
});

router.post('/admin/update-order-item', (req, res) => {
  const { order_id, product_id, quantity } = req.body;
  const db = getDB();

  db.run(
    'UPDATE order_items SET quantity = ? WHERE order_id = ? AND product_id = ?',
    [quantity, order_id, product_id],
    (err) => {
      db.close();
      if (err) return res.send('Error updating order item.');
      res.redirect('/admin/orders');
    }
  );
});


router.post('/admin/delete-order-item', (req, res) => {
  const { order_id, product_id } = req.body;
  const db = getDB();

  db.run(
    'DELETE FROM order_items WHERE order_id = ? AND product_id = ?',
    [order_id, product_id],
    (err) => {
      db.close();
      if (err) return res.send('Error deleting order item.');
      res.redirect('/admin/orders');
    }
  );
});


router.get('/admin/users', (req, res) => {
  if (!req.session.userId) return res.send('Unauthorized');
  const db = getDB();
  db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user || user.role !== 'admin') {
      db.close();
      return res.send('Access denied');
    }

    db.all('SELECT * FROM users', [], (err, users) => {
      db.close();
      if (err) return res.send('Error loading users');
      let html = `<h1>Manage Users</h1>
                         <script src="/script.js" defer></script>
                         <a href="/admin">← Back</a><ul>`;
      users.forEach(u => {
        html += `<li>${u.username} (${u.role}) - ${u.address}</li>`;
      });
      html += '</ul>';
      res.send(html);
    });
  });
});


router.get('/admin/products', (req, res) => {
  if (!req.session.userId) return res.send('Unauthorized');
  const db = getDB();
  db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user || user.role !== 'admin') {
      db.close();
      return res.send('Access denied');
    }

    db.all('SELECT * FROM products', [], (err, products) => {
      db.close();
      if (err) return res.send('Error loading products');
      let html = `<h1>Manage Products</h1>
                         <script src="/script.js" defer></script>
                         <a href="/admin">← Back</a><ul>`;
      products.forEach(p => {
        html += `
          <li>${p.name} - Stock:
            <form method="POST" action="/admin/update-stock" style="display:inline-flex; align-items:center; gap:4px;">
              <input type="hidden" name="id" value="${p.id}">
              <input type="number" name="stock" value="${p.stock || 0}" min="0" style="width:30px;">
              <button type="submit">↺</button>
            </form>
             - Volume:
            <form method="POST" action="/admin/update-volume" style="display:inline;">
              <input type="hidden" name="id" value="${p.id}">
              <input type="number" name="volume" value="${p.volume || 0}" min="0" style="width:30px;">
              <button type="submit">↺</button>
            </form>
             - Price:
            <form method="POST" action="/admin/update-price" style="display:inline;">
              <input type="hidden" name="id" value="${p.id}">
              <input type="number" name="price" value="${p.price}" min="0" step="0.01" style="width:70px;">
              <button type="submit">↺</button>
            </form>
            <form method="POST" action="/admin/delete-product" style="display:inline;">
              <input type="hidden" name="id" value="${p.id}">
              <button type="submit">❌</button>
            </form>
          </li>`;
      });
      html += '</ul>';
      res.send(html);
    });
  });
});


router.get('/admin/orders', (req, res) => {
  if (!req.session.userId) return res.send('Unauthorized');
  const db = getDB();
  db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user || user.role !== 'admin') {
      db.close();
      return res.send('Access denied');
    }

    db.all(`
      SELECT orders.id AS order_id, users.username, products.id AS product_id,
             products.name AS product_name, order_items.quantity, orders.created_at
      FROM orders
      JOIN users ON orders.user_id = users.id
      JOIN order_items ON orders.id = order_items.order_id
      JOIN products ON order_items.product_id = products.id
      ORDER BY orders.created_at DESC
    `, [], (err, orders) => {
      db.close();
      if (err) return res.send('Error loading orders');
      let html = `<h1>Manage Orders</h1>
                         <script src="/script.js" defer></script>
                         <a href="/admin">← Back</a><ul>`;
      let currentOrder = null;
      orders.forEach(row => {
        if (currentOrder !== row.order_id) {
          if (currentOrder !== null) html += '</ul>';
          html += `<li><strong>Order #${row.order_id}</strong> by ${row.username} at ${row.created_at}<ul>`;
          currentOrder = row.order_id;
        }
        html += `
          <li>${row.product_name}
            <form method="POST" action="/admin/update-order-item" style="display:inline-flex; gap:4px;">
              <input type="hidden" name="order_id" value="${row.order_id}">
              <input type="hidden" name="product_id" value="${row.product_id}">
              <input type="number" name="quantity" value="${row.quantity}" min="1" style="width:30px;">
              <button type="submit">↺</button>
            </form>
            <form method="POST" action="/admin/delete-order-item" style="display:inline;">
              <input type="hidden" name="order_id" value="${row.order_id}">
              <input type="hidden" name="product_id" value="${row.product_id}">
              <button type="submit">❌</button>
            </form>
          </li>`;
      });
      html += '</ul></ul>';
      res.send(html);
    });
  });
});







module.exports = router;
