// Usuarios demo (en producción usar backend)
const usuarios = [
  {
    username: "admin",
    password: "admin123",
    nombre: "Administradora",
    rol: "admin"
  },
  {
    username: "matrona1",
    password: "clave123",
    nombre: "Dra. Pérez",
    rol: "matrona"
  }
];

// Manejo del login
document.getElementById('login-form')?.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  const usuario = usuarios.find(u => 
    u.username === username && u.password === password
  );
  
  if (usuario) {
    localStorage.setItem('usuarioActual', JSON.stringify(usuario));
    window.location.href = 'dashboard.html';
  } else {
    mostrarAlerta('Credenciales incorrectas', 'danger');
  }
});

// Verificar sesión al cargar dashboard
function verificarSesion() {
  const usuario = JSON.parse(localStorage.getItem('usuarioActual'));
  
  if (!usuario) {
    window.location.href = 'index.html';
    return;
  }
  
  document.getElementById('nombre-usuario')?.textContent = usuario.nombre;
  return usuario;
}

// Cerrar sesión
document.getElementById('btn-cerrar-sesion')?.addEventListener('click', () => {
  localStorage.removeItem('usuarioActual');
  window.location.href = 'index.html';
});

// Mostrar alertas
function mostrarAlerta(mensaje, tipo) {
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
  alerta.style.zIndex = '1100';
  alerta.innerHTML = `
    <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alerta);
  
  setTimeout(() => {
    alerta.remove();
  }, 3000);
}

// Inicializar
if (window.location.pathname.endsWith('dashboard.html')) {
  verificarSesion();
}