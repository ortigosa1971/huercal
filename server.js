// ✅ server.js (corregido definitivo)

const express = require('express');
const session = require('express-session');
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const db = new Database('./db/usuarios.db', { verbose: console.log });
const BetterSqlite3Store = require('better-sqlite3-session-store')(session);

// Crear tabla usuarios y sessions si no existen
db.prepare(`CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT UNIQUE,
  password TEXT,
  session_token TEXT
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expired INTEGER NOT NULL
)`).run();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new BetterSqlite3Store({ client: db }),
  secret: 'mi_secreto_super_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax' }
}));

// Middleware sesión única
function verificarSesionUnica(req, res, next) {
  if (!req.session.usuario || !req.session.token) return res.redirect('/login.html');

  const row = db.prepare("SELECT session_token FROM usuarios WHERE usuario = ?").get(req.session.usuario);
  if (!row || row.session_token !== req.session.token) {
    req.session.destroy(() => {
      res.redirect('/login.html?motivo=expirada');
    });
  } else {
    next();
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/inicio', verificarSesionUnica, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inicio.html'));
});

app.get('/logout', (req, res) => {
  db.prepare("UPDATE usuarios SET session_token = NULL WHERE usuario = ?").run(req.session.usuario);
  req.session.destroy(() => res.redirect('/login.html'));
});

app.post('/login', (req, res) => {
  const usuario = req.body.usuario.trim();
  const password = req.body.password.trim();

  const row = db.prepare("SELECT * FROM usuarios WHERE usuario = ? AND password = ?").get(usuario, password);
  if (row) {
    const token = crypto.randomUUID();
    db.prepare("UPDATE usuarios SET session_token = ? WHERE usuario = ?").run(token, usuario);

    req.session.regenerate(err => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error interno al regenerar sesión");
      }

      req.session.usuario = usuario;
      req.session.token = token;

      res.redirect('/inicio');
    });
  } else {
    res.redirect('/login.html?error=1');
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
