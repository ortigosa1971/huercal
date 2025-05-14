
async function cargarDatos() {
    try {
        const response = await fetch('https://api.weather.com/v2/pws/observations/current?stationId=IALFAR30&format=json&units=m&apiKey=e19cf0d935fc49329cf0d935fc5932cc');
        const data = await response.json();
        const obs = data.observations[0];
        document.getElementById('temperature').textContent = obs.metric.temp + ' °C';
        document.getElementById('humidity').textContent = obs.humidity + ' %';
        document.getElementById('windSpeed').textContent = obs.metric.windSpeed + ' km/h';
        document.getElementById('windDirection').textContent = obs.winddir + '°';
        document.getElementById('precipitation').textContent = obs.metric.precipTotal + ' mm';
        document.getElementById('solarRadiation').textContent = obs.solarRadiation + ' W/m²';
    } catch (error) {
        console.error('Error al cargar los datos:', error);
    }
}
cargarDatos();
