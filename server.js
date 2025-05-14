const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos
app.use(express.static("public"));

// Ruta para login
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/login.html");
});

// Ruta para datos meteorológicos
app.get("/estacion", (req, res) => {
    res.sendFile(__dirname + "/views/estacion-meteorologica.html");
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
