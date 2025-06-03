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

        <script src="/script.js" defer></script>
        <script src="/featured_script.js" defer></script>
        <link rel="stylesheet" href="/style.css">


        <div id="featured-products" class="grid" style="margin-top: 2em;"></div>
        <h1>Products</h1>

          <div class="search-bar-container">
            <form method="GET" action="/products" style="margin-bottom:1em; display: flex; gap: 10px; width: 100px; height: 35px; align-content: center">
                <input type="text" name="search" placeholder="Search..." value="${search || ''}" style="width: 200px;height: 35px; padding: 5px;">
                <select name="category" style="padding: 5px; height: 35px;">
      <option value="" ${!category ? 'selected' : ''}>All Categories</option>
      ${categories.map(cat => `
        <option value="${cat}" ${cat === category ? 'selected' : ''}>${cat}</option>
      `).join('')}
    </select>
                <button type="submit" >Search</button>
               </form>
               </div>



            <div class="grid" style="display:flex; flex-wrap:wrap; gap:25px;">
      `;

      products.forEach(p => {
        html += `
  <div class="card">
    <div class="card-header">
    <a href="/product/${p.id}" style=" text-decoration: none;  color: inherit;" >
      <h3>${p.name}</h3>
      <p><strong>Category:</strong> ${p.category || 'Uncategorized'}</p>
    </div>
    <div class="card-image">
      <img src="${p.image || '/uploads/placeholder.png'}" width="150">
    </div>
    <div class="card-description">
      <p>${p.description || 'No description'}</p>
    </div>
    <div class="card-footer">
      <p><strong>Price:</strong> $${p.price}</p>
      <form method="POST" action="/add-to-cart">
        <input type="hidden" name="id" value="${p.id}">
        <input type="hidden" name="name" value="${p.name}">
        <input type="hidden" name="price" value="${p.price}">
        <button type="submit">Add to Cart</button>
      </form>
      </a>
    </div>
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



router.get('/product/:id', (req, res) => {
  const productId = req.params.id;
  const db = new sqlite3.Database('./db/database.db');

  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
    db.close();
    if (err || !product) {
      return res.status(404).send('<h1>Product not found</h1>');
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${product.name}</title>
          <link rel="stylesheet" href="/style.css">
          <script src="/script.js" defer></script>
        </head>
        <body>
            <main class="page-container">
              <div class="product-detail-container">
              <div class="product-detail-image">
                <img src="${product.image || '/uploads/placeholder.png'}" alt="${product.name}" class="product-detail-img">
                </div>
                <div class="product-detail-info">
                  <h1>${product.name}</h1>
                  <p><strong>Category:</strong> ${product.category || 'Uncategorized'}</p>
                  <p>${product.description || 'No description available.'}</p>
                  <p><strong>Price:</strong> $${product.price}</p>
                  <form method="POST" action="/add-to-cart">
                    <input type="hidden" name="id" value="${product.id}">
                    <input type="hidden" name="name" value="${product.name}">
                    <input type="hidden" name="price" value="${product.price}">
                    <button type="submit">Add to Cart</button>
                  </form>
                </div>
              </div>
            </main>
        </body>
      </html>
    `;

    res.send(html);
  });
});


module.exports = router;
