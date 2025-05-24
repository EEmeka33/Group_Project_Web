// npm install express sqlite3 body-parser express-session bcrypt
const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // For serving static files (e.g., CSS)
app.use(session({ secret: 'ecommerce-secret', resave: false, saveUninitialized: true }));


// Database connection function
function getDB() {
  return new sqlite3.Database('./db/database.db');
}

const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin_panel');
const accountRoutes = require('./routes/account');
const path = require("path");

app.use('/', authRoutes);
app.use('/', cartRoutes);
app.use('/', productRoutes);
app.use('/', adminRoutes);
app.use('/', accountRoutes);

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});


app.get('/session-info', (req, res) => {
  if (req.session.userId) {
    const db = new sqlite3.Database('./db/database.db');
    db.get('SELECT username FROM users WHERE id = ?', [req.session.userId], (err, user) => {
      db.close();
      if (err || !user) return res.json({ loggedIn: false });
      res.json({ loggedIn: true, username: user.username });
    });
  } else {
    res.json({ loggedIn: false });
  }
});




app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
