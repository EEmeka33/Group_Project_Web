// routes/admin_panel.js
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

  const search = req.query.search || '';
  const db = getDB();

  db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user || user.role !== 'admin') {
      db.close();
      return res.send('Access denied');
    }

    const sql = search
      ? 'SELECT * FROM users WHERE LOWER(username) LIKE LOWER(?)'
      : 'SELECT * FROM users';

    const params = search ? [`%${search}%`] : [];

    db.all(sql, params, (err, users) => {
      db.close();
      if (err) return res.send('Error loading users');

      let html = `
        <h1>Manage Users</h1>
        <script src="/script.js" defer></script>
        <a href="/admin">← Back</a>

        <form method="GET" action="/admin/users" style="margin-bottom: 1em;">
          <input type="text" name="search" placeholder="Search users..." value="${search}">
          <button type="submit">Search</button>
        </form>

        <ul>
      `;

      users.forEach(u => {
        html += `<li>${u.username} (${u.role}) - ${u.address}</li>`;
      });

      html += '</ul>';
      res.send(html);
    });
  });
});




router.get('/admin/edit-user', isAdmin, (req, res) => {
  const userId = req.query.id;
  const db = getDB();
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    db.close();
    if (err || !user) return res.send('User not found.');

    res.send(`
      <h1>Edit User</h1>
      <script src="/script.js" defer></script>
      <a href="/admin/users">← Back</a>
      <form method="POST" action="/admin/update-user">
        <input type="hidden" name="id" value="${user.id}">
        <label>Username:<input type="text" name="username" value="${user.username}" required></label><br>
        <label>Address:<input type="text" name="address" value="${user.address || ''}"></label><br>
        <label>Role:
          <select name="role">
            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </label><br>
        <button type="submit">Update</button>
      </form>
    `);
  });
});



router.post('/admin/update-user', isAdmin, (req, res) => {
  const { id, username, address, role } = req.body;

  const db = getDB();
  db.run(
    'UPDATE users SET username = ?, address = ?, role = ? WHERE id = ?',
    [username, address, role, id],
    (err) => {
      db.close();
      if (err) return res.send('Error updating user: ' + err.message);
      res.redirect('/admin/users');
    }
  );
});




router.get('/admin/products', (req, res) => {
  if (!req.session.userId) return res.send('Unauthorized');

  const search = req.query.search || '';
  const db = getDB();

  db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user || user.role !== 'admin') {
      db.close();
      return res.send('Access denied');
    }

    const sql = search
      ? 'SELECT * FROM products WHERE LOWER(name) LIKE LOWER(?) ORDER BY stock * 1.0 / volume ASC'
      : 'SELECT * FROM products ORDER BY stock * 1.0 / volume ASC';

    const params = search ? [`%${search}%`] : [];

    db.all(sql, params, (err, products) => {
      db.close();
      if (err) return res.send('Error loading products');

      let html = `
        <html>
        <head>
          <title>Admin Product Management</title>
          <script src="/script.js" defer></script>
          <style>
            .grid { display: flex; flex-wrap: wrap; gap: 20px; }
            .card {
              border: 1px solid #ccc;
              padding: 10px;
              width: 250px;
              border-radius: 8px;
              box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
              background: #fdfdfd;
            }
            .bar-container {
              width: 100%;
              background-color: #eee;
              border-radius: 4px;
              overflow: hidden;
              margin-bottom: 8px;
              height: 12px;
            }
            .bar-fill {
              height: 100%;
              transition: width 0.3s ease;
            }
          </style>
        </head>
        <body>
          <h1>Manage Products</h1>
          <a href="/admin">← Back</a>

          <form method="GET" action="/admin/products" style="margin-bottom: 1em;">
            <input type="text" name="search" placeholder="Search products..." value="${search}">
            <button type="submit">Search</button>
          </form>

          <div class="grid">
      `;

      products.forEach(p => {
        const ratio = p.volume > 0 ? p.stock / p.volume : 0;
        const percent = Math.max(0, Math.min(100, Math.floor(ratio * 100)));
        const red = Math.min(255, Math.floor(255 * (1 - ratio)));
        const green = Math.min(255, Math.floor(255 * ratio));
        const color = `rgb(${red}, ${green}, 50)`;

        html += `
          <div class="card">
            <div class="bar-container">
              <div class="bar-fill" style="width: ${percent}%; background-color: ${color};"></div>
            </div>
            <p><strong>Image:</strong><br>
              ${p.image ? `<img src="${p.image}" width="100">` : `<img src="/uploads/placeholder.png" width="100">`}
            </p>
            <form method="POST" action="/admin/update-product" enctype="multipart/form-data">
              <input type="hidden" name="id" value="${p.id}">
              <label>Name:<input type="text" name="name" value="${p.name}" required></label>
              <label>Description:<textarea name="description" rows="2">${p.description || ''}</textarea></label>
              <label>Category:<input type="text" name="category" value="${p.category || ''}"></label>
              <label>Volume:<input type="number" name="volume" value="${p.volume || 0}" min="0"></label>
              <label>Price:<input type="number" name="price" value="${p.price}" min="0" step="0.01"></label>
              <label>Stock:<input type="number" name="stock" value="${p.stock || 0}" min="0"></label>
              <label>Sold:<input type="number" name="sold" value="${p.sold || 0}" min="0"></label>
              <label>Image:<input type="file" name="image"></label>
              <button type="submit">Save Changes</button>
            </form>
            <form method="POST" action="/admin/delete-product">
              <input type="hidden" name="id" value="${p.id}">
              <button type="submit" style="color:red;">❌ Delete</button>
            </form>
          </div>
        `;
      });

      // create product form remains unchanged...
      html += `
        <form method="POST" action="/admin/create-product" enctype="multipart/form-data" class="card">
          <h3>Create New Product</h3>
          <label>Name:<input type="text" name="name" required></label>
          <label>Description:<textarea name="description" rows="2"></textarea></label>
          <label>Category:<input type="text" name="category"></label>
          <label>Volume:<input type="number" name="volume" value="0" min="0"></label>
          <label>Price:<input type="number" name="price" value="0" min="0" step="0.01"></label>
          <label>Stock:<input type="number" name="stock" value="0" min="0"></label>
          <label>Sold:<input type="number" name="sold" value="0" min="0"></label>
          <label>Image:<input type="file" name="image"></label>
          <button type="submit" style="margin-top:8px;">➕ Create</button>
        </form>
      `;

      html += '</div></body></html>';
      res.send(html);
    });
  });
});





