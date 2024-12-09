document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('schedule-form');
    const meetingDetails = document.getElementById('meeting-details');
    const meetingUrl = document.getElementById('meeting-url');
    const meetingTime = document.getElementById('meeting-time');
  
    // Mostrar el formulario con animación
    document.querySelector('.container').classList.add('show-form');
  
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
  
      const email = document.getElementById('email').value;
      const date = document.getElementById('date').value;
      const time = document.getElementById('time').value;
  
      const response = await fetch('/schedule-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, date, time }),
      });
  
      if (response.ok) {
        const data = await response.json();
  
        // Mostrar detalles de la reunión
        meetingUrl.textContent = data.meetingUrl;
        meetingUrl.href = data.meetingUrl;
        meetingTime.textContent = `${date} ${time}`;
  
        // Mostrar animación de los detalles de la reunión
        document.querySelector('.container').classList.remove('show-form');
        document.querySelector('.container').classList.add('show-details');
      } else {
        alert('Error al agendar la reunión.');
      }
    });
  });
  