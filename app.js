// PIN de acceso para Administrador
const ADMIN_PIN = "12345"; // 👈 

// BASE DE DATOS LOCAL Y ESTADO DE LA APLICACIÓN
let state = {
  isOnline: true,
  clients: [
    { 
      id: "FLC-1001", 
      name: "Rach", 
      phone: "5500001111", 
      stamps: 0, 
      rewardAvailable: false,
      history: [
        { fecha: "08/08/2026 14:00", detalle: "Registro de cuenta" }
      ]
    },
    { 
      id: "FLC-1002", 
      name: "Carlos M.", 
      phone: "5522223333", 
      stamps: 10, 
      rewardAvailable: true,
      history: [
        { fecha: "07/08/2026 12:00", detalle: "Llegó a 10 sellos. Recompensa lista." }
      ]
    },
    { 
      id: "FLC-1003", 
      name: "Sofía G.", 
      phone: "5544445555", 
      stamps: 0, 
      rewardAvailable: false,
      history: [
        { fecha: "08/08/2026 10:00", detalle: "Cliente registrado" }
      ]
    }
  ],
  currentClientId: "FLC-1001",
  globalHistory: []
};

let qrCodeObj = null;

// INICIALIZACIÓN
window.onload = function() {
  const urlParams = new URLSearchParams(window.location.search);
  const esAdmin = urlParams.get('admin') === 'true';

  if (esAdmin) {
    document.body.classList.add('modo-admin');
    cambiarVista('admin');
  } else {
    cambiarVista('cliente');
  }

  renderClientSelectAdmin();
  updateUI();
};

// CAMBIAR ENTRE PESTAÑAS (CLIENTE / ADMIN) CON SEGURIDAD POR PIN
function cambiarVista(vista) {
  // 🔒 Si intenta entrar a la vista de Administrador, solicita el PIN
  if (vista === 'admin') {
    const pass = prompt("Ingresa el PIN de Administrador:");
    if (pass !== ADMIN_PIN) {
      alert("❌ PIN incorrecto. Acceso denegado.");
      return; // Cancela el cambio y permanece en la pestaña de cliente
    }
  }

  // Cambia la vista normalmente
  document.getElementById('tab-client').classList.toggle('active', vista === 'cliente');
  document.getElementById('tab-admin').classList.toggle('active', vista === 'admin');
  
  document.getElementById('view-client').classList.toggle('active', vista === 'cliente');
  document.getElementById('view-admin').classList.toggle('active', vista === 'admin');
}

function getClienteActual() {
  return state.clients.find(c => c.id === state.currentClientId);
}

// SIMULADOR DE CONEXIÓN
function verificarConexion() {
  if (!state.isOnline) {
    alert("⚠️ Error de conexión: No se pudo conectar con el servidor. Intenta de nuevo.");
    return false;
  }
  return true;
}

// ACTUALIZAR INTERFAZ
function updateUI() {
  const client = getClienteActual();
  if (!client) return;

  // --- VISTA CLIENTE ---
  document.getElementById('client-name').innerText = client.name;
  document.getElementById('stamp-counter').innerText = `${client.stamps} / 10`;
  document.getElementById('client-id-code').innerText = client.id;

  const statusMsg = document.getElementById('status-message');
  const rewardBanner = document.getElementById('reward-banner');

  if (client.stamps >= 10 || client.rewardAvailable) {
    statusMsg.innerText = "🎉 ¡Felicidades! Tienes tu recompensa lista para canjear. 🍓";
    rewardBanner.classList.remove('hidden');
  } else {
    const faltantes = 10 - client.stamps;
    statusMsg.innerText = faltantes > 0 
      ? `¡Te faltan ${faltantes} sellos para tu vaso gratis! 🍓` 
      : "¡Recompensa lista! 🍓";
    rewardBanner.classList.add('hidden');
  }

  // Dibujar sellos (1 a 10) usando la imagen personalizada
  const grid = document.getElementById('stamps-grid');
  grid.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const slot = document.createElement('div');
    slot.className = `stamp-slot ${i <= client.stamps ? 'filled' : ''}`;
    
    if (i <= client.stamps) {
      // Imagen de la fresita en la casilla circular
      const img = document.createElement('img');
      img.src = 'fresitaicon.jpeg';
      img.alt = 'Sello';
      img.className = 'stamp-img';
      
      // Respaldo por si no encuentra la imagen
      img.onerror = function() {
        slot.innerText = '🍓';
      };
      slot.appendChild(img);
    } else {
      slot.innerText = i;
    }
    
    grid.appendChild(slot);
  }

  // Generar QR Dinámico
  generarQR(client.id);

  // Renderizar historial
  renderClientHistory(client);

  // --- VISTA ADMIN ---
  document.getElementById('admin-client-name').innerText = `${client.name} (${client.id})`;
  document.getElementById('admin-client-stamps').innerText = `${client.stamps}/10`;
  document.getElementById('admin-client-reward-status').innerText = client.rewardAvailable ? "🎉 Disponible" : "No disponible";
  document.getElementById('btn-confirm-redeem').disabled = !client.rewardAvailable;

  renderAdminHistory();
}

