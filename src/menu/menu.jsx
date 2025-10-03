import React, { useState } from 'react';
import { Calendar, Clock, User, MapPin, CheckCircle } from 'lucide-react';
import './menu.css';

function Menu() {
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    date: '',
    startTime: '',
    endTime: ''
  });
  
  const [reservations, setReservations] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const areas = [
    { id: 'Aula 1', name: 'Aula 1', capacity: '-' },
    { id: 'Aula 2', name: 'Aula 2', capacity: '-' },
    { id: 'Aula 3', name: 'Aula 3', capacity: '-' },
    { id : 'Auditorio', name: 'Auditorio', capacity: '-' },
    { id: 'Consejo Superior', name: 'Consejo Superior', capacity: '-' },
  ];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.area || !formData.date || !formData.startTime || !formData.endTime) {
      alert('Porfavor complete todos los campos');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      alert('El tiempo de inicio debe ser antes del tiempo de finalización');
      return;
    }

    const newReservation = {
      id: Date.now(),
      ...formData,
      timestamp: new Date().toISOString()
    };

    setReservations(prev => [...prev, newReservation]);
    setShowSuccess(true);
    
    setFormData({
      name: '',
      area: '',
      date: '',
      startTime: '',
      endTime: ''
    });

    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getAreaName = (areaId) => {
    return areas.find(a => a.id === areaId)?.name || areaId;
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Área de reservación UNDelta</h1>
        <p>Reserve su espacio para actividades académicas</p>
      </div>

      <div className="grid">
        {/* Reservation Form */}
        <div className="card">
          <h2>Hacer una Reservación</h2>
          <form onSubmit={handleSubmit} className="form">
            <div>
              <label>
                <User className="icon" /> Nombre Completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label>
                <MapPin className="icon" /> Seleccionar Área
              </label>
              <select
                name="area"
                value={formData.area}
                onChange={handleInputChange}
              >
                <option value="">Elija un área...</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name} - {area.capacity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>
                <Calendar className="icon" /> Fecha de Reservación
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="time-grid">
              <div>
                <label>
                  <Clock className="icon" /> Hora de Inicio
                </label>
                <select
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccionar...</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>
                  <Clock className="icon" /> Hora de Finalización
                </label>
                <select
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccionar...</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn">Enviar Reservación</button>
          </form>

          {showSuccess && (
            <div className="success">
              <CheckCircle className="icon" />
              <span>¡Reservación enviada con éxito!</span>
            </div>
          )}
        </div>

        {/* Reservations List */}
        <div className="card">
          <h2>Tus Reservaciones</h2>
          {reservations.length === 0 ? (
            <div className="empty">
              <Calendar className="empty-icon" />
              <p>No hay reservaciones aún</p>
            </div>
          ) : (
            <div className="reservations">
              {reservations.map(reservation => (
                <div key={reservation.id} className="reservation">
                  <div className="reservation-header">
                    <h3>{reservation.name}</h3>
                    <span>#{reservation.id.toString().slice(-6)}</span>
                  </div>
                  <div className="reservation-info">
                    <p><MapPin className="icon" /> {getAreaName(reservation.area)}</p>
                    <p><Calendar className="icon" /> {new Date(reservation.date).toLocaleDateString()}</p>
                    <p><Clock className="icon" /> {reservation.startTime} - {reservation.endTime}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Menu;