const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const crypto = require("crypto");
const app = express();
const PORT = process.env.PORT || 8080;

// Configurar el servidor
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Conectar a la base de datos
const db = new sqlite3.Database("./db/usuarios.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("❌ Error al conectar con la base de datos:", err.message);
    } else {
        console.log("✅ Conectado a la base de datos usuarios.db");
    }
});

// Ruta para login (sin contraseña)
app.post("/login", (req, res) => {
    const usuario = req.body.usuario;
    const token = crypto.randomBytes(16).toString("hex");
    const timestamp = new Date().toISOString();

    db.get("SELECT * FROM usuarios WHERE usuario = ?", [usuario], (err, row) => {
        if (err) {
            console.error("❌ Error en la consulta:", err.message);
            return res.redirect("/?error=1");
        }
        
        if (!row) {
            return res.redirect("/?error=1"); // Usuario no encontrado
        }

        // Verificar si hay una sesión activa
        if (row.session_token) {
            return res.redirect("/?error=sesion"); // Sesión activa detectada
        }

        // Actualizar token y última conexión
        db.run("UPDATE usuarios SET session_token = ?, last_login = ? WHERE id = ?", [token, timestamp, row.id], (err) => {
            if (err) {
                console.error("❌ Error al actualizar la sesión:", err.message);
                return res.redirect("/?error=1");
            }
            console.log(`✅ Sesión iniciada para ${usuario} (${token})`);
            res.redirect("/estacion");
        });
    });
});

// Ruta para cerrar sesión
app.post("/logout", (req, res) => {
    const usuario = req.body.usuario;
    db.run("UPDATE usuarios SET session_token = NULL WHERE usuario = ?", [usuario], (err) => {
        if (err) {
            console.error("❌ Error al cerrar sesión:", err.message);
        }
        res.redirect("/");
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
