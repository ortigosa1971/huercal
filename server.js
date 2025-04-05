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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new BetterSqlite3Store({ client: db }),
  secret: 'mi_secreto_super_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// Crear tabla si no existe
db.prepare(`CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT UNIQUE,
  password TEXT,
  session_token TEXT
)`).run();

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
    // Borrar cualquier sesión activa del mismo usuario
    const sesiones = db.prepare("SELECT sid, sess FROM sessions").all();
    sesiones.forEach(s => {
      try {
        const datos = JSON.parse(s.sess);
        if (datos.usuario === usuario) {
          db.prepare("DELETE FROM sessions WHERE sid = ?").run(s.sid);
        }
      } catch (err) {
        console.error("Error al procesar sesión previa:", err.message);
      }
    });

    const token = crypto.randomUUID();
    db.prepare("UPDATE usuarios SET session_token = ? WHERE usuario = ?").run(token, usuario);

    req.session.usuario = usuario;
    req.session.token = token;

    res.redirect('/inicio');
  } else {
    res.redirect('/login.html?error=1');
  }
});

app.get('/debug', (req, res) => {
  if (!req.session.usuario) return res.send("Sin sesión");
  const row = db.prepare("SELECT session_token FROM usuarios WHERE usuario = ?").get(req.session.usuario);
  res.send({
    usuario: req.session.usuario,
    token_en_sesion: req.session.token,
    token_en_bd: row ? row.session_token : null
  });
});

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
    if (error) return res.status(500).send(error.toString());
    res.status(200).send('Correo enviado: ' + info.response);
  });
});

app.get('/crear-usuario-default', (req, res) => {
  const clave = req.query.clave;
  if (clave !== 'segura123') {
    return res.status(401).send('⛔ Acceso no autorizado');
  }

  const usuario = 'elias';
  const password = '1234';

  try {
    db.prepare("INSERT OR REPLACE INTO usuarios (usuario, password) VALUES (?, ?)").run(usuario, password);
    res.send("✅ Usuario creado: elias / 1234");
  } catch (err) {
    res.status(500).send("Error al crear el usuario: " + err.message);
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