// GENERAR QR
function generarQR(texto) {
  const container = document.getElementById('qrcode');
  container.innerHTML = '';
  qrCodeObj = new QRCode(container, {
    text: texto,
    width: 120,
    height: 120,
    colorDark: "#4a148c",
    colorLight: "#ffffff"
  });
}

// BUSCADOR EN ADMIN
function buscarClienteAdmin() {
  if (!verificarConexion()) return;

  const query = document.getElementById('admin-search-input').value.trim().toLowerCase();
  if (!query) {
    alert("Ingresa un ID, nombre o teléfono para buscar.");
    return;
  }

  const encon = state.clients.find(c => 
    c.id.toLowerCase() === query || 
    c.name.toLowerCase().includes(query) || 
    c.phone.includes(query)
  );

  if (encon) {
    state.currentClientId = encon.id;
    renderClientSelectAdmin();
    updateUI();
  } else {
    alert("❌ Error: Cliente inexistente. Verifica el código o regístralo.");
  }
}

function renderClientSelectAdmin() {
  const select = document.getElementById('admin-client-select');
  select.innerHTML = '';
  state.clients.forEach(c => {
    const option = document.createElement('option');
    option.value = c.id;
    option.innerText = `${c.name} (${c.id}) - ${c.stamps}/10 sellos`;
    if (c.id === state.currentClientId) option.selected = true;
    select.appendChild(option);
  });
}

function seleccionarClienteAdmin(id) {
  state.currentClientId = id;
  updateUI();
}

// AGREGAR SELLOS
function agregarSello() {
  if (!verificarConexion()) return;

  const client = getClienteActual();
  if (!client) return;

  if (client.stamps >= 10) {
    alert("⚠️ El cliente ya completó 10 sellos. Debe canjear su recompensa antes de acumular más. 🍓");
    return;
  }

  client.stamps += 1;

  if (client.stamps === 10) {
    client.rewardAvailable = true;
    registrarEvento(client, "🎉 ¡Completó 10 sellos! Recompensa lista para canje. 🍓");
    alert(`🎉 ¡${client.name} ha alcanzado 10 sellos! Se activó la recompensa. 🍓`);
  } else {
    registrarEvento(client, `➕ Sello agregado (${client.stamps}/10)`);
  }

  renderClientSelectAdmin();
  updateUI();
  if (client.stamps === 10) {
  client.rewardAvailable = true;
  registrarEvento(client, "🎉 ¡Completó 10 sellos! Recompensa lista.");
  
  // Enviar correo automático
  enviarCorreoRecompensa(client);

  alert(`🎉 ¡${client.name} alcanzó 10 sellos y se le envió su correo de notificación! 🍓`);
}
}

// CANJE DE RECOMPENSA -> REINICIA A 0/10
function confirmarCanjeAdmin() {
  if (!verificarConexion()) return;

  const client = getClienteActual();
  if (!client || !client.rewardAvailable) {
    alert("Este cliente no tiene una recompensa activa para canjear.");
    return;
  }

  client.stamps = 0; 
  client.rewardAvailable = false;

  registrarEvento(client, '✅ Recompensa canjeada "Vaso de Fresas Gratis" 🍓. Tarjeta reiniciada a 0/10 sellos.');
  alert(`✅ Canje confirmado para ${client.name}.\n\nRecordatorio: TOPPINGS SE COBRAN ADICIONAL\nSu tarjeta ha sido establecida en 0/10 sellos.`);

  renderClientSelectAdmin();
  updateUI();
}

