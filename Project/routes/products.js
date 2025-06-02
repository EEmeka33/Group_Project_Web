const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

function getDB() {
  return new sqlite3.Database('./db/database.db');
}

router.get('/products', (req, res) => {
  const db = getDB();
  const { search, category } = req.query;

  db.all('SELECT DISTINCT category FROM products', [], (err, allCategories) => {
    if (err) return res.send('Failed to load categories');

    let sql = 'SELECT * FROM products';
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('LOWER(name) LIKE LOWER(?)');
      params.push(`%${search}%`);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }


    db.all(sql, params, (err, products) => {
      db.close();
      if (err) return res.send('Error loading products');

      const categories = allCategories.map(c => c.category).filter(Boolean);

      let html = `
      <div class="page-wrapper">
        <main class="page-container">
        <h1>Products</h1>
        <script src="/script.js" defer></script>
        <script src="/featured_script.js" defer></script>
        <link rel="stylesheet" href="/style.css">


        <div id="featured-products" class="grid" style="margin-top: 2em;"></div>

            <form method="GET" action="/products" style="margin-bottom:1em;">
              <input type="text" name="search" placeholder="Search..." value="${search || ''}">
              <input type="hidden" name="category" value="${category || ''}">
              <button type="submit">Search</button>
            </form>

            <div style="margin-bottom: 1em;">
              <strong>Filter by Category:</strong>
              <a href="/products" style="margin-right: 10px; ${!category ? 'font-weight:bold;' : ''}">All</a>
              ${categories.map(cat => `
                <a href="/products?category=${encodeURIComponent(cat)}" style="margin-right: 10px; ${cat === category ? 'font-weight:bold;' : ''}">
                  ${cat}
                </a>
              `).join('')}
            </div>

            <div class="grid" style="display:flex; flex-wrap:wrap; gap:25px;">
      `;

      products.forEach(p => {
        html += `
          <div class="card" style="width:200px; padding:10px; border:1px solid #ccc;">
            <h3>${p.name}</h3>
            <p><strong>Category:</strong> ${p.category || 'Uncategorized'}</p>
            <img src="${p.image || '/uploads/placeholder.png'}" width="150">
            <p>${p.description || 'No description'}</p>
            <p><strong>Price:</strong> $${p.price}</p>
            <form method="POST" action="/add-to-cart">
              <input type="hidden" name="id" value="${p.id}">
              <input type="hidden" name="name" value="${p.name}">
              <input type="hidden" name="price" value="${p.price}">
              <button type="submit">Add to Cart</button>
            </form>
          </div>
        `;
      });

      html += `
        </div>
        </div>
      </main>
</div>`;
      res.send(html);
    });
  });
});


module.exports = router;
