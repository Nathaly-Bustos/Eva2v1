document.addEventListener('DOMContentLoaded', function() {
  // =============================================
  // DATOS Y ESTADO
  // =============================================
  let pacientes = JSON.parse(localStorage.getItem('pacientes')) || [];
  let turnos = JSON.parse(localStorage.getItem('turnos')) || [];
  let recetas = JSON.parse(localStorage.getItem('recetas')) || [];
  let editingPacienteId = null;
  let disponibilidad = JSON.parse(localStorage.getItem('disponibilidad')) || [];
  let configuracionTurnos = JSON.parse(localStorage.getItem('configuracionTurnos')) || {
    dias: [0, 1, 2, 3, 4], // Lunes a Viernes por defecto
    horaInicio: "08:00",
    horaFin: "17:00",
    duracionTurno: "30"
  };

  // Datos del desarrollo fetal
  const fetalDevelopmentData = {
    4: { image: 'https://example.com/fetal-week4.png', size: '0.5 cm', description: 'El embrión comienza a desarrollar los primeros rasgos faciales.' },
    8: { image: 'https://example.com/fetal-week8.png', size: '1.6 cm', description: 'Todos los órganos principales han comenzado a formarse.' },
    12: { image: 'https://example.com/fetal-week12.png', size: '5.4 cm', description: 'Los reflejos comienzan a desarrollarse.' },
    16: { image: 'https://example.com/fetal-week16.png', size: '11.6 cm', description: 'El bebé puede hacer movimientos con la boca.' },
    20: { image: 'https://example.com/fetal-week20.png', size: '16.4 cm', description: 'El bebé puede oír sonidos del exterior.' },
    24: { image: 'https://example.com/fetal-week24.png', size: '30 cm', description: 'Los pulmones comienzan a desarrollarse.' },
    28: { image: 'https://example.com/fetal-week28.png', size: '37.6 cm', description: 'El bebé puede abrir y cerrar los ojos.' },
    32: { image: 'https://example.com/fetal-week32.png', size: '42.4 cm', description: 'Los huesos están completamente formados pero aún blandos.' },
    36: { image: 'https://example.com/fetal-week36.png', size: '47.4 cm', description: 'El bebé se está preparando para el parto.' },
    40: { image: 'https://example.com/fetal-week40.png', size: '51.2 cm', description: '¡El bebé está listo para nacer!' }
  };

  // =============================================
  // FUNCIONES DE INICIALIZACIÓN
  // =============================================
  
  function init() {
    setupEventListeners();
    cargarPacientes();
    cargarTurnos();
    cargarDashboard();
    inicializarGrafico();
    inicializarCalendario();
  }

  function setupEventListeners() {
    // Calculadora
    if (document.getElementById('fur')) {
      document.getElementById('fur').addEventListener('change', calcularGestacion);
    }
    if (document.getElementById('form-calculadora')) {
      document.getElementById('form-calculadora').addEventListener('submit', function(e) {
        e.preventDefault();
        calcularGestacion();
      });
    }

    // Pacientes
    if (document.getElementById('btn-nuevo-paciente')) {
      document.getElementById('btn-nuevo-paciente').addEventListener('click', mostrarFormPaciente);
    }
    if (document.getElementById('btn-cancelar-paciente')) {
      document.getElementById('btn-cancelar-paciente').addEventListener('click', ocultarFormPaciente);
    }
    if (document.getElementById('form-paciente')) {
      document.getElementById('form-paciente').addEventListener('submit', guardarPaciente);
    }

    // Recetas
    if (document.getElementById('form-receta')) {
      document.getElementById('form-receta').addEventListener('submit', generarReceta);
    }

    // Nuevo Control
    if (document.getElementById('btn-nuevo-control')) {
      document.getElementById('btn-nuevo-control').addEventListener('click', mostrarModalNuevoControl);
    }

    // Configuración de turnos
    if (document.getElementById('btn-nueva-configuracion')) {
      document.getElementById('btn-nueva-configuracion').addEventListener('click', mostrarModalConfiguracion);
    }

    // Nuevo Turno
    if (document.getElementById('btn-nuevo-turno')) {
      document.getElementById('btn-nuevo-turno').addEventListener('click', mostrarModalNuevoTurno);
    }
  }

  // =============================================
  // FUNCIONES PARA GESTIÓN DE PACIENTES
  // =============================================
  function mostrarFormPaciente() {
    const form = document.getElementById('form-paciente');
    const btnNuevo = document.getElementById('btn-nuevo-paciente');
    
    if (form && btnNuevo) {
      form.classList.remove('d-none');
      btnNuevo.classList.add('d-none');
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function ocultarFormPaciente() {
    const form = document.getElementById('form-paciente');
    const btnNuevo = document.getElementById('btn-nuevo-paciente');
    
    if (form && btnNuevo) {
      form.classList.add('d-none');
      btnNuevo.classList.remove('d-none');
      form.reset();
      editingPacienteId = null;
    }
  }

  function guardarPaciente(e) {
    e.preventDefault();
    
    const paciente = {
      id: editingPacienteId || Date.now(),
      rut: document.getElementById('rut-paciente').value,
      nombre: document.getElementById('nombre-paciente').value,
      fechaNacimiento: document.getElementById('fecha-nacimiento').value,
      telefono: document.getElementById('telefono-paciente').value,
      fechaRegistro: new Date().toISOString()
    };

    if (editingPacienteId) {
      const index = pacientes.findIndex(p => p.id === editingPacienteId);
      if (index !== -1) {
        pacientes[index] = paciente;
      }
    } else {
      pacientes.push(paciente);
    }

    localStorage.setItem('pacientes', JSON.stringify(pacientes));
    mostrarAlerta(`Paciente ${editingPacienteId ? 'actualizado' : 'registrado'} correctamente`, 'success');
    cargarPacientes();
    ocultarFormPaciente();
  }

  function cargarPacientes() {
    const tbody = document.getElementById('lista-pacientes');
    if (!tbody) return;

    tbody.innerHTML = pacientes.map(paciente => {
      const edad = paciente.fechaNacimiento ? calcularEdad(paciente.fechaNacimiento) : 'N/A';
      
      return `
        <tr>
          <td>${paciente.rut}</td>
          <td>${paciente.nombre}</td>
          <td>${edad}</td>
          <td>
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-primary" onclick="editarPaciente(${paciente.id})">
                <i class="material-icons">edit</i>
              </button>
              <button class="btn btn-info" onclick="verFichaPaciente(${paciente.id})">
                <i class="material-icons">medical_services</i>
              </button>
              <button class="btn btn-success" onclick="agendarControl(${paciente.id})">
                <i class="material-icons">event</i>
              </button>
              <button class="btn btn-danger" onclick="eliminarPaciente(${paciente.id})">
                <i class="material-icons">delete</i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (document.getElementById('total-pacientes')) {
      document.getElementById('total-pacientes').textContent = pacientes.length;
    }
  }

  // =============================================
  // FUNCIONES PARA FICHAS Y CONTROLES
  // =============================================
  window.verFichaPaciente = function(pacienteId) {
    const paciente = pacientes.find(p => p.id == pacienteId);
    if (!paciente) return;

    if (!document.getElementById('modal-ficha')) {
      const modalHTML = `
        <div class="modal fade" id="modal-ficha" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Ficha Paciente</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body" id="contenido-ficha">
                <!-- Contenido dinámico -->
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const modalContent = document.getElementById('contenido-ficha');
    const tieneFichaCompleta = paciente.fichaMedica && Object.keys(paciente.fichaMedica).length > 0;
    
    if (tieneFichaCompleta) {
      modalContent.innerHTML = `
        <div class="row">
          <div class="col-md-6">
            <h4>${paciente.nombre}</h4>
            <p><strong>RUT:</strong> ${paciente.rut}</p>
            <p><strong>Fecha Nacimiento:</strong> ${paciente.fechaNacimiento || 'No registrada'}</p>
            <p><strong>Teléfono:</strong> ${paciente.telefono || 'No registrado'}</p>
          </div>
          <div class="col-md-6">
            <h5><i class="material-icons me-2">medical_services</i> Ficha Médica</h5>
            <div class="card">
              <div class="card-body">
                <p><strong>Alergias:</strong> ${paciente.fichaMedica.alergias || 'No registradas'}</p>
                <p><strong>Antecedentes:</strong> ${paciente.fichaMedica.antecedentes || 'No registrados'}</p>
                <p><strong>Medicamentos:</strong> ${paciente.fichaMedica.medicamentos || 'No registrados'}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      modalContent.innerHTML = `
        <h4>Crear Ficha Médica para ${paciente.nombre}</h4>
        <form id="form-ficha-medica">
          <div class="mb-3">
            <label class="form-label">Alergias conocidas</label>
            <textarea class="form-control" rows="2" name="alergias"></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Antecedentes médicos</label>
            <textarea class="form-control" rows="3" name="antecedentes"></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Medicamentos habituales</label>
            <textarea class="form-control" rows="2" name="medicamentos"></textarea>
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Ficha</button>
          </div>
        </form>
      `;

      document.getElementById('form-ficha-medica').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        paciente.fichaMedica = {
          alergias: formData.get('alergias'),
          antecedentes: formData.get('antecedentes'),
          medicamentos: formData.get('medicamentos'),
          fechaActualizacion: new Date().toISOString()
        };
        
        const index = pacientes.findIndex(p => p.id == paciente.id);
        pacientes[index] = paciente;
        localStorage.setItem('pacientes', JSON.stringify(pacientes));
        
        mostrarAlerta('Ficha médica creada exitosamente', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-ficha')).hide();
      });
    }

    new bootstrap.Modal(document.getElementById('modal-ficha')).show();
  };

  window.agendarControl = function(pacienteId) {
    const paciente = pacientes.find(p => p.id == pacienteId);
    if (!paciente) return;

    if (!document.getElementById('modal-ficha')) {
      const modalHTML = `
        <div class="modal fade" id="modal-ficha" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Agendar Control</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body" id="contenido-ficha">
                <!-- Contenido dinámico -->
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const modalContent = document.getElementById('contenido-ficha');
    modalContent.innerHTML = `
      <h4>Agendar Control para ${paciente.nombre}</h4>
      <form id="form-agendar-control">
        <div class="mb-3">
          <label class="form-label">Tipo de Control</label>
          <select class="form-select" name="tipoControl" required>
            <option value="">Seleccione un tipo</option>
            <option value="control_rutina">Control de Rutina</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="emergencia">Emergencia</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Fecha y Hora</label>
          <input type="datetime-local" class="form-control" name="fechaHora" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Observaciones</label>
          <textarea class="form-control" rows="3" name="observaciones"></textarea>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">Agendar</button>
        </div>
      </form>
    `;

    const fechaInput = modalContent.querySelector('input[name="fechaHora"]');
    if (fechaInput) {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localISOTime = new Date(now - offset).toISOString().slice(0, 16);
      fechaInput.min = localISOTime;
    }

    document.getElementById('form-agendar-control').addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      
      const nuevoControl = {
        id: Date.now(),
        pacienteId: paciente.id,
        pacienteNombre: paciente.nombre,
        tipo: formData.get('tipoControl'),
        fechaHora: formData.get('fechaHora'),
        observaciones: formData.get('observaciones'),
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString()
      };
      
      turnos.push(nuevoControl);
      localStorage.setItem('turnos', JSON.stringify(turnos));
      
      mostrarAlerta('Control agendado exitosamente', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-ficha')).hide();
      cargarTurnos();
      cargarDashboard();
    });

    new bootstrap.Modal(document.getElementById('modal-ficha')).show();
  };

  function mostrarModalNuevoControl() {
    if (!document.getElementById('modal-ficha')) {
      const modalHTML = `
        <div class="modal fade" id="modal-ficha" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Agendar Nuevo Control</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body" id="contenido-ficha"></div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const modalContent = document.getElementById('contenido-ficha');
    modalContent.innerHTML = `
      <h4>Agendar Nuevo Control</h4>
      <form id="form-nuevo-control">
        <div class="mb-3">
          <label class="form-label">Paciente</label>
          <select class="form-select" id="select-paciente" required>
            <option value="">Seleccione un paciente</option>
            ${pacientes.map(p => `<option value="${p.id}">${p.nombre} (${p.rut})</option>`).join('')}
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Tipo de Control</label>
          <select class="form-select" name="tipoControl" required>
            <option value="">Seleccione un tipo</option>
            <option value="control_rutina">Control de Rutina</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="emergencia">Emergencia</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Fecha y Hora</label>
          <input type="datetime-local" class="form-control" name="fechaHora" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Observaciones</label>
          <textarea class="form-control" rows="3" name="observaciones"></textarea>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">Agendar</button>
        </div>
      </form>
    `;

    const fechaInput = modalContent.querySelector('input[name="fechaHora"]');
    if (fechaInput) {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localISOTime = new Date(now - offset).toISOString().slice(0, 16);
      fechaInput.min = localISOTime;
    }

    document.getElementById('form-nuevo-control').addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const pacienteId = document.getElementById('select-paciente').value;
      const paciente = pacientes.find(p => p.id == pacienteId);

      if (!paciente) {
        mostrarAlerta('Debe seleccionar un paciente válido', 'danger');
        return;
      }

      const nuevoControl = {
        id: Date.now(),
        pacienteId: paciente.id,
        pacienteNombre: paciente.nombre,
        tipo: formData.get('tipoControl'),
        fechaHora: formData.get('fechaHora'),
        observaciones: formData.get('observaciones'),
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString()
      };
      
      turnos.push(nuevoControl);
      localStorage.setItem('turnos', JSON.stringify(turnos));
      
      mostrarAlerta('Control agendado exitosamente', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-ficha')).hide();
      cargarTurnos();
      cargarDashboard();
    });

    new bootstrap.Modal(document.getElementById('modal-ficha')).show();
  }

  // =============================================
  // FUNCIONES GLOBALES
  // =============================================
  window.editarPaciente = function(id) {
    const paciente = pacientes.find(p => p.id === id);
    if (!paciente) return;

    editingPacienteId = id;
    document.getElementById('rut-paciente').value = paciente.rut;
    document.getElementById('nombre-paciente').value = paciente.nombre;
    document.getElementById('fecha-nacimiento').value = paciente.fechaNacimiento || '';
    document.getElementById('telefono-paciente').value = paciente.telefono || '';
    
    mostrarFormPaciente();
  };

  window.eliminarPaciente = function(id) {
    if (!confirm('¿Está segura que desea eliminar este paciente?')) return;
    
    pacientes = pacientes.filter(p => p.id !== id);
    localStorage.setItem('pacientes', JSON.stringify(pacientes));
    mostrarAlerta('Paciente eliminado correctamente', 'success');
    cargarPacientes();
  };

  function calcularEdad(fechaNacimiento) {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return `${edad} años`;
  }

  // =============================================
  // FUNCIONES PARA LA CALCULADORA DE GESTACIÓN
  // =============================================
  function calcularGestacion() {
    const furInput = document.getElementById('fur');
    if (!furInput || !furInput.value) return;

    const fur = new Date(furInput.value);
    const hoy = new Date();
    
    // Calcular FPP (FUR + 280 días)
    const fpp = new Date(fur);
    fpp.setDate(fur.getDate() + 280);
    
    // Mostrar FPP
    if (document.getElementById('fpp')) {
      document.getElementById('fpp').value = fpp.toLocaleDateString();
    }
    
    // Calcular semanas de gestación
    const diffTime = hoy - fur;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(diffDays / 7);
    const dias = diffDays % 7;
    
    // Actualizar progreso
    const porcentaje = Math.min(Math.floor((diffDays / 280) * 100), 100);
    if (document.getElementById('gestation-progress')) {
      document.getElementById('gestation-progress').style.width = `${porcentaje}%`;
    }
    
    // Mostrar semanas
    if (document.getElementById('semanas-gestacion')) {
      document.getElementById('semanas-gestacion').textContent = `${semanas} semanas y ${dias} días`;
    }
    
    // Mostrar imagen fetal correspondiente
    actualizarImagenFetal(semanas);
  }

  function actualizarImagenFetal(semanas) {
    const semanaKey = Math.min(Math.max(semanas, 4), 40);
    const data = fetalDevelopmentData[semanaKey] || fetalDevelopmentData[4];
    
    if (document.getElementById('fetal-image')) {
      document.getElementById('fetal-image').src = data.image;
    }
    
    if (document.getElementById('gestation-badge')) {
      document.getElementById('gestation-badge').textContent = `${semanaKey} semanas`;
    }
    
    if (document.getElementById('fetal-description')) {
      document.getElementById('fetal-description').innerHTML = `
        <p><strong>Tamaño aproximado:</strong> ${data.size}</p>
        <p>${data.description}</p>
      `;
    }
  }

  // =============================================
  // FUNCIONES PARA GESTIÓN DE TURNOS (MEJORADAS)
  // =============================================
  function cargarTurnos() {
    const tbody = document.getElementById('lista-controles');
    const tbodyTodos = document.getElementById('lista-todos-turnos');
    
    if (!tbody && !tbodyTodos) return;

    const ahora = new Date();
    const turnosPendientes = turnos
      .filter(t => t.fechaHora && new Date(t.fechaHora) > ahora)
      .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

    // Lista de controles pendientes (vista simplificada)
    if (tbody) {
      tbody.innerHTML = turnosPendientes.map(turno => {
        const fechaTurno = new Date(turno.fechaHora);
        return `
          <tr>
            <td>${turno.pacienteNombre}</td>
            <td>${formatTipoControl(turno.tipo)}</td>
            <td>${fechaTurno.toLocaleDateString()} ${fechaTurno.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td>${turno.matrona || 'No asignada'}</td>
            <td><span class="badge ${turno.estado === 'cancelado' ? 'bg-danger' : turno.estado === 'completado' ? 'bg-success' : 'bg-warning'}">${turno.estado}</span></td>
            <td>
              <button class="btn btn-sm btn-primary me-1" onclick="mostrarDetalleTurnoDesdeLista(${turno.id})">
                <i class="material-icons">visibility</i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="cancelarTurno(${turno.id})">
                <i class="material-icons">close</i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Lista completa de todos los turnos (nueva funcionalidad)
    if (tbodyTodos) {
      const todosLosTurnos = [...turnos].sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
      
      tbodyTodos.innerHTML = todosLosTurnos.map(turno => {
        const fechaTurno = turno.fechaHora ? new Date(turno.fechaHora) : null;
        const fechaStr = fechaTurno ? 
          `${fechaTurno.toLocaleDateString()} ${fechaTurno.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 
          'Sin fecha';
        
        return `
          <tr>
            <td>${turno.pacienteNombre}</td>
            <td>${formatTipoControl(turno.tipo)}</td>
            <td>${fechaStr}</td>
            <td>${turno.matrona || 'No asignada'}</td>
            <td><span class="badge ${turno.estado === 'cancelado' ? 'bg-danger' : turno.estado === 'completado' ? 'bg-success' : 'bg-warning'}">${turno.estado}</span></td>
            <td>
              <button class="btn btn-sm btn-primary me-1" onclick="mostrarDetalleTurnoDesdeLista(${turno.id})">
                <i class="material-icons">visibility</i>
              </button>
              <button class="btn btn-sm ${turno.estado === 'cancelado' ? 'btn-secondary' : 'btn-danger'}" onclick="cancelarTurno(${turno.id})" ${turno.estado === 'cancelado' ? 'disabled' : ''}>
                <i class="material-icons">${turno.estado === 'cancelado' ? 'block' : 'close'}</i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Función para ver detalles desde la lista
  window.mostrarDetalleTurnoDesdeLista = function(turnoId) {
    const turno = turnos.find(t => t.id == turnoId);
    if (!turno) return;

    // Crear un evento fake para usar la función existente
    const eventoFake = {
      id: turno.id,
      start: turno.fechaHora ? new Date(turno.fechaHora) : new Date(),
      extendedProps: {
        paciente: turno.pacienteNombre,
        tipo: turno.tipo,
        estado: turno.estado,
        observaciones: turno.observaciones,
        matrona: turno.matrona
      }
    };

    mostrarDetalleTurno(eventoFake);
  };

  function formatTipoControl(tipo) {
    const tipos = {
      'control_rutina': 'Control de Rutina',
      'seguimiento': 'Seguimiento',
      'emergencia': 'Emergencia',
      'control': 'Control Prenatal',
      'consulta': 'Consulta General',
      'ecografia': 'Ecografía'
    };
    return tipos[tipo] || tipo;
  }

  function getColorForAppointmentType(type) {
    const colors = {
      'control': '#28a745',
      'control_rutina': '#28a745',
      'consulta': '#17a2b8',
      'emergencia': '#dc3545',
      'ecografia': '#ffc107',
      'seguimiento': '#6f42c1'
    };
    return colors[type] || '#6c757d';
  }

  window.cancelarTurno = function(id) {
    if (!confirm('¿Cancelar este turno?')) return;
    
    const turno = turnos.find(t => t.id == id);
    if (turno) {
      turno.estado = 'cancelado';
      localStorage.setItem('turnos', JSON.stringify(turnos));
      mostrarAlerta('Turno cancelado', 'success');
      cargarTurnos();
      cargarDashboard();
      if (window.calendar) {
        window.calendar.refetchEvents();
      }
    }
  };

  function mostrarModalConfiguracion() {
    if (!document.getElementById('modal-configuracion')) {
      const modalHTML = `
        <div class="modal fade" id="modal-configuracion" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Configurar Disponibilidad</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body" id="contenido-configuracion">
                <form id="form-configuracion">
                  <div class="mb-3">
                    <label class="form-label">Seleccione los días de atención</label>
                    <div class="d-flex flex-wrap gap-3">
                      ${['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((dia, index) => `
                        <div class="form-check form-check-inline">
                          <input class="form-check-input" type="checkbox" id="dia-${index}" 
                                 name="dias" value="${index}" ${configuracionTurnos.dias?.includes(index) ? 'checked' : ''}>
                          <label class="form-check-label" for="dia-${index}">${dia}</label>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Horario de atención</label>
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label class="form-label">Hora inicio</label>
                        <input type="time" class="form-control" name="horaInicio" 
                               value="${configuracionTurnos.horaInicio || '08:00'}">
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Hora fin</label>
                        <input type="time" class="form-control" name="horaFin" 
                               value="${configuracionTurnos.horaFin || '17:00'}">
                      </div>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Duración de turnos (minutos)</label>
                    <input type="number" class="form-control" name="duracionTurno" 
                           value="${configuracionTurnos.duracionTurno || '30'}" min="15" max="120">
                  </div>
                  <div class="d-flex justify-content-end gap-2">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Configuración</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    document.getElementById('form-configuracion').addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      
      configuracionTurnos = {
        dias: Array.from(formData.getAll('dias')).map(Number),
        horaInicio: formData.get('horaInicio'),
        horaFin: formData.get('horaFin'),
        duracionTurno: formData.get('duracionTurno'),
        matronaId: JSON.parse(localStorage.getItem('usuarioActual')).username
      };
      
      localStorage.setItem('configuracionTurnos', JSON.stringify(configuracionTurnos));
      mostrarAlerta('Configuración guardada exitosamente', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-configuracion')).hide();
      inicializarCalendario();
    });

    new bootstrap.Modal(document.getElementById('modal-configuracion')).show();
  }

  function mostrarModalNuevoTurno() {
    if (!document.getElementById('modal-turno')) {
      const modalHTML = `
        <div class="modal fade" id="modal-turno" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Agendar Nuevo Turno</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body" id="contenido-turno">
                <form id="form-nuevo-turno">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label">Paciente</label>
                      <select class="form-select" id="select-paciente-turno" required>
                        <option value="">Seleccione un paciente</option>
                        ${pacientes.map(p => `<option value="${p.id}">${p.nombre} (${p.rut})</option>`).join('')}
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Tipo de Consulta</label>
                      <select class="form-select" name="tipoConsulta" required>
                        <option value="">Seleccione tipo</option>
                        <option value="control">Control Prenatal</option>
                        <option value="consulta">Consulta General</option>
                        <option value="emergencia">Emergencia</option>
                        <option value="ecografia">Ecografía</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Fecha</label>
                      <input type="date" class="form-control" id="fecha-turno" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Hora</label>
                      <select class="form-select" id="hora-turno" required>
                        <option value="">Seleccione hora</option>
                      </select>
                      <div id="feedback-horario" class="invalid-feedback"></div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Matrona</label>
                      <select class="form-select" name="matrona" id="select-matrona" required>
                        <option value="">Seleccione matrona</option>
                        <option value="matrona1">Dra. Pérez</option>
                        <option value="matrona2">Dra. González</option>
                        <option value="matrona3">Dra. Martínez</option>
                      </select>
                    </div>
                    <div class="col-12">
                      <label class="form-label">Observaciones</label>
                      <textarea class="form-control" rows="3" name="observaciones"></textarea>
                    </div>
                  </div>
                  <div class="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Agendar Turno</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Llenar horas disponibles con validación de conflictos
    document.getElementById('fecha-turno').addEventListener('change', function() {
      const fechaSeleccionada = new Date(this.value);
      const diaSemana = fechaSeleccionada.getDay();
      const selectHora = document.getElementById('hora-turno');
      const selectMatrona = document.getElementById('select-matrona');
      
      selectHora.innerHTML = '<option value="">Seleccione hora</option>';
      
      if (!configuracionTurnos.dias || !configuracionTurnos.dias.includes(diaSemana - 1)) {
        document.getElementById('feedback-horario').textContent = 'No hay atención este día';
        selectHora.setAttribute('disabled', 'disabled');
        return;
      }
      
      const horaInicio = configuracionTurnos.horaInicio || '08:00';
      const horaFin = configuracionTurnos.horaFin || '17:00';
      const duracion = parseInt(configuracionTurnos.duracionTurno) || 30;
      
      // Generar todas las horas posibles
      let horaActual = horaInicio;
      const horasDisponibles = [];
      
      while (horaActual < horaFin) {
        horasDisponibles.push(horaActual);
        
        // Sumar la duración del turno
        const [horas, minutos] = horaActual.split(':').map(Number);
        const fecha = new Date();
        fecha.setHours(horas, minutos + duracion, 0, 0);
        horaActual = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
      }
      
      // Filtrar horas ocupadas
      const matronaSeleccionada = selectMatrona.value;
      const turnosExistentes = turnos.filter(t => {
        if (!t.fechaHora || t.estado === 'cancelado') return false;
        
        const fechaTurno = new Date(t.fechaHora);
        return fechaTurno.toDateString() === fechaSeleccionada.toDateString() && 
               t.matrona === matronaSeleccionada;
      });
      
      const horasOcupadas = turnosExistentes.map(t => {
        const fechaTurno = new Date(t.fechaHora);
        return fechaTurno.toTimeString().substring(0, 5);
      });
      
      // Mostrar solo horas disponibles
      horasDisponibles.forEach(hora => {
        if (!horasOcupadas.includes(hora)) {
          const option = document.createElement('option');
          option.value = hora;
          option.textContent = hora;
          selectHora.appendChild(option);
        }
      });
      
      if (selectHora.options.length <= 1) {
        document.getElementById('feedback-horario').textContent = 'No hay horarios disponibles para esta matrona';
      } else {
        document.getElementById('feedback-horario').textContent = '';
      }
      
      selectHora.removeAttribute('disabled');
    });
    
    // Actualizar horas cuando cambia la matrona
    document.getElementById('select-matrona').addEventListener('change', function() {
      const fechaInput = document.getElementById('fecha-turno');
      if (fechaInput.value) {
        fechaInput.dispatchEvent(new Event('change'));
      }
    });

    document.getElementById('form-nuevo-turno').addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const pacienteId = document.getElementById('select-paciente-turno').value;
      const paciente = pacientes.find(p => p.id == pacienteId);
      
      if (!paciente) {
        mostrarAlerta('Debe seleccionar un paciente válido', 'danger');
        return;
      }

      const fecha = document.getElementById('fecha-turno').value;
      const hora = document.getElementById('hora-turno').value;
      const matrona = formData.get('matrona');
      
      // Validar que no se haya ocupado el turno recientemente
      const fechaHoraStr = `${fecha}T${hora}:00`;
      const turnoExistente = turnos.find(t => 
        t.fechaHora === fechaHoraStr && 
        t.matrona === matrona &&
        t.estado !== 'cancelado'
      );
      
      if (turnoExistente) {
        mostrarAlerta('Este horario ya fue asignado a otra paciente', 'danger');
        return;
      }

      const nuevoTurno = {
        id: Date.now(),
        title: `${paciente.nombre} - ${formData.get('tipoConsulta')}`,
        start: fechaHoraStr,
        pacienteId: paciente.id,
        pacienteNombre: paciente.nombre,
        tipo: formData.get('tipoConsulta'),
        matrona: matrona,
        observaciones: formData.get('observaciones'),
        estado: 'pendiente',
        backgroundColor: getColorForAppointmentType(formData.get('tipoConsulta'))
      };
      
      turnos.push(nuevoTurno);
      localStorage.setItem('turnos', JSON.stringify(turnos));
      
      mostrarAlerta('Turno agendado exitosamente', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-turno')).hide();
      cargarTurnos();
      inicializarCalendario();
    });

    new bootstrap.Modal(document.getElementById('modal-turno')).show();
  }

  function inicializarCalendario() {
    // En el archivo app.js, reemplaza la función inicializarCalendario() con esta versión corregida:

function inicializarCalendario() {
  const calendarEl = document.getElementById('calendario-turnos');
  if (!calendarEl) return;

  // Destruir calendario existente si hay uno
  if (window.calendar) {
      window.calendar.destroy();
  }

  // Formatear eventos de manera compatible
  const eventos = turnos.map(turno => {
      let fechaEvento;
      try {
          fechaEvento = turno.start ? new Date(turno.start) : 
                       turno.fechaHora ? new Date(turno.fechaHora) : new Date();
          
          if (isNaN(fechaEvento.getTime())) {
              console.warn('Fecha inválida detectada, usando fecha actual', turno);
              fechaEvento = new Date();
          }
      } catch (e) {
          console.error('Error al parsear fecha:', e);
          fechaEvento = new Date();
      }

      return {
          id: String(turno.id || Date.now()),
          title: `${turno.pacienteNombre || 'Paciente'} - ${formatTipoControl(turno.tipo)}`,
          start: fechaEvento,
          backgroundColor: getColorForAppointmentType(turno.tipo),
          extendedProps: {
              paciente: turno.pacienteNombre,
              tipo: turno.tipo,
              estado: turno.estado || 'pendiente',
              observaciones: turno.observaciones,
              matrona: turno.matrona
          }
      };
  });

  // Configuración del calendario
  window.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'es',
      timeZone: 'local',
      headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      events: eventos,
      eventClick: function(info) {
          mostrarDetalleTurno(info.event);
      },
      eventDidMount: function(info) {
          if (info.event.extendedProps.observaciones) {
              new bootstrap.Tooltip(info.el, {
                  title: info.event.extendedProps.observaciones,
                  placement: 'top',
                  trigger: 'hover',
                  container: 'body'
              });
          }
      },
      datesSet: function() {
          setTimeout(() => {
              try {
                  window.calendar.updateSize();
              } catch (e) {
                  console.log('Error al actualizar tamaño:', e);
              }
          }, 100);
      },
      eventDisplay: 'block',
      eventTimeFormat: { 
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
      },
      nowIndicator: true,
      navLinks: true,
      dayMaxEvents: true,
      editable: true
  });

  // Renderizar el calendario
  window.calendar.render();
  
  // Asegurarse de que el calendario se redibuje correctamente
  setTimeout(() => {
      window.calendar.updateSize();
  }, 500);
}

// También asegúrate de que esta función esté disponible para formatear los tipos de control
function formatTipoControl(tipo) {
  const tipos = {
      'control_rutina': 'Control de Rutina',
      'seguimiento': 'Seguimiento',
      'emergencia': 'Emergencia',
      'control': 'Control Prenatal',
      'consulta': 'Consulta General',
      'ecografia': 'Ecografía'
  };
  return tipos[tipo] || tipo;
}

// Y esta función para los colores de los eventos
function getColorForAppointmentType(type) {
  const colors = {
      'control': '#28a745',
      'control_rutina': '#28a745',
      'consulta': '#17a2b8',
      'emergencia': '#dc3545',
      'ecografia': '#ffc107',
      'seguimiento': '#6f42c1'
  };
  return colors[type] || '#6c757d';
}

    // Renderizado del calendario
    function renderCalendario() {
      try {
        window.calendar.render();
        
        setTimeout(() => {
          window.calendar.updateSize();
          calendarEl.style.opacity = '1';
        }, 200);
      } catch (error) {
        console.error('Error al renderizar calendario:', error);
        setTimeout(renderCalendario, 300);
      }
    }

    calendarEl.style.opacity = '0';
    renderCalendario();
  }

  function mostrarDetalleTurno(event) {
    if (!document.getElementById('modal-detalle-turno')) {
      const modalHTML = `
        <div class="modal fade" id="modal-detalle-turno" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header bg-primary text-white">
                <h5 class="modal-title">Detalles del Turno</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body" id="contenido-detalle-turno"></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                  <i class="material-icons me-1">close</i> Cerrar
                </button>
                <button type="button" class="btn btn-danger" id="btn-cancelar-turno">
                  <i class="material-icons me-1">cancel</i> Cancelar Turno
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const turno = event.extendedProps;
    const fecha = new Date(event.start);
    const tipo = formatTipoControl(turno.tipo);
    
    const modalContent = document.getElementById('contenido-detalle-turno');
    modalContent.innerHTML = `
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex align-items-center mb-3">
            <div class="badge bg-${turno.tipo === 'emergencia' ? 'danger' : 'primary'} me-3 p-2">
              <i class="material-icons">event</i>
            </div>
            <div>
              <h4 class="mb-0">${turno.paciente}</h4>
              <span class="text-muted">${tipo}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row g-3">
        <div class="col-md-6">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body">
              <h6 class="card-title text-primary">
                <i class="material-icons me-2">schedule</i> Fecha y Hora
              </h6>
              <p class="card-text">
                ${fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                <br>
                ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body">
              <h6 class="card-title text-primary">
                <i class="material-icons me-2">person</i> Profesional
              </h6>
              <p class="card-text">${turno.matrona || 'No asignada'}</p>
            </div>
          </div>
        </div>
        
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h6 class="card-title text-primary">
                <i class="material-icons me-2">info</i> Estado
              </h6>
              <span class="badge ${turno.estado === 'cancelado' ? 'bg-danger' : 'bg-success'} p-2">
                ${turno.estado}
              </span>
            </div>
          </div>
        </div>
        
        ${turno.observaciones ? `
          <div class="col-12">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="card-title text-primary">
                  <i class="material-icons me-2">notes</i> Observaciones
                </h6>
                <p class="card-text">${turno.observaciones}</p>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('modal-detalle-turno'));
    modal.show();

    document.getElementById('btn-cancelar-turno').addEventListener('click', function() {
      if (confirm('¿Está segura que desea cancelar este turno?')) {
        const turnoActualizado = turnos.find(t => t.id == event.id);
        if (turnoActualizado) {
          turnoActualizado.estado = 'cancelado';
          turnoActualizado.backgroundColor = '#dc3545';
          localStorage.setItem('turnos', JSON.stringify(turnos));
          inicializarCalendario();
          cargarTurnos();
        }
        modal.hide();
        mostrarAlerta('Turno cancelado exitosamente', 'success');
      }
    });
  }

  // =============================================
  // FUNCIONES PARA RECETAS MÉDICAS
  // =============================================
  function generarReceta(e) {
    e.preventDefault();
    
    const paciente = document.getElementById('nombre-receta').value;
    const medicamento = document.getElementById('medicamento-receta').value;
    const dosis = document.getElementById('dosis-receta').value;
    const indicaciones = document.getElementById('indicaciones-receta').value;
    
    const nuevaReceta = {
      id: Date.now(),
      paciente: paciente,
      medicamento: medicamento,
      dosis: dosis,
      indicaciones: indicaciones,
      fechaEmision: new Date().toISOString(),
      matrona: JSON.parse(localStorage.getItem('usuarioActual')).nombre
    };
    
    recetas.push(nuevaReceta);
    localStorage.setItem('recetas', JSON.stringify(recetas));
    
    const vistaReceta = document.getElementById('vista-receta');
    vistaReceta.innerHTML = `
      <div class="text-center mb-4">
        <h4><i class="material-icons me-2">medical_services</i> Receta Médica</h4>
        <p class="text-muted">${new Date().toLocaleDateString()}</p>
      </div>
      <div class="mb-3">
        <p><strong>Paciente:</strong> ${paciente}</p>
        <p><strong>Medicamento:</strong> ${medicamento}</p>
        <p><strong>Dosis:</strong> ${dosis}</p>
        <p><strong>Indicaciones:</strong> ${indicaciones}</p>
      </div>
      <div class="mt-4 pt-3 border-top text-end">
        <p class="mb-0"><strong>Matrona:</strong> ${nuevaReceta.matrona}</p>
      </div>
    `;
    
    vistaReceta.classList.remove('d-none');
    document.getElementById('acciones-receta').classList.remove('d-none');
    
    // Configurar descarga PDF
    document.getElementById('btn-descargar-receta').addEventListener('click', function() {
      const element = vistaReceta;
      const opt = {
        margin: 10,
        filename: `receta_${paciente}_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save();
    });
  }

  // =============================================
  // FUNCIÓN PARA MOSTRAR ALERTAS
  // =============================================
  function mostrarAlerta(mensaje, tipo) {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alerta.style.zIndex = '1100';
    alerta.innerHTML = `
      <i class="material-icons me-2">${tipo === 'success' ? 'check_circle' : 'warning'}</i>
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alerta);
    setTimeout(() => alerta.remove(), 3000);
  }

  // =============================================
  // FUNCIONES PARA DASHBOARD
  // =============================================
  function cargarDashboard() {
    // Pacientes
    if (document.getElementById('total-pacientes')) {
      document.getElementById('total-pacientes').textContent = pacientes.length;
    }
    
    // Turnos hoy
    const hoy = new Date().toISOString().split('T')[0];
    const turnosHoy = turnos.filter(t => t.fechaHora && t.fechaHora.split('T')[0] === hoy).length;
    if (document.getElementById('turnos-hoy')) {
      document.getElementById('turnos-hoy').textContent = turnosHoy;
    }
    
    // Controles pendientes (turnos futuros)
    const ahora = new Date();
    const pendientes = turnos.filter(t => {
      if (!t.fechaHora) return false;
      const fechaTurno = new Date(t.fechaHora);
      return fechaTurno > ahora;
    }).length;
    
    if (document.getElementById('controles-pendientes')) {
      document.getElementById('controles-pendientes').textContent = pendientes;
    }
    
    // Recetas emitidas
    if (document.getElementById('recetas-emitidas')) {
      document.getElementById('recetas-emitidas').textContent = recetas.length;
    }
  }

  function inicializarGrafico() {
    const ctx = document.getElementById('grafico-dashboard');
    if (!ctx) return;
    
    const ultimosMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ultimosMeses,
        datasets: [{
          label: 'Controles realizados',
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: 'rgba(161, 13, 253, 0.5)',
          borderColor: 'rgba(13, 110, 253, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Actividad Mensual'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // Inicializar la aplicación
  init();
});
// Validaciones personalizadas de formularios para dashboard
document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    form.addEventListener('submit', event => {
      let isValid = form.checkValidity();

      if (form.id === 'form-paciente') {
        const rutInput = form.querySelector('#rut-paciente');
        const fechaNacimientoInput = form.querySelector('#fecha-nacimiento');
        const telefonoInput = form.querySelector('#telefono-paciente');

        if (!validarRUT(rutInput.value)) {
          rutInput.setCustomValidity('RUT inválido');
          isValid = false;
        } else {
          rutInput.setCustomValidity('');
        }

        if (fechaNacimientoInput.value && new Date(fechaNacimientoInput.value) > new Date()) {
          fechaNacimientoInput.setCustomValidity('La fecha no puede ser futura');
          isValid = false;
        } else {
          fechaNacimientoInput.setCustomValidity('');
        }

        if (telefonoInput.value && !/^\d{9}$/.test(telefonoInput.value)) {
          telefonoInput.setCustomValidity('Debe tener 9 dígitos');
          isValid = false;
        } else {
          telefonoInput.setCustomValidity('');
        }
      }

      if (form.id === 'form-receta') {
        const nombre = form.querySelector('#nombre-receta');
        const medicamento = form.querySelector('#medicamento-receta');
        const dosis = form.querySelector('#dosis-receta');
        const indicaciones = form.querySelector('#indicaciones-receta');

        if (!nombre.value.trim()) {
          nombre.setCustomValidity('Campo obligatorio');
          isValid = false;
        } else {
          nombre.setCustomValidity('');
        }

        if (!medicamento.value.trim()) {
          medicamento.setCustomValidity('Campo obligatorio');
          isValid = false;
        } else {
          medicamento.setCustomValidity('');
        }

        if (!dosis.value.trim()) {
          dosis.setCustomValidity('Campo obligatorio');
          isValid = false;
        } else {
          dosis.setCustomValidity('');
        }

        if (!indicaciones.value.trim()) {
          indicaciones.setCustomValidity('Campo obligatorio');
          isValid = false;
        } else {
          indicaciones.setCustomValidity('');
        }
      }

      if (form.id === 'form-calculadora') {
        const fur = form.querySelector('#fur');
        if (fur.value && new Date(fur.value) > new Date()) {
          fur.setCustomValidity('La FUR no puede ser futura');
          isValid = false;
        } else {
          fur.setCustomValidity('');
        }
      }

      if (!isValid) {
        event.preventDefault();
        event.stopPropagation();
      }

      form.classList.add('was-validated');
    });
  });

  function validarRUT(rut) {
    rut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    if (!/^[0-9]+[0-9K]$/.test(rut)) return false;

    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);

    let suma = 0, multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += +cuerpo[i] * multiplo;
      multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }

    const dvEsperado = 11 - (suma % 11);
    const dvFinal = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

    return dv === dvFinal;
  }
});
