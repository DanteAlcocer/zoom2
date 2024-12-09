const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');


const functions = require('firebase-functions');

// Acceder a las variables configuradas
const ZOOM_CLIENT_ID = functions.config().zoom.client_id;
const ZOOM_CLIENT_SECRET = functions.config().zoom.client_secret;
const ZOOM_ACCOUNT_ID = functions.config().zoom.account_id;
const MONGODB_URI = functions.config().mongodb.uri;

// Ejemplo de uso
console.log('Zoom Client ID:', ZOOM_CLIENT_ID);
console.log('MongoDB URI:', MONGODB_URI);


// Inicializar dotenv para variables de entorno
dotenv.config();

// Configurar Express
const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Conectado a MongoDB');
}).catch((err) => {
  console.error('Error de conexión a MongoDB:', err);
});

// Rutas de tu API
app.post('/schedule-meeting', async (req, res) => {
  const { email, date, time } = req.body;

  try {
    // Crear la reunión en Zoom
    const tokenResponse = await axios.post(
      'https://zoom.us/oauth/token',
      null,
      {
        params: {
          grant_type: 'account_credentials',
          account_id: process.env.ZOOM_ACCOUNT_ID,
        },
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const meetingResponse = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: 'Reunión con cliente',
        type: 2,
        start_time: `${date}T${time}:00Z`,
        duration: 30,
        timezone: 'UTC',
        agenda: 'Reunión de consulta',
        settings: {
          host_video: true,
          participant_video: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.status(200).json({
      meetingId: meetingResponse.data.id,
      meetingUrl: meetingResponse.data.join_url,
      startTime: meetingResponse.data.start_time,
    });
  } catch (error) {
    console.error('Error al crear la reunión:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al crear la reunión.' });
  }
});

// Exportar la app como función de Firebase
exports.app = functions.https.onRequest(app);
