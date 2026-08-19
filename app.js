// LISTA DE EMPLEADOS Y PINS (Puedes cambiar o agregar más)
const STAFF_USERS = [
  { pin: "1001", name: "Rach", branch: "Polanco" },
  { pin: "1002", name: "Ana P.", branch: "Míthikah" },
  { pin: "1003", name: "Luis M.", branch: "Paseo Interlomas" },
  { pin: "1004", name: "Carla G.", branch: "Mundo E" },
  { pin: "1005", name: "Diego R.", branch: "Plaza Satélite" },
  { pin: "1006", name: "Sofía T.", branch: "TPH Peri Sur" },
  { pin: "1007", name: "Jorge V.", branch: "TPH Satélite" },
  { pin: "1008", name: "Elena F.", branch: "TPH Santa Fe" }
];

let activeStaff = null; // Cajero con sesión iniciada

// BASE DE DATOS LOCAL Y ESTADO DE LA APLICACIÓN
let state = {
  isOnline: true,
  clients: [
    { 
      id: "FLC-1001", 
      name: "Rach", 
      phone: "5500001111", 
      email: "cliente1@gmail.com",
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
      email: "carlos@gmail.com",
      stamps: 10, 
      rewardAvailable: true,
      history: [
        { fecha: "07/08/2026 12:00", detalle: "Llegó a 10 sellos. Recompensa lista." }
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

// VISTA / AUTENTICACIÓN DE CAJERO POR PIN INDIVIDUAL
function cambiarVista(vista) {
  if (vista === 'admin' && !activeStaff) {
    const inputPin = prompt("🔑 Ingresa tu PIN de Cajero:");
    if (!inputPin) return;

    const foundStaff = STAFF_USERS.find(u => u.pin === inputPin.trim());
    if (foundStaff) {
      activeStaff = foundStaff;
      alert(`✅ bienvenido(a) ${activeStaff.name} [Sucursal ${activeStaff.branch}]`);
    } else {
      alert("❌ PIN de cajero no válido.");
      return;
    }
  }

  document.getElementById('tab-client').classList.toggle('active', vista === 'cliente');
  document.getElementById('tab-admin').classList.toggle('active', vista === 'admin');
  
  document.getElementById('view-client').classList.toggle('active', vista === 'cliente');
  document.getElementById('view-admin').classList.toggle('active', vista === 'admin');

  updateStaffBar();
}

function cerrarSesionCajero() {
  activeStaff = null;
  alert("Sesión de caja cerrada.");
  cambiarVista('cliente');
}

function updateStaffBar() {
  const staffBar = document.getElementById('staff-bar');
  if (activeStaff) {
    document.getElementById('active-staff-name').innerText = activeStaff.name;
    document.getElementById('active-staff-branch').innerText = activeStaff.branch;
    staffBar.classList.remove('hidden');
  } else {
    staffBar.classList.add('hidden');
  }
}

function getClienteActual() {
  return state.clients.find(c => c.id === state.currentClientId);
}

function verificarConexion() {
  if (!state.isOnline) {
    alert("⚠️ Error de conexión: No se pudo conectar con el servidor.");
    return false;
  }
  return true;
}

// ACTUALIZAR INTERFAZ
function updateUI() {
  const client = getClienteActual();
  if (!client) return;

  // Vista Cliente
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

  // Dibujar sellos
  const grid = document.getElementById('stamps-grid');
  grid.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const slot = document.createElement('div');
    slot.className = `stamp-slot ${i <= client.stamps ? 'filled' : ''}`;
    
    if (i <= client.stamps) {
      const img = document.createElement('img');
      img.src = 'fresitaicon.jpeg';
      img.alt = 'Sello';
      img.className = 'stamp-img';
      img.onerror = function() { slot.innerText = '🍓'; };
      slot.appendChild(img);
    } else {
      slot.innerText = i;
    }
    grid.appendChild(slot);
  }

  generarQR(client.id);
  renderClientHistory(client);

  // Vista Admin
  document.getElementById('admin-client-name').innerText = `${client.name} (${client.id})`;
  document.getElementById('admin-client-stamps').innerText = `${client.stamps}/10`;
  document.getElementById('admin-client-reward-status').innerText = client.rewardAvailable ? "🎉 Disponible" : "No disponible";
  document.getElementById('btn-confirm-redeem').disabled = !client.rewardAvailable;

  renderAdminHistory();
}

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

function buscarClienteAdmin() {
  if (!verificarConexion()) return;

  const query = document.getElementById('admin-search-input').value.trim().toLowerCase();
  if (!query) {
    alert("Ingresa un ID, nombre, teléfono o correo para buscar.");
    return;
  }

  const encon = state.clients.find(c => 
    c.id.toLowerCase() === query || 
    c.name.toLowerCase().includes(query) || 
    c.phone.includes(query) ||
    (c.email && c.email.toLowerCase().includes(query))
  );

  if (encon) {
    state.currentClientId = encon.id;
    renderClientSelectAdmin();
    updateUI();
  } else {
    alert("❌ Error: Cliente inexistente.");
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

// CORREO AUTOMÁTICO VÍA EMAILJS
function enviarCorreoRecompensa(cliente) {
  if (!cliente || !cliente.email) return;

  const templateParams = {
    client_name: cliente.name,
    client_email: cliente.email
  };

  emailjs.send('service_h37djsb', 'template_s9iwmug', templateParams)
    .then(function(response) {
       console.log('✅ Correo de recompensa enviado con éxito:', response.status);
    }, function(error) {
       console.error('❌ Error al enviar correo:', error);
    });
}

// AGREGAR SELLOS (AUDITADO CON CAJERO Y SUCURSAL)
function agregarSello() {
  if (!verificarConexion()) return;

  const client = getClienteActual();
  if (!client) return;

  if (client.stamps >= 10) {
    alert("⚠️ El cliente ya completó 10 sellos. Debe canjear su recompensa.");
    return;
  }

  client.stamps += 1;

  if (client.stamps === 10) {
    client.rewardAvailable = true;
    registrarEvento(client, "🎉 ¡Completó 10 sellos! Recompensa lista.");
    enviarCorreoRecompensa(client);
    alert(`🎉 ¡${client.name} alcanzó 10 sellos! Se envió correo de notificación.`);
  } else {
    registrarEvento(client, `➕ Sello agregado (${client.stamps}/10)`);
  }

  renderClientSelectAdmin();
  updateUI();
}

// CANJE DE RECOMPENSA (AUDITADO)
function confirmarCanjeAdmin() {
  if (!verificarConexion()) return;

  const client = getClienteActual();
  if (!client || !client.rewardAvailable) {
    alert("Este cliente no tiene una recompensa activa.");
    return;
  }

  client.stamps = 0; 
  client.rewardAvailable = false;

  registrarEvento(client, '✅ Recompensa canjeada "Vaso Gratis" 🍓.');
  alert(`✅ Canje confirmado para ${client.name}. Tarjeta reiniciada a 0/10.`);

  renderClientSelectAdmin();
  updateUI();
}

// REGISTRAR NUEVO CLIENTE
function registrarCliente() {
  if (!verificarConexion()) return;

  const nameInput = document.getElementById("new-name");
  const phoneInput = document.getElementById("new-phone");
  const emailInput = document.getElementById("new-email");

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();

  if (!name || !phone || !email) {
    alert("Por favor completa todos los campos.");
    return;
  }

  const existe = state.clients.some(c => c.phone === phone);
  if (existe) {
    alert("⚠️ Ya existe un cliente con este teléfono.");
    return;
  }

  const newId = `FLC-${1000 + state.clients.length + 1}`;
  const newClient = {
    id: newId,
    name: name,
    phone: phone,
    email: email,
    stamps: 0,
    rewardAvailable: false,
    history: []
  };

  state.clients.push(newClient);
  state.currentClientId = newId;

  registrarEvento(newClient, "Registro de nuevo cliente.");

  nameInput.value = "";
  phoneInput.value = "";
  emailInput.value = "";

  renderClientSelectAdmin();
  updateUI();
  alert(`✅ Cliente ${name} registrado con ID: ${newId}`);
}

// REGISTRO DE EVENTOS CON MARCA DE TIEMPO, CAJERO Y SUCURSAL
function registrarEvento(cliente, detalle) {
  const fecha = obtenerFecha();
  const staffInfo = activeStaff ? `${activeStaff.name} [${activeStaff.branch}]` : "Sistema";

  const itemCliente = { fecha, detalle: `${detalle} (Atendió: ${staffInfo})` };
  const itemGlobal = { fecha, clienteName: cliente.name, detalle, staffInfo };

  cliente.history.unshift(itemCliente);
  state.globalHistory.unshift(itemGlobal);
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
    li.innerHTML = `<strong>${h.fecha}</strong> - <em>${h.clienteName}</em>: ${h.detalle} <br><small style="color:#666;">📌 Atendido por: ${h.staffInfo}</small>`;
    list.appendChild(li);
  });
}

function obtenerFecha() {
  const now = new Date();
  return `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
