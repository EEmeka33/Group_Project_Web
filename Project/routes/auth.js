// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

function getDB() {
  return new sqlite3.Database('./db/database.db');
}

// Serve the registration page
router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});

// Handle user registration
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const db = getDB();
  db.run(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, hash],
    err => {
      db.close();
      if (err) {
        console.error(err.message);
        return res.send('Username already exists or error occurred.');
      }
      res.redirect('/login');
    }
  );
});

// Serve the login page
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Handle user login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDB();
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    db.close();
    if (err || !user) {
      return res.send('Invalid username.');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.send('Incorrect password.');
    }

    req.session.userId = user.id;
    res.redirect('/');
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
