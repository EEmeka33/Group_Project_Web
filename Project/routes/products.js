const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

function getDB() {
  return new sqlite3.Database('./db/database.db');
}

router.get('/products', (req, res) => {
  const db = getDB();
  db.all('SELECT * FROM products', [], (err, products) => {
    db.close();
    if (err) return res.send('Error fetching products.');

    let html = `
      <!DOCTYPE html>
      <html lang="">
      <head>
        <title>Products</title>
        <script src="/script.js" defer></script>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f4f4f4;
            padding: 20px;
          }
          .product-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
          }
          .product-card {
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 16px;
            width: 250px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            text-align: center;
          }
          .product-card img {
            width: 100%;
            height: 180px;
            object-fit: cover;
            border-radius: 4px;
          }
          .product-card h3 {
            font-size: 1.2em;
            margin: 10px 0;
          }
          .product-card p {
            font-size: 0.95em;
            color: #555;
          }
          .product-card .price {
            font-weight: bold;
            margin-top: 8px;
          }
          .product-card form {
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="product-grid">
    `;

    products.forEach(p => {
      html += `
        <div class="product-card">
          <img src="${p.image || '/placeholder.png'}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p>${p.description}</p>
          <div class="price">$ ${p.price.toFixed(2)}</div>
          <form action="/add-to-cart" method="post">
            <input type="hidden" name="id" value="${p.id}">
            <input type="hidden" name="name" value="${p.name}">
            <input type="hidden" name="price" value="${p.price}">
            <button type="submit">Add to Cart</button>
          </form>
        </div>
      `;
    });

    html += '</div></body></html>';
    res.send(html);
  });
});

module.exports = router;
