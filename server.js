const express = require('express');
const axios = require('axios');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'e19cf0d935fc49329cf0d935fc5932cc';
const STATION_ID = process.env.STATION_ID || 'IALFAR30';

// Configurar cabeceras de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://code.jquery.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https://www.gstatic.com"],
            connectSrc: ["'self'", "https://api.weather.com"],
            fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        }
    }
}));

// Servir archivos estáticos desde la carpeta public
app.use(express.static('public'));

// Endpoint para obtener datos del clima
app.get('/api/clima', async (req, res) => {
    try {
        const url = `https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener los datos del clima:', error.message);
        res.status(500).json({ error: 'Error al obtener los datos del clima' });
    }
});

// Arrancar el servidor
app.listen(PORT, () => {
    console.log(`🌐 Servidor escuchando en el puerto ${PORT}`);
});
