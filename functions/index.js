// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configurar Nodemailer con Gmail App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'tu-email@gmail.com',
    pass: process.env.GMAIL_PASSWORD || 'tu-app-password'
  }
});

exports.sendReservationEmail = functions.https.onCall(async (data, _context) => {
  const { email, name, area, date, startTime, endTime, reservationId } = data;

  const mailOptions = {
    from: `Reservaciones UNDelta <${process.env.GMAIL_USER || 'tu-email@gmail.com'}>`,
    to: email,
    subject: '¡Gracias por tu reservación en UNDelta!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background-color: #003B55;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .info-box {
            background-color: #f0f9ff;
            border-left: 4px solid #0194d3;
            padding: 15px;
            margin: 20px 0;
          }
          .info-row {
            margin: 10px 0;
          }
          .label {
            font-weight: bold;
            color: #003B55;
          }
          .status-badge {
            background-color: #fef3c7;
            color: #92400e;
            padding: 5px 15px;
            border-radius: 20px;
            display: inline-block;
            font-weight: bold;
            margin: 15px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Gracias por tu reservación!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${name}</strong>,</p>
            
            <p>Hemos recibido tu solicitud de reservación en UNDelta. Te avisaremos cuando sea confirmada.</p>
            
            <div class="status-badge">
              Estado: PENDIENTE
            </div>
            
            <div class="info-box">
              <h3>Detalles de tu reservación:</h3>
              <div class="info-row">
                <span class="label">ID de Reservación:</span> #${reservationId.slice(-8).toUpperCase()}
              </div>
              <div class="info-row">
                <span class="label">Área:</span> ${area}
              </div>
              <div class="info-row">
                <span class="label">Fecha:</span> ${new Date(date).toLocaleDateString('es-AR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div class="info-row">
                <span class="label">Horario:</span> ${startTime} - ${endTime}
              </div>
            </div>
            
            <p><strong>¿Qué sigue?</strong></p>
            <ul>
              <li>Revisaremos tu solicitud</li>
              <li>Te enviaremos un email de confirmación cuando sea aprobada</li>
              <li>Puedes buscar tu reservación usando tu nombre o ID</li>
            </ul>
            
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            
            <p>Saludos,<br>
            <strong>Equipo UNDelta</strong></p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>Universidad Nacional del Delta - Sistema de Reservaciones</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    
    await admin.firestore().collection('email_logs').add({
      reservationId,
      email,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      type: 'reservation_pending',
      status: 'sent'
    });

    return { success: true, message: 'Email enviado correctamente' };
  } catch (error) {
    console.error('Error enviando email:', error);
    throw new functions.https.HttpsError('internal', `Error al enviar el email: ${error.message}`);
  }
});

exports.confirmReservation = functions.https.onCall(async (data, _context) => {
  const { reservationId } = data;

  try {
    const reservationRef = admin.firestore().collection('reservations').doc(reservationId);
    const reservation = await reservationRef.get();
    
    if (!reservation.exists) {
      throw new functions.https.HttpsError('not-found', 'Reservación no encontrada');
    }

    await reservationRef.update({
      status: 'confirmada',
      confirmedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const reservationData = reservation.data();

    const confirmMailOptions = {
      from: `Reservaciones UNDelta <${process.env.GMAIL_USER || 'tu-email@gmail.com'}>`,
      to: reservationData.email,
      subject: '✅ Tu reservación ha sido CONFIRMADA',
      html: `
        <h2>¡Tu reservación ha sido confirmada!</h2>
        <p>Hola ${reservationData.name},</p>
        <p>Tu reservación para <strong>${reservationData.area}</strong> el día <strong>${reservationData.date}</strong> ha sido confirmada.</p>
        <p>Horario: ${reservationData.startTime} - ${reservationData.endTime}</p>
        <p>¡Te esperamos!</p>
      `
    };

    await transporter.sendMail(confirmMailOptions);

    return { success: true, message: 'Reservación confirmada y email enviado' };
  } catch (error) {
    console.error('Error confirmando reservación:', error);
    throw new functions.https.HttpsError('internal', `Error al confirmar la reservación: ${error.message}`);
  }
});