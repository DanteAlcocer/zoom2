const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Inicializar dotenv para cargar variables de entorno desde un archivo .env
dotenv.config();

// Acceder a las variables de entorno configuradas en Vercel
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const MONGODB_URI = process.env.MONGODB_URI;

// Configurar Express
const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(MONGODB_URI, {
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
          account_id: ZOOM_ACCOUNT_ID,
        },
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`
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

// Vercel solo requiere exportar la función como una función de endpoint
module.exports = app;
