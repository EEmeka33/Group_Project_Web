const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

function getDB() {
  return new sqlite3.Database('./db/database.db');
}

router.get('/featured-products', (req, res) => {
  const db = getDB();
  const sql = `
    SELECT p.*
    FROM products p
    INNER JOIN (
      SELECT category, MAX(sold) AS max_sold
      FROM products
      GROUP BY category
    ) grouped
    ON p.category = grouped.category AND p.sold = grouped.max_sold
  `;

  db.all(sql, [], (err, rows) => {
    db.close();
    if (err) {
      console.error(err);
      return res.status(500).json([]);
    }
    res.json(rows);
  });
});

module.exports = router;
