const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Base de datos SQLite
const db = new sqlite3.Database('./db/usuarios.db');

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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

// Middleware de verificación de sesión única
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

// Rutas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/inicio', verificarSesionUnica, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inicio.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

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

// Ruta para enviar email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/send-email', (req, res) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'eliasalfarnate@gmail.com',
    subject: 'Solicitud de acceso',
    text: 'Un usuario ha solicitado acceso a la estación meteorológica.',
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.status(200).send('Correo enviado: ' + info.response);
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
