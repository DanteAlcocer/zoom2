const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Sirve los archivos estáticos de la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Conectado a MongoDB');
}).catch((err) => {
  console.error('Error de conexión a MongoDB:', err);
});

// Sirve el archivo index.html cuando el usuario acceda a la raíz "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Definición del esquema de la reunión
const meetingSchema = new mongoose.Schema({
  email: String,
  date: String,
  time: String,
});

// Modelo de la reunión
const Meeting = mongoose.model('Meeting', meetingSchema);

// Endpoint para crear reuniones en Zoom
app.post('/schedule-meeting', async (req, res) => {
  const { email, date, time } = req.body;

  // Verificar si ya existe una reunión en el mismo horario
  const existingMeeting = await Meeting.findOne({ date, time });
  if (existingMeeting) {
    return res.status(400).json({ error: 'Este horario ya está ocupado. Por favor, elige otro.' });
  }

  try {
    // 1. Obtener un token de acceso con OAuth
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

    // 2. Crear la reunión usando el token de acceso
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

    // Guardar la reunión en la base de datos
    const newMeeting = new Meeting({ email, date, time });
    await newMeeting.save();

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

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en el puerto 3000');
});
