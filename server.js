const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const app = express();
const db = new sqlite3.Database('./db/usuarios.db');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'mi_secreto_super_seguro',
  resave: false,
  saveUninitialized: true
}));

// Crear tabla usuarios si no existe
db.run(`CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT UNIQUE,
  password TEXT,
  session_token TEXT
)`);

// Middleware para validar sesión única
function verificarSesionUnica(req, res, next) {
  if (!req.session.usuario || !req.session.token) return res.redirect('/login.html');

  db.get("SELECT session_token FROM usuarios WHERE usuario = ?", [req.session.usuario], (err, row) => {
    if (err || !row || row.session_token !== req.session.token) {
      req.session.destroy(() => res.redirect('/login.html'));
    } else {
      next();
    }
  });
}

app.post('/login', (req, res) => {
  const { usuario, password } = req.body;

  db.get("SELECT * FROM usuarios WHERE usuario = ? AND password = ?", [usuario, password], (err, row) => {
    if (err) return res.status(500).send("Error en la base de datos");
    if (row) {
      const token = crypto.randomUUID();
      db.run("UPDATE usuarios SET session_token = ? WHERE usuario = ?", [token, usuario], (err) => {
        if (err) return res.status(500).send("Error guardando sesión");
        req.session.usuario = usuario;
        req.session.token = token;
        res.redirect('/inicio');
      });
    } else {
      res.send("Usuario o contraseña incorrectos");
    }
  });
});

app.get('/inicio', verificarSesionUnica, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inicio.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});