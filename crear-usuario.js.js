const Database = require('better-sqlite3');
const db = new Database('./db/usuarios.db');

const usuario = 'elias';
const password = '1234';

db.prepare("INSERT OR REPLACE INTO usuarios (usuario, password) VALUES (?, ?)").run(usuario, password);

console.log("✅ Usuario creado:", usuario);
