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
    if (err || !user || user.role !== 'admin') {
      db.close();
      return res.send('Access denied');
    }

    const data = {};
    db.serialize(() => {
      db.all('SELECT * FROM users', [], (err, users) => {
        if (err) return res.send('Error loading users.');
        data.users = users;

        db.all(`
          SELECT orders.id AS order_id, users.username, products.id AS product_id,
                 products.name AS product_name, order_items.quantity, orders.created_at
          FROM orders
          JOIN users ON orders.user_id = users.id
          JOIN order_items ON orders.id = order_items.order_id
          JOIN products ON order_items.product_id = products.id
          ORDER BY orders.created_at DESC
        `, [], (err, rows) => {
          db.close();
          if (err) return res.send('Error loading orders.');

          let html = '<h1>Admin Panel</h1><script src="/script.js" defer></script>';

          // ✅ Users Section (restored)
          html += '<h2>Users</h2><ul>';
          data.users.forEach(u => {
            html += `<li>${u.username} (${u.role})</li>`;
          });
          html += '</ul>';

          // ✅ Orders Section
          let currentOrder = null;
          html += '<h2>Orders</h2><ul>';
          rows.forEach(row => {
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
      res.redirect('/admin');
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
      res.redirect('/admin');
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
      res.redirect('/admin');
    }
  );
});







module.exports = router;
