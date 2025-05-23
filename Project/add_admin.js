const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./db/database.db');

const username = 'admin';
const password = 'secret';
const role = 'admin';

bcrypt.hash(password, 10).then(hash => {
  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, role], (err) => {
    if (err) {
      console.error('Failed to insert admin:', err.message);
    } else {
      console.log('Admin user created successfully.');
    }
    db.close();
  });
});