router.get('/admin/orders', (req, res) => {
  if (!req.session.userId) return res.send('Unauthorized');

  const search = req.query.search || '';
  const db = getDB();

  db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user || user.role !== 'admin') {
      db.close();
      return res.send('Access denied');
    }

    const sql = search
      ? `
        SELECT orders.id AS order_id, users.username, products.id AS product_id,
               products.name AS product_name, order_items.quantity,
               orders.created_at, orders.address
        FROM orders
        JOIN users ON orders.user_id = users.id
        JOIN order_items ON orders.id = order_items.order_id
        JOIN products ON order_items.product_id = products.id
        WHERE orders.id LIKE ?
        ORDER BY orders.created_at DESC
      `
      : `
        SELECT orders.id AS order_id, users.username, products.id AS product_id,
               products.name AS product_name, order_items.quantity,
               orders.created_at, orders.address
        FROM orders
        JOIN users ON orders.user_id = users.id
        JOIN order_items ON orders.id = order_items.order_id
        JOIN products ON order_items.product_id = products.id
        ORDER BY orders.created_at DESC
      `;

    const params = search ? [`%${search}%`] : [];

    db.all(sql, params, (err, orders) => {
      db.close();
      if (err) return res.send('Error loading orders');

      let html = `
        <h1>Manage Orders</h1>
        <script src="/script.js" defer></script>
        <a href="/admin">← Back</a>

        <form method="GET" action="/admin/orders" style="margin-bottom: 1em;">
          <input type="text" name="search" placeholder="Search order number..." value="${search}">
          <button type="submit">Search</button>
        </form>

        <ul>
      `;

      let currentOrder = null;
      orders.forEach(row => {
        if (currentOrder !== row.order_id) {
          if (currentOrder !== null) html += '</ul>';
          html += `
            <li>
              <strong>Order #${row.order_id}</strong> by ${row.username} at ${row.created_at}
              <br><strong>Address:</strong> ${row.address || 'Not provided'}
              <form method="POST" action="/admin/delete-order" style="display:inline; margin-top: 4px;">
                <input type="hidden" name="order_id" value="${row.order_id}">
                <button type="submit" style="color:red;">❌ Delete Order</button>
              </form>
              <ul>`;
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
          </li>
        `;
      });

      html += '</ul></ul>';
      res.send(html);
    });
  });
});



router.post('/admin/update-product', upload.single('image'), (req, res) => {
  const { id, name, description, price, volume, stock, category, sold } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : null;

  const db = getDB();
  const query = imagePath
    ? 'UPDATE products SET name = ?, description = ?, price = ?, volume = ?, stock = ?, sold = ?, category = ?, image = ? WHERE id = ?'
    : 'UPDATE products SET name = ?, description = ?, price = ?, volume = ?, stock = ?, sold = ?, category = ? WHERE id = ?';

  const params = imagePath
    ? [name, description, price, volume, stock, sold, category, imagePath, id]
    : [name, description, price, volume, stock, sold, category, id];


  db.run(query, params, err => {
    db.close();
    if (err) return res.send('Error updating product: ' + err.message);
    res.redirect('/admin/products');
  });
});


router.post('/admin/create-product', upload.single('image'), (req, res) => {
  const { name, description, volume, price, stock, sold, category } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : null;

  const db = getDB();
  db.run(
    'INSERT INTO products (name, description, volume, price, stock, sold, category, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, description, volume, price, stock, sold, category, imagePath],
    (err) => {
      db.close();
      if (err) return res.send('Error creating product: ' + err.message);
      res.redirect('/admin/products');
    }
  );
});


router.post('/admin/delete-product', (req, res) => {
  const { id } = req.body;

  const db = getDB();
  db.run('DELETE FROM products WHERE id = ?', [id], (err) => {
    db.close();
    if (err) {
      console.error('Error deleting product:', err.message);
      return res.send('Failed to delete product.');
    }
    res.redirect('/admin/products');
  });
});


router.post('/admin/delete-order', (req, res) => {
  const { order_id } = req.body;
  const db = getDB();

  db.serialize(() => {
    db.run('DELETE FROM order_items WHERE order_id = ?', [order_id], (err) => {
      if (err) {
        db.close();
        return res.send('Failed to delete order items.');
      }

      db.run('DELETE FROM orders WHERE id = ?', [order_id], (err2) => {
        db.close();
        if (err2) return res.send('Failed to delete order.');
        res.redirect('/admin/orders');
      });
    });
  });
});




module.exports = router;