// REGISTRAR NUEVO CLIENTE
function registrarCliente() {
  if (!verificarConexion()) return;

  const nameInput = document.getElementById('new-name');
  const phoneInput = document.getElementById('new-phone');

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!name || !phone) {
    alert("Completa el nombre y el teléfono.");
    return;
  }

  const existe = state.clients.some(c => c.phone === phone);
  if (existe) {
    alert("⚠️ Cliente duplicado: Ya existe un registro asociado a este número de teléfono.");
    return;
  }

  const newId = `FLC-${1000 + state.clients.length + 1}`;
  const newClient = {
    id: newId,
    name: name,
    phone: phone,
    stamps: 0,
    rewardAvailable: false,
    history: []
  };

  state.clients.push(newClient);
  state.currentClientId = newId;

  registrarEvento(newClient, "Registro de nuevo cliente.");

  nameInput.value = '';
  phoneInput.value = '';

  renderClientSelectAdmin();
  updateUI();
  alert(`Cliente registrado exitosamente con ID: ${newId}`);
function registrarCliente() {
  const nameInput = document.getElementById("new-name");
  const phoneInput = document.getElementById("new-phone");
  const emailInput = document.getElementById("new-email"); // 👈 Captura el correo

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();

  if (!name || !phone || !email) {
    alert("Por favor completa todos los campos (Nombre, Teléfono y Correo).");
    return;
  }

  const newId = "FLC-" + (1001 + clients.length);

  const newClient = {
    id: newId,
    name: name,
    phone: phone,
    email: email, // 👈 Se guarda en el cliente
    stamps: 0,
    rewardAvailable: false,
    history: []
  };

  clients.push(newClient);
  saveClients();
  renderClientSelectAdmin();

  // Limpiar formulario
  nameInput.value = "";
  phoneInput.value = "";
  emailInput.value = "";

  alert(`✅ Cliente ${name} registrado con éxito con el ID: ${newId}`);
}
}

// HISTORIAL Y EVENTOS
function registrarEvento(cliente, detalle) {
  const fecha = obtenerFecha();
  const item = { fecha, detalle };

  cliente.history.unshift(item);
  state.globalHistory.unshift({ fecha, clienteName: cliente.name, detalle });
}

function renderClientHistory(client) {
  const list = document.getElementById('client-history-list');
  list.innerHTML = '';
  if (!client.history || client.history.length === 0) {
    list.innerHTML = '<li>Sin movimientos registrados.</li>';
    return;
  }
  client.history.forEach(h => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${h.fecha}</strong>: ${h.detalle}`;
    list.appendChild(li);
  });
}

function renderAdminHistory() {
  const list = document.getElementById('admin-history-list');
  list.innerHTML = '';
  if (state.globalHistory.length === 0) {
    list.innerHTML = '<li>No hay actividad registrada en caja.</li>';
    return;
  }
  state.globalHistory.forEach(h => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${h.fecha}</strong> - <em>${h.clienteName}</em>: ${h.detalle}`;
    list.appendChild(li);
  });
  // FUNCIÓN PARA ENVIAR CORREO DE RECOMPENSA AUTOMÁTICO
function enviarCorreoRecompensa(cliente) {
  if (!cliente.email) {
    console.log("El cliente no tiene correo registrado.");
    return;
  }

  const templateParams = {
    client_name: cliente.name,
    client_email: cliente.email
  };

  emailjs.send('service_h37djsb', 'template_u9bbjbf', templateParams)
    .then(function(response) {
       console.log('✅ Correo de recompensa enviado con éxito:', response.status);
    }, function(error) {
       console.error('❌ Error al enviar correo:', error);
    });
}
}

function obtenerFecha() {
  const now = new Date();
  return `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
