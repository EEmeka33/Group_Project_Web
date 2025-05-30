// routes/account.js
const express = require('express');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

function getDB() {
  return new sqlite3.Database('./db/database.db');
}


router.get('/your-account', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const db = getDB();
  db.get('SELECT username, address FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    db.close();
    if (err || !user) return res.send('User not found.');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Your Account</title>
        <script src="/script.js" defer></script>
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
      <main>
        <form method="POST" action="/your-account">
          <label>Username: <input type="text" name="username" value="${user.username}" required></label><br><br>
          <label>Address: <input type="text" name="address" value="${user.address || ''}" required></label><br><br>
          <button type="submit">Update Info</button>
        </form>
      </main>
      <body>
      </html>
    `;
    res.send(html);
  });
});


router.post('/your-account', (req, res) => {
  const { username, address } = req.body;

  if (!req.session.userId) return res.redirect('/login');

  const db = getDB();
  db.run(
    'UPDATE users SET username = ?, address = ? WHERE id = ?',
    [username, address, req.session.userId],
    function (err) {
      db.close();
      if (err) return res.send('Error updating account: ' + err.message);
      res.redirect('/your-account');
    }
  );
});


module.exports = router;
