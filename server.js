const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = 'e19cf0d935fc49329cf0d935fc5932cc';
const STATION_ID = 'IALFAR30';

app.use(express.static('public'));

app.get('/api/clima', async (req, res) => {
    try {
        const response = await axios.get(`https://api.weather.com/v2/pws/observations/current?stationId=${STATION_ID}&format=json&units=m&apiKey=${API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener los datos del clima:', error.message);
        res.status(500).json({ error: 'Error al obtener los datos del clima' });
    }
});

app.listen(PORT, () => {
    console.log(`🌐 Servidor escuchando en el puerto ${PORT}`);
});
