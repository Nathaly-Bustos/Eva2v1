document.addEventListener('DOMContentLoaded', function() {
  // =============================================
  // DATOS Y ESTADO
  // =============================================
  let pacientes = JSON.parse(localStorage.getItem('pacientes')) || [];
  let turnos = JSON.parse(localStorage.getItem('turnos')) || [];
  let editingPacienteId = null;

  // Datos del desarrollo fetal
  const fetalDevelopmentData = {
    4: { 
      image: "https://embryology.med.unsw.edu.au/embryology/images/thumb/6/64/Human_embryo_8-9_weeks.jpg/300px-Human_embryo_8-9_weeks.jpg",
      description: "El embrión mide ≈2 mm. Comienzan a formarse el corazón y el sistema nervioso."
    },
    8: {
      image: "https://embryology.med.unsw.edu.au/embryology/images/thumb/8/8c/Human_embryo_10-11_weeks.jpg/300px-Human_embryo_10-11_weeks.jpg",
      description: "El feto mide ≈1.6 cm. Aparecen dedos y órganos principales en desarrollo."
    },
    12: {
      image: "https://embryology.med.unsw.edu.au/embryology/images/thumb/9/9e/Human_embryo_12-13_weeks.jpg/300px-Human_embryo_12-13_weeks.jpg",
      description: "El feto mide ≈5 cm. Los rasgos faciales son reconocibles."
    },
    16: {
      image: "https://embryology.med.unsw.edu.au/embryology/images/thumb/7/7e/Human_embryo_14-15_weeks.jpg/300px-Human_embryo_14-15_weeks.jpg",
      description: "El feto mide ≈11 cm. Puede chuparse el dedo y hacer movimientos respiratorios."
    },
    20: {
      image: "https://embryology.med.unsw.edu.au/embryology/images/thumb/6/6c/Human_embryo_16-17_weeks.jpg/300px-Human_embryo_16-17_weeks.jpg",
      description: "El feto mide ≈16 cm. La madre puede empezar a sentir los movimientos."
    },
    40: {
      image: "https://embryology.med.unsw.edu.au/embryology/images/thumb/7/7a/Human_embryo_38-40_weeks.jpg/300px-Human_embryo_38-40_weeks.jpg",
      description: "¡A término! El bebé promedio mide ≈51 cm y pesa ≈3.5 kg."
    }
  };

  // =============================================
  // FUNCIONES DE INICIALIZACIÓN
  // =============================================
  function init() {
    cargarPacientes();
    cargarDashboard();
    setupEventListeners();
  }

  function setupEventListeners() {
    // Calculadora de gestación
    document.getElementById('fur').addEventListener('change', calcularGestacion);
    document.getElementById('form-calculadora').addEventListener('submit', function(e) {
      e.preventDefault();
      calcularGestacion();
    });

    // Gestión de pacientes
    document.getElementById('btn-nuevo-paciente').addEventListener('click', mostrarFormPaciente);
    document.getElementById('btn-cancelar-paciente').addEventListener('click', ocultarFormPaciente);
    document.getElementById('form-paciente').addEventListener('submit', guardarPaciente);
  }

  // =============================================
  // CALCULADORA DE GESTACIÓN
  // =============================================
  function calcularGestacion() {
    const fur = new Date(document.getElementById('fur').value);
    if (isNaN(fur.getTime())) return;

    // Calcular FPP (FUR + 280 días)
    const fpp = new Date(fur);
    fpp.setDate(fpp.getDate() + 280);
    document.getElementById('fpp').value = fpp.toLocaleDateString('es-CL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Calcular semanas de gestación
    const hoy = new Date();
    const diffDays = Math.floor((hoy - fur) / (1000 * 60 * 60 * 24));
    const semanas = Math.min(Math.floor(diffDays / 7), 40);

    // Actualizar UI
    document.getElementById('semanas-gestacion').textContent = 
      `${semanas} semanas (${diffDays} días)`;
    document.getElementById('gestation-progress').style.width = `${(semanas/40)*100}%`;
    document.getElementById('gestation-badge').textContent = `${semanas} semanas`;

    // Mostrar imagen y descripción correspondiente
    const closestWeek = Math.round(semanas / 4) * 4;
    const weekData = fetalDevelopmentData[closestWeek] || fetalDevelopmentData[40];
    
    const fetalImage = document.getElementById('fetal-image');
    fetalImage.src = weekData.image;
    fetalImage.alt = `Feto de ${semanas} semanas`;
    
    // Efecto de animación
    fetalImage.style.opacity = 0;
    setTimeout(() => {
      fetalImage.style.opacity = 1;
    }, 300);

    document.getElementById('fetal-description').innerHTML = `
      <h6 class="fw-bold">Semana ${semanas}:</h6>
      <p class="mb-0">${weekData.description}</p>
      <p class="text-muted mt-2"><small>Tamaño aproximado: ${obtenerTamanioFetal(semanas)}</small></p>
    `;
  }

  function obtenerTamanioFetal(semanas) {
    const tamanios = {
      4: "2-4 mm (como una semilla de amapola)",
      8: "1.6 cm (como un frijol)",
      12: "5 cm (como un limón)",
      16: "11 cm (como un aguacate)",
      20: "16 cm (como un plátano)",
      40: "51 cm (como una sandía pequeña)"
    };
    
    for (let [semana, desc] of Object.entries(tamanios).sort((a, b) => b[0] - a[0])) {
      if (semanas >= parseInt(semana)) return desc;
    }
    return "Tamaño no disponible";
  }

  // =============================================
  // GESTIÓN DE PACIENTES
  // =============================================
  function mostrarFormPaciente() {
    document.getElementById('form-paciente').classList.remove('d-none');
    document.getElementById('btn-nuevo-paciente').classList.add('d-none');
  }

  function ocultarFormPaciente() {
    document.getElementById('form-paciente').classList.add('d-none');
    document.getElementById('btn-nuevo-paciente').classList.remove('d-none');
    document.getElementById('form-paciente').reset();
    editingPacienteId = null;
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
      // Editar paciente existente
      const index = pacientes.findIndex(p => p.id === editingPacienteId);
      pacientes[index] = paciente;
    } else {
      // Nuevo paciente
      pacientes.push(paciente);
    }

    localStorage.setItem('pacientes', JSON.stringify(pacientes));
    mostrarAlerta(`Paciente ${editingPacienteId ? 'actualizado' : 'registrado'} correctamente`, 'success');
    cargarPacientes();
    ocultarFormPaciente();
  }

  function cargarPacientes() {
    const tbody = document.getElementById('lista-pacientes');
    tbody.innerHTML = pacientes.map(paciente => {
      const edad = paciente.fechaNacimiento ? calcularEdad(paciente.fechaNacimiento) : 'N/A';
      
      return `
        <tr>
          <td>${paciente.rut}</td>
          <td>${paciente.nombre}</td>
          <td>${edad}</td>
          <td>
            <button class="btn btn-sm btn-primary me-1" onclick="editarPaciente(${paciente.id})">
              <i class="material-icons">edit</i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="eliminarPaciente(${paciente.id})">
              <i class="material-icons">delete</i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Actualizar dashboard
    document.getElementById('total-pacientes').textContent = pacientes.length;
  }

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
  // FUNCIONES GLOBALES (disponibles en el DOM)
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

  window.verFicha = function(pacienteId) {
    const paciente = pacientes.find(p => p.id === pacienteId);
    if (!paciente) return;

    const modalContent = document.getElementById('contenido-ficha');
    modalContent.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <h4>${paciente.nombre}</h4>
          <p><strong>RUT:</strong> ${paciente.rut}</p>
          <p><strong>Fecha Nacimiento:</strong> ${paciente.fechaNacimiento || 'No registrada'}</p>
          <p><strong>Teléfono:</strong> ${paciente.telefono || 'No registrado'}</p>
          <p><strong>Edad:</strong> ${paciente.fechaNacimiento ? calcularEdad(paciente.fechaNacimiento) : 'N/A'}</p>
        </div>
        <div class="col-md-6">
          <h5><i class="material-icons me-2">history</i> Historial Clínico</h5>
          <div class="list-group">
            <div class="list-group-item">
              <div class="d-flex justify-content-between">
                <strong>Primera consulta</strong>
                <span class="text-muted">${new Date(paciente.fechaRegistro).toLocaleDateString()}</span>
              </div>
              <p class="mb-0">Registro inicial en el sistema</p>
            </div>
            <!-- Más registros pueden agregarse dinámicamente -->
          </div>
        </div>
      </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('modal-ficha'));
    modal.show();
  };

  // =============================================
  // DASHBOARD
  // =============================================
  function cargarDashboard() {
    document.getElementById('total-pacientes').textContent = pacientes.length;
    // Aquí puedes agregar más lógica para cargar datos del dashboard
  }

  // Inicializar
  init();
});

// Función global para mostrar alertas
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