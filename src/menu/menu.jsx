import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, CheckCircle, Mail, Search } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, functions } from './firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './menu.css';

function Menu() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    area: '',
    date: '',
    startTime: '',
    endTime: ''
  });
  
  const [searchParams, setSearchParams] = useState({
    name: '',
    area: '',
    date: '',
    startTime: ''
  });
  
  const [searchResults, setSearchResults] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hoveredArea, setHoveredArea] = useState(null);

  const areas = [
    { id: 'Aula 1', name: 'Aula 1'},
    { id: 'Aula 2', name: 'Aula 2'},
    { id: 'Aula 3', name: 'Aula 3'},
    { id: 'Aula 4', name: 'Aula 4'},
    { id: 'Auditorio', name: 'Auditorio'},
    { id: 'Consejo Superior', name: 'Consejo Superior'},
  ];

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.area || !formData.date || !formData.startTime || !formData.endTime) {
      alert('Por favor complete todos los campos');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      alert('El tiempo de inicio debe ser antes del tiempo de finalización');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Por favor ingrese un email válido');
      return;
    }

    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, 'reservations'), {
        ...formData,
        status: 'pendiente',
        timestamp: new Date(),
        createdAt: new Date().toISOString()
      });

      const sendEmail = httpsCallable(functions, 'sendReservationEmail');
      await sendEmail({
        email: formData.email,
        name: formData.name,
        area: formData.area,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        reservationId: docRef.id
      });

      setShowSuccess(true);
      
      setFormData({
        name: '',
        email: '',
        area: '',
        date: '',
        startTime: '',
        endTime: ''
      });

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la reservación: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchParams.name && !searchParams.area && !searchParams.date && !searchParams.startTime) {
      alert('Por favor ingrese al menos un criterio de búsqueda');
      return;
    }

    setSearching(true);

    try {
      let q = collection(db, 'reservations');
      const conditions = [];

      if (searchParams.area) {
        conditions.push(where('area', '==', searchParams.area));
      }
      if (searchParams.date) {
        conditions.push(where('date', '==', searchParams.date));
      }
      if (searchParams.startTime) {
        conditions.push(where('startTime', '==', searchParams.startTime));
      }

      if (conditions.length > 0) {
        q = query(collection(db, 'reservations'), ...conditions, orderBy('timestamp', 'desc'));
      } else {
        q = query(collection(db, 'reservations'), orderBy('timestamp', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      let results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (searchParams.name) {
        results = results.filter(r => 
          r.name.toLowerCase().includes(searchParams.name.toLowerCase())
        );
      }

      setSearchResults(results);

      if (results.length === 0) {
        alert('No se encontraron reservaciones con esos criterios');
      }
    } catch (error) {
      console.error('Error al buscar:', error);
      alert('Error al buscar reservaciones: ' + error.message);
    } finally {
      setSearching(false);
    }
  };

  const getAreaName = (areaId) => {
    return areas.find(a => a.id === areaId)?.name || areaId;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pendiente: { bg: '#fef3c7', color: '#92400e', text: 'Pendiente' },
      confirmada: { bg: '#d1fae5', color: '#065f46', text: 'Confirmada' },
      rechazada: { bg: '#fee2e2', color: '#991b1b', text: 'Rechazada' }
    };
    
    const style = styles[status] || styles.pendiente;
    
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600'
      }}>
        {style.text}
      </span>
    );
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Área de reservación UNDelta</h1>
        <p>Reserve su espacio para actividades académicas</p>
      </div>

      <div className="main-layout">
        {/* Search Sidebar */}
          <div className="card sidebar-card">
            <h3 className="sidebar-title">Reservaciones</h3>
              {/* Google Calendar */}
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: '600' }}>
                Calendario de Reservaciones
              </h4>
              <iframe
                src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FArgentina%2FBuenos_Aires&showPrint=0&src=bWFyaWFub2JlbnNhbmNoZXpAZ21haWwuY29t&src=ZmFtaWx5MTU2OTE0MjAyMDcyNTExNTIzOTlAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ&src=bmJhXy1tLTBqbTc0XyU0M2hpY2FnbyslNDJ1bGxzI3Nwb3J0c0Bncm91cC52LmNhbGVuZGFyLmdvb2dsZS5jb20&src=bmJhXy1tLTBqbWo3XyU0N29sZGVuKyU1M3RhdGUrJTU3YXJyaW9ycyNzcG9ydHNAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&src=ZW4uYXIjaG9saWRheUBncm91cC52LmNhbGVuZGFyLmdvb2dsZS5jb20&src=bmJhXy1tLTBqbWs3XyU0Y29zKyU0MW5nZWxlcyslNGNha2VycyNzcG9ydHNAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&src=bmJhXy1tLTBqbTN2XyU0ZWV3KyU1OW9yayslNGJuaWNrcyNzcG9ydHNAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&color=%23039be5&color=%23009688&color=%23ad1457&color=%234285f4&color=%230b8043&color=%23ef6c00&color=%23d81b60"
                style={{
                  border: 'none',
                  borderRadius: '4px',
                  width: '100%',
                  height: '400px',
                  paddingBottom: '10px'
                }}
                frameBorder="0"
                scrolling="no"
                title="Google Calendar"
              ></iframe>
            </div>
          </div>

          <aside className="search-sidebar">
          <div className="card sidebar-card">
            <h3 className="sidebar-title">Buscar reservaciones</h3>
            <form onSubmit={handleSearch} className="form">
              <div>
                <label>
                  <User className="icon" /> Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  value={searchParams.name}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nombre..."
                />
              </div>
              <div>
                <label>
                  <MapPin className="icon" /> Área
                </label>
                <select
                  name="area"
                  value={searchParams.area}
                  onChange={handleSearchChange}
                >
                  <option value="">Todas las áreas</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>
                  <Calendar className="icon" /> Fecha
                </label>
                <input
                  type="date"
                  name="date"
                  value={searchParams.date}
                  onChange={handleSearchChange}
                />
              </div>

              <div>
                <label>
                  <Clock className="icon" /> Hora de Inicio
                </label>
                <select
                  name="startTime"
                  value={searchParams.startTime}
                  onChange={handleSearchChange}
                >
                  <option value="">Todas las horas</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn" disabled={searching}>
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            <div className="search-results">
              {searchResults.length === 0 ? (
                <div className="empty">
                  <Search className="empty-icon" />
                  <p style={{ fontSize: '0.8rem' }}>Sin resultados</p>
                </div>
              ) : (
                <div className="reservations">
                  {searchResults.map(reservation => (
                    <div key={reservation.id} className="reservation compact">
                      <div className="reservation-header">
                        <h4>{reservation.name}</h4>
                        {getStatusBadge(reservation.status)}
                      </div>
                      <div className="reservation-info compact-info">
                        <p><MapPin className="icon" /> {getAreaName(reservation.area)}</p>
                        <p><Calendar className="icon" /> {new Date(reservation.date).toLocaleDateString()}</p>
                        <p><Clock className="icon" /> {reservation.startTime}-{reservation.endTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Reservation Form Center */}
        <div className="center-section">
          <div className="card">
            <h2>Hacer una reservación</h2>
            <form onSubmit={handleSubmit} className="form">
              <div>
                <label>
                  <User className="icon" /> Nombre(s) y Apellido(s)
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label>
                  <Mail className="icon" /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu.email@ejemplo.com"
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
                      {area.name}
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

              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Reservación'}
              </button>
            </form>

            {showSuccess && (
              <div className="success">
                <CheckCircle className="icon" />
                <span>¡Reservación enviada! Revisa tu email.</span>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Floor Plan */}
        <aside className="floor-plan-section">
          <div className="card">
            <h3 className="sidebar-title">Áreas de la UNDelta</h3>
            <div className="floor-plan">
              <div 
                className={`room consejo ${hoveredArea === 'Consejo Superior' ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredArea('Consejo Superior')}
                onMouseLeave={() => setHoveredArea(null)}
              >
                <span className="room-name">Consejo Superior</span>
                {hoveredArea === 'Consejo Superior' && (
                  <div className="room-tooltip">
                    <strong>Consejo Superior</strong>
                    <p>Capacidad: 20 personas</p>
                  </div>
                )}
              </div>

              <div className="room-row">
                <div 
                  className={`room aula ${hoveredArea === 'Aula 1' ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredArea('Aula 1')}
                  onMouseLeave={() => setHoveredArea(null)}
                >
                  <span className="room-name">Aula 1</span>
                  {hoveredArea === 'Aula 1' && (
                    <div className="room-tooltip">
                      <strong>Aula 1</strong>
                      <p>Capacidad: 30 personas</p>
                    </div>
                  )}
                </div>

                <div 
                  className={`room aula ${hoveredArea === 'Aula 2' ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredArea('Aula 2')}
                  onMouseLeave={() => setHoveredArea(null)}
                >
                  <span className="room-name">Aula 2</span>
                  {hoveredArea === 'Aula 2' && (
                    <div className="room-tooltip">
                      <strong>Aula 2</strong>
                      <p>Capacidad: 45 personas</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="room-row">
                <div 
                  className={`room aula ${hoveredArea === 'Aula 3' ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredArea('Aula 3')}
                  onMouseLeave={() => setHoveredArea(null)}
                >
                  <span className="room-name">Aula 3</span>
                  {hoveredArea === 'Aula 3' && (
                    <div className="room-tooltip">
                      <strong>Aula 3</strong>
                      <p>Capacidad: 25 personas</p>
                    </div>
                  )}
                </div>

                <div 
                  className={`room aula ${hoveredArea === 'Aula 4' ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredArea('Aula 4')}
                  onMouseLeave={() => setHoveredArea(null)}
                >
                  <span className="room-name">Aula 4</span>
                  {hoveredArea === 'Aula 4' && (
                    <div className="room-tooltip">
                      <strong>Aula 4</strong>
                      <p>Capacidad: 30 personas</p>
                    </div>
                  )}
                </div>
              </div>

              <div 
                className={`room auditorio ${hoveredArea === 'Auditorio' ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredArea('Auditorio')}
                onMouseLeave={() => setHoveredArea(null)}
              >
                <span className="room-name">Auditorio</span>
                {hoveredArea === 'Auditorio' && (
                  <div className="room-tooltip">
                    <strong>Auditorio</strong>
                    <p>Capacidad: 90 personas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Menu;