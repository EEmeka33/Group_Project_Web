// routes/payment.js
const express = require('express');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

//for image upload
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

function getDB() {
  return new sqlite3.Database('./db/database.db');
}



router.post('/checkout', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const db = getDB();

  // First get user address
  db.get('SELECT id, address FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user) {
      db.close();
      return res.send('User not found.');
    }

    const address = user.address;

    db.get('SELECT id FROM orders WHERE user_id = ? AND created_at = 0', [req.session.userId], (err, order) => {
      if (err || !order) {
        db.close();
        return res.send('<h1>Your cart is empty.</h1><script src="/script.js" defer></script>');
      }

      db.all(`
        SELECT products.name, products.price, order_items.quantity
        FROM order_items
        JOIN products ON order_items.product_id = products.id
        WHERE order_items.order_id = ?
      `, [order.id], (err, items) => {
        db.close();
        if (err) return res.send('Error retrieving cart items.');

        let total = items.reduce((sum, item) => sum + item.price * item.quantity, 25); // +25 for shipping/tax

        let html = `
          <main>
          <h1>Checkout</h1>
          <script src="/script.js" defer></script>
          <link rel="stylesheet" href="/style.css">
          <form method="POST" action="/pay">
            <ul>
              ${items.map(i => `<li>${i.name} × ${i.quantity} — $${(i.price * i.quantity).toFixed(2)}</li>`).join('')}
            </ul>
            <p>Shipping & Tax: $25.00</p>
            <p><strong>Total: $${total.toFixed(2)}</strong></p>
        `;

        // Address section
        if (address) {
          html += `
            <h3>Shipping Address</h3>
            <p>${address}</p>
            <input type="hidden" name="useSavedAddress" value="yes">
          `;
        } else {
          html += `
            <h3>Add a Shipping Address</h3>
            <label>Address:<input type="text" name="newAddress" required></label><br>
          `;
        }

        // Payment fields
        html += `
            <h3>Mock Payment Info</h3>
            <label>Card Number: <input name="card" required></label><br>
            <label>Expiry: <input name="expiry" required></label><br>
            <label>CVC: <input name="cvc" required></label><br>
            <button type="submit">Pay Now</button>
          </form>
          </main>
        `;

        res.send(html);
      });
    });
  });
});



router.post('/pay', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const { card, expiry, cvc, newAddress, useSavedAddress } = req.body;
  if (!card || !expiry || !cvc) return res.send('Missing payment information.');

  const db = getDB();
  const now = new Date().toISOString();

  db.serialize(() => {
    db.get('SELECT id, address FROM users WHERE id = ?', [req.session.userId], (err, user) => {
      if (err || !user) {
        db.close();
        return res.send('User not found.');
      }

      const userAddress = user.address || '';
      const addressToUse = useSavedAddress === 'yes' ? userAddress : newAddress;

      if (!addressToUse) {
        db.close();
        return res.send('No address provided.');
      }

      // Update user's address if using a new one
      if (useSavedAddress !== 'yes' && newAddress) {
        db.run('UPDATE users SET address = ? WHERE id = ?', [newAddress, req.session.userId], (err) => {
          if (err) console.error('Failed to update user address:', err.message);
        });
      }

      db.get('SELECT id FROM orders WHERE user_id = ? AND created_at = 0', [req.session.userId], (err, order) => {
        if (err || !order) {
          db.close();
          return res.send('No active cart.');
        }

        const orderId = order.id;

        // Save address to the order (ALWAYS)
        db.run('UPDATE orders SET address = ? WHERE id = ?', [addressToUse, orderId], (err) => {
          if (err) {
            db.close();
            return res.send('Failed to save address to order.');
          }

          db.all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId], (err, items) => {
            if (err || !items || items.length === 0) {
              db.close();
              return res.send('Your cart is empty.');
            }

            const validateStockTasks = items.map(item => {
              return new Promise((resolve, reject) => {
                db.get('SELECT stock FROM products WHERE id = ?', [item.product_id], (err, product) => {
                  if (err || !product) return reject(`Product ${item.product_id} not found.`);
                  if (product.stock < item.quantity) return reject(`Not enough stock for product ID ${item.product_id}.`);
                  resolve();
                });
              });
            });

            Promise.all(validateStockTasks)
              .then(() => {
                if (Math.random() < 0.1) throw 'Mock payment declined.';
                const updateTasks = items.map(item => {
                  return new Promise((resolve, reject) => {
                    db.run(
                      'UPDATE products SET stock = stock - ?, sold = sold + ? WHERE id = ?',
                      [item.quantity, item.quantity, item.product_id],
                      (err) => (err ? reject(err) : resolve())
                    );
                  });
                });
                return Promise.all(updateTasks);
              })
              .then(() => {
                db.run('UPDATE orders SET created_at = ? WHERE id = ?', [now, orderId], (err) => {
                  db.close();
                  if (err) return res.send('Error finalizing order.');
                  res.send(`
                    <main>
                    <h1>✅ Order Placed</h1>
                    <p>Your order and address have been recorded.</p>
                    <a href="/products">Continue Shopping</a>
                    </main>
                    <script src="/script.js" defer></script>
                    <link rel="stylesheet" href="/style.css">
                  `);
                });
              })
              .catch(err => {
                db.close();
                res.send(`<h1>⚠️ ${err}</h1><a href="/checkout">Return to Checkout</a>`);
              });
          });
        });
      });
    });
  });
});







module.exports = router;
