document.addEventListener('DOMContentLoaded', function() {
  // Datos de usuarios de prueba
  const usuarios = [
    {
      username: "admin",
      password: "admin123",
      nombre: "Administradora",
      rol: "admin"
    },
    {
      username: "matrona1",
      password: "matrona123",
      nombre: "Dra. Pérez",
      rol: "matrona"
    }
  ];

  // 1. Manejo del Login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      const usuario = usuarios.find(u => u.username === username && u.password === password);
      
      if (usuario) {
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
        mostrarAlerta('Ingreso exitoso! Redirigiendo...', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
      } else {
        mostrarAlerta('Usuario o contraseña incorrectos', 'danger');
      }
    });
  }

  // 2. Verificación de Sesión (mejorada)
  function verificarSesion() {
    const usuarioGuardado = localStorage.getItem('usuarioActual');
    const esPaginaLogin = window.location.pathname.includes('index.html');
    
    if (!usuarioGuardado && !esPaginaLogin) {
      window.location.href = 'index.html';
      return null;
    }
    
    if (usuarioGuardado && esPaginaLogin) {
      window.location.href = 'dashboard.html';
      return null;
    }
    
    try {
      const usuario = JSON.parse(usuarioGuardado);
      if (document.getElementById('nombre-usuario')) {
        document.getElementById('nombre-usuario').textContent = usuario.nombre;
      }
      return usuario;
    } catch (e) {
      localStorage.removeItem('usuarioActual');
      if (!esPaginaLogin) {
        window.location.href = 'index.html';
      }
      return null;
    }
  }

  // 3. Cerrar Sesión (Versión Mejorada)
  document.addEventListener('click', function(e) {
    if (e.target.closest('#btn-cerrar-sesion')) {
      e.preventDefault();
      
      const btn = e.target.closest('#btn-cerrar-sesion');
      const originalHTML = btn.innerHTML;
      
      // Animación de carga
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cerrando...';
      btn.disabled = true;
      
      // Confirmación
      if (confirm('¿Está segura que desea cerrar sesión?')) {
        localStorage.removeItem('usuarioActual');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 800);
      } else {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }
    }
  });

  // 4. Mostrar Alerta
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
    
    setTimeout(() => alerta.remove(), 3000);
  }

  // Inicializar verificación de sesión
  verificarSesion();
});