// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  // Verificar sesión
  const usuario = verificarSesion();
  
  // Cargar datos
  cargarDatos();
  
  // Configurar tabs
  const tabs = new bootstrap.Tab(document.querySelector('[data-bs-target="#tab-turnos"]'));
  tabs.show();
  
  // Event listeners
  document.getElementById('busqueda-turnos').addEventListener('input', buscarTurnos);
  
  // Cargar datos iniciales
  cargarTurnos();
});

// Datos (persistencia con localStorage)
let pacientes = JSON.parse(localStorage.getItem('pacientes')) || [];
let turnos = JSON.parse(localStorage.getItem('turnos')) || [];

function guardarDatos() {
  localStorage.setItem('pacientes', JSON.stringify(pacientes));
  localStorage.setItem('turnos', JSON.stringify(turnos));
}

// Funciones para turnos
function cargarTurnos(filtro = '') {
  const tbody = document.getElementById('tabla-turnos');
  tbody.innerHTML = '';
  
  const turnosFiltrados = turnos.filter(turno => 
    !filtro || 
    turno.pacienteNombre.toLowerCase().includes(filtro.toLowerCase()) ||
    turno.tipo.toLowerCase().includes(filtro.toLowerCase())
  );
  
  if (turnosFiltrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-muted">
          <i class="fas fa-calendar-times fa-2x mb-2"></i><br>
          No se encontraron turnos
        </td>
      </tr>
    `;
    return;
  }
  
  turnosFiltrados.forEach(turno => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(turno.fecha).toLocaleString()}</td>
      <td>${turno.pacienteNombre}</td>
      <td><span class="badge bg-primary">${turno.tipo}</span></td>
      <td><span class="badge ${turno.completado ? 'bg-success' : 'bg-warning'}">
        ${turno.completado ? 'Completado' : 'Pendiente'}
      </span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="verFicha('${turno.pacienteRut}')">
          <i class="fas fa-file-medical"></i>
        </button>
        <button class="btn btn-sm btn-outline-success me-1" onclick="marcarCompletado(${turno.id})">
          <i class="fas fa-check"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarTurno(${turno.id})">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function buscarTurnos() {
  const filtro = document.getElementById('busqueda-turnos').value;
  cargarTurnos(filtro);
}

// Funciones para pacientes
// ... (similar a turnos pero para gestión de pacientes)

// Funciones comunes
function mostrarAlerta(mensaje, tipo) {
  // Implementación similar a auth.js
}

// Inicializar al cargar
if (document.getElementById('tabla-turnos')) {
  cargarTurnos();
}