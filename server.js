
const axios = require('axios');
const express = require('express');
const app = express();
const path = require('path');


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = 3000;//puero donde se levanta el servidor

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});


app.get('./mapbox_directions.js', async (req, res) => {
  try {
    //  parámetros necesarios para tu solicitud de dirección, como origen y destino.
    const origin = req.query.origin;
    const destination = req.query.destination;

    // Configura los parámetros para la solicitud a la API de Mapbox
    const apiKey = 'pk.eyJ1IjoiZWVsZ3VlZG8iLCJhIjoiY2xocXZ3MDh3MXB4aDNwbnVvNHdtNDVtNyJ9.8AdrRQtrlH2L0XUU3bMElA'; // API key de Mapbox
    const apiUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${destination}`;
    const queryParams = `?access_token=${apiKey}&alternatives=true`;

    // Realiza la solicitud a la API de Mapbox utilizando axios
    const response = await axios.get(apiUrl + queryParams);

    // Haz algo con la respuesta recibida, como enviarla como respuesta HTTP o procesarla de alguna otra manera.
    res.send(response.data);
  } catch (error) {
    // Manejo de errores en caso de que la solicitud falle
    console.error('Error al realizar la solicitud a la API de Mapbox:', error);
    res.status(500).send('Error al obtener la dirección de Mapbox');
  }
});





