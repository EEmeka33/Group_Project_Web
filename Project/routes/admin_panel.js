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


// Admin view: see all orders with user and products
router.get('/admin', (req, res) => {
  if (!req.session.userId) return res.send('Unauthorized.');
  const db = getDB();
  db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user || user.role !== 'admin') {
      db.close();
      return res.send('Access denied.');
    }

    db.all(`
      SELECT orders.id AS order_id, users.username, products.name AS product_name, order_items.quantity, orders.created_at, products.price
      FROM orders
      JOIN users ON orders.user_id = users.id
      JOIN order_items ON orders.id = order_items.order_id
      JOIN products ON products.id = order_items.product_id
      ORDER BY orders.created_at DESC
    `, [], (err, rows) => {
      db.close();
      if (err) return res.send('Error loading orders.');

      let html = '<h1>All Orders</h1><script src="/script.js" defer></script>';
      if (rows.length === 0) {
        html += '<p>No orders found.</p>';
      } else {
        let currentOrder = null;
        html += '<ul>';
        rows.forEach(row => {
          if (currentOrder !== row.order_id) {
            if (currentOrder !== null) html += '</ul>';
            html += `<li><strong>Order #${row.order_id}</strong> by ${row.username} at ${row.created_at}<ul>`;
            currentOrder = row.order_id;
          }
          html += `
              <li>${row.product_name} - $${row.price} ×
              <form method="POST" action="/update-quantity" style="display:inline-flex; align-items:center; gap:4px;">
                <input type="hidden" name="id" value="${row.id}">
                <input type="number" name="quantity" value="${row.quantity}" min="1" style="width:30px;">
                <button type="submit" style="padding:2px 6px;">↺</button>
              </form>
              <form method="POST" action="/remove-from-cart" style="display:inline;">
                <input type="hidden" name="id" value="${row.id}">
                <button type="submit">Remove</button>
              </form>
              </li>`;
        });
        html += '</ul></ul>';
      }

      res.send(html);
    });
  });
});





module.exports = router;
