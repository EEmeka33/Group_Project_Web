// routes/cart.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

function getDB() {
  return new sqlite3.Database('./db/database.db');
}

router.get('/cart', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const db = new sqlite3.Database('./db/database.db');

  db.serialize(() => {
    db.all('SELECT * FROM orders WHERE user_id = ?', [req.session.userId], (err, orders) => {
      if (err || !orders || orders.length === 0) {
        db.close();
        return res.send('<h1>Your cart is empty.</h1><script src="/script.js" defer></script>');
      }

      let html = `
        <header>
          <h1>Your Cart & Orders</h1>
          <script src="/script.js" defer></script>
        </header>`;

      let pending = orders.find(o => Number(o.created_at) === 0);
      let completeOrders = orders.filter(o => Number(o.created_at) !== 0);

      const renderOrderItems = (orderId, title, cb) => {
        db.all(`
          SELECT products.id, products.name, products.price, order_items.quantity
          FROM order_items
          JOIN products ON order_items.product_id = products.id
          WHERE order_items.order_id = ?
        `, [orderId], (err, items) => {
          if (err || !items || items.length === 0) {
            html += `<h2>${title}</h2><p>No items.</p>`;
            return cb();
          }

          html += `<h2>${title}</h2><ul>`;
          items.forEach(item => {
            html += `
              <li>${item.name} - $${item.price} ×
              <form method="POST" action="/update-quantity" style="display:inline-flex; align-items:center; gap:4px;">
                <input type="hidden" name="id" value="${item.id}">
                <input type="number" name="quantity" value="${item.quantity}" min="1" style="width:30px;">
                <button type="submit" style="padding:2px 6px;">↺</button>
              </form>
              <form method="POST" action="/remove-from-cart" style="display:inline;">
                <input type="hidden" name="id" value="${item.id}">
                <button type="submit">Remove</button>
              </form>
              </li>`;
          });
          html += '</ul>';

          if (title === 'Your Cart') {
            html += `
              <form method="POST" action="/clear-cart">
                <button type="submit">Clear Cart</button>
              </form>
              <form method="POST" action="/place-order">
                <button type="submit">Place Order</button>
              </form>`;
          }

          cb();
        });
      };

      const tasks = [];

      if (pending) {
        tasks.push(cb => renderOrderItems(pending.id, 'Your Cart', cb));
      }

      completeOrders.forEach((order, i) => {
        tasks.push(cb => renderOrderItems(order.id, 'Placed Order ' + (i + 1), cb));
      });

      // Sequentially execute async item rendering
      let i = 0;
      const next = () => {
        if (i < tasks.length) {
          tasks[i++](next);
        } else {
          db.close();
          res.send(html);
        }
      };
      next();
    });
  });
});


// Add to cart
// Add to cart: add or update quantity
router.post('/add-to-cart', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const { id, name, price } = req.body;
  const db = getDB();

  db.serialize(() => {
    db.get('SELECT id FROM orders WHERE user_id = ? AND created_at = 0', [req.session.userId], (err, order) => {
      if (err) {
        db.close();
        return res.send('Error checking cart order.');
      }

      const insertOrUpdateItem = (orderId) => {
        db.get('SELECT quantity FROM order_items WHERE order_id = ? AND product_id = ?', [orderId, id], (err, row) => {
          if (row) {
            db.run('UPDATE order_items SET quantity = quantity + 1 WHERE order_id = ? AND product_id = ?', [orderId, id], (err) => {
              db.close();
              if (err) return res.send('Error updating item.');
              res.redirect('/products');
            });
          } else {
            db.run('INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)', [orderId, id, 1], (err) => {
              db.close();
              if (err) return res.send('Error adding item to cart.');
              res.redirect('/products');
            });
          }
        });
      };

      if (order) {
        insertOrUpdateItem(order.id);
      } else {
        db.run('INSERT INTO orders (user_id, total, created_at) VALUES (?, ?, ?)', [req.session.userId, 0, 0], function (err) {
          if (err) {
            db.close();
            return res.send('Error creating cart order.');
          }
          insertOrUpdateItem(this.lastID);
        });
      }
    });
  });
});

router.post('/update-quantity', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const { id, quantity } = req.body;
  const db = getDB();

  db.serialize(() => {
    db.get('SELECT id FROM orders WHERE user_id = ? AND created_at = 0', [req.session.userId], (err, order) => {
      if (err || !order) {
        db.close();
        return res.redirect('/cart');
      }

      db.run('UPDATE order_items SET quantity = ? WHERE order_id = ? AND product_id = ?', [quantity, order.id, id], (err) => {
        db.close();
        if (err) return res.send('Error updating quantity.');
        res.redirect('/cart');
      });
    });
  });
});


// Remove from cart
router.post('/remove-from-cart', (req, res) => {
  const itemId = parseInt(req.body.id);
  const db = getDB();

  db.serialize(() => {
    db.get('SELECT id FROM orders WHERE user_id = ? AND created_at = 0', [req.session.userId], (err, order) => {
      if (err || !order) {
        db.close();
        return res.redirect('/cart');
      }

      db.run('DELETE FROM order_items WHERE order_id = ? AND product_id = ?', [order.id, itemId], (err) => {
        db.close();
        if (err) return res.send('Error removing item from cart.');
        res.redirect('/cart');
      });
    });
  });
});

router.post('/clear-cart', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const db = getDB();

  db.serialize(() => {
    // Find current cart order (created_at = 0)
    db.get('SELECT id FROM orders WHERE user_id = ? AND created_at = 0', [req.session.userId], (err, order) => {
      if (err || !order) {
        db.close();
        return res.redirect('/cart');
      }

      // Delete all order_items for that order
      db.run('DELETE FROM order_items WHERE order_id = ?', [order.id], (err) => {
        db.close();
        if (err) return res.send('Error clearing cart.');
        res.redirect('/cart');
      });
    });
  });
});

// Place Order: finalize the cart by setting created_at = current timestamp
router.post('/place-order', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const db = getDB();
  const now = new Date().toISOString();

  db.serialize(() => {
    db.run(
      'UPDATE orders SET created_at = ? WHERE user_id = ? AND created_at = 0',
      [now, req.session.userId],
      function (err) {
        db.close();
        if (err) return res.send('Error placing order.');
        res.redirect('/cart');
      }
    );
  });
});


module.exports = router;

