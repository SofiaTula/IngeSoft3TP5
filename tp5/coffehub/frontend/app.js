// ☕ CoffeeHub Frontend - API URL DINÁMICA
// 🔧 Detectar automáticamente la URL del backend según el ambiente

function getBackendURL() {
  // 1. Si estamos en localhost, usar backend local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }
  
  // 2. Si estamos en QA, usar backend de QA
  if (window.location.hostname.includes('coffeehub-front-qa')) {
    return 'https://coffehub-backend-qa-g7d7aehuf3avgucz.brazilsouth-01.azurewebsites.net';
  }
  
  // 3. Si estamos en PROD, usar backend de PROD
  if (window.location.hostname.includes('coffeehub-front-prod')) {
    return 'https://coffehub-backend-prod-e6htdkgjgxevgdge.brazilsouth-01.azurewebsites.net';
  }
  
  // 4. Fallback por defecto (QA)
  return 'https://coffehub-backend-qa-g7d7aehuf3avgucz.brazilsouth-01.azurewebsites.net';
}

const API_URL = getBackendURL();
console.log('🔗 API URL configurada:', API_URL);
console.log('🌐 Hostname actual:', window.location.hostname);

// Variable global para tracking de edición
let editingCoffeeId = null;

// ================================
// 🛡️ FUNCIONES DE VALIDACIÓN
// ================================

/**
 * Valida los datos del formulario antes de enviar
 * @param {Object} coffee - Objeto con los datos del café
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateCoffeeData(coffee) {
  const errors = [];
  
  // Validar nombre
  if (!coffee.name || coffee.name.trim() === '') {
    errors.push('El nombre es requerido');
  } else if (coffee.name.length > 255) {
    errors.push('El nombre no puede exceder 255 caracteres');
  }
  
  // Validar precio
  if (isNaN(coffee.price)) {
    errors.push('El precio debe ser un número válido');
  } else if (coffee.price < 0) {
    errors.push('El precio no puede ser negativo');
  } else if (coffee.price > 999999.99) {
    errors.push('El precio no puede exceder $999,999.99');
  }
  
  // Validar rating
  if (coffee.rating !== undefined && coffee.rating !== null && coffee.rating !== '') {
    if (isNaN(coffee.rating)) {
      errors.push('El rating debe ser un número válido');
    } else if (coffee.rating < 0 || coffee.rating > 5) {
      errors.push('El rating debe estar entre 0 y 5');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Muestra un mensaje de error formateado
 * @param {string|Array} message - Mensaje o array de mensajes
 */
function showError(message) {
  if (Array.isArray(message)) {
    alert('❌ Errores de validación:\n\n' + message.map(m => `• ${m}`).join('\n'));
  } else {
    alert(`❌ ${message}`);
  }
}

/**
 * Muestra un mensaje de éxito
 * @param {string} message - Mensaje de éxito
 */
function showSuccess(message) {
  alert(`✅ ${message}`);
}

// ================================
// 🎨 FUNCIONES DE UI
// ================================

// Toggle del formulario
function toggleForm() {
  const form = document.getElementById("add-form");
  const isHidden = form.style.display === "none";
  form.style.display = isHidden ? "block" : "none";
  
  // Si se cierra el formulario, cancelar edición
  if (!isHidden) {
    cancelEdit();
  }
}

// Cancelar edición
function cancelEdit() {
  editingCoffeeId = null;
  document.getElementById("coffee-form").reset();
  document.getElementById("form-title").textContent = "Agregar Nuevo Café";
  document.getElementById("submit-btn").innerHTML = "✅ Agregar Café";
  document.getElementById("cancel-btn").style.display = "none";
}

// Preparar formulario para editar
function editCoffee(coffee) {
  editingCoffeeId = coffee._id;
  
  // Llenar formulario con datos existentes
  document.getElementById("name").value = coffee.name || '';
  document.getElementById("origin").value = coffee.origin || '';
  document.getElementById("type").value = coffee.type || '';
  document.getElementById("price").value = coffee.price || '';
  document.getElementById("roast").value = coffee.roast || 'Medium';
  document.getElementById("rating").value = coffee.rating || '';
  document.getElementById("description").value = coffee.description || '';
  
  // Cambiar título y botón
  document.getElementById("form-title").textContent = "Editar Café";
  document.getElementById("submit-btn").innerHTML = "💾 Guardar Cambios";
  document.getElementById("cancel-btn").style.display = "inline-block";
  
  // Mostrar formulario
  document.getElementById("add-form").style.display = "block";
  
  // Scroll hacia el formulario
  document.getElementById("add-form").scrollIntoView({ behavior: 'smooth' });
}

// ================================
// 📡 FUNCIONES DE API
// ================================

// Eliminar café
async function deleteCoffee(id, name) {
  if (!confirm(`¿Estás seguro de eliminar "${name}"?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/products/${id}`, {
      method: "DELETE"
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}`);
    }
    
    await renderCoffees();
    await updateStats();
    showSuccess('Café eliminado exitosamente');
  } catch (error) {
    console.error('❌ Error al eliminar café:', error);
    showError(`Error al eliminar café: ${error.message}`);
  }
}

// Renderizar cafés
async function renderCoffees() {
  try {
    const res = await fetch(`${API_URL}/api/products`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const coffees = await res.json();
    const grid = document.getElementById("coffee-grid");
    
    if (coffees.length === 0) {
      grid.innerHTML = '<div class="no-results">No hay cafés registrados</div>';
      return;
    }
    
    grid.innerHTML = coffees.map(c => `
      <div class="coffee-card">
        <h3 class="coffee-name">${c.name}</h3>
        <div class="coffee-details">
          <div><b>Origen:</b> ${c.origin}</div>
          <div><b>Precio:</b> $${parseFloat(c.price).toFixed(2)}/lb</div>
          <div><b>Tipo:</b> ${c.type}</div>
          <div><b>Tostado:</b> ${c.roast}</div>
          <div><b>Calificación:</b> ⭐ ${parseFloat(c.rating).toFixed(1)}/5</div>
        </div>
        <p class="coffee-description">${c.description}</p>
        <div class="card-actions">
          <button onclick='editCoffee(${JSON.stringify(c).replace(/'/g, "&apos;")})' class="btn-edit">
            ✏️ Editar
          </button>
          <button onclick="deleteCoffee('${c._id}', '${c.name.replace(/'/g, "\\'")}')" class="btn-delete">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    `).join("");
  } catch (error) {
    console.error('❌ Error al cargar cafés:', error);
    document.getElementById("coffee-grid").innerHTML =
      `<div class="error">⚠️ Error al conectar con el servidor: ${error.message}</div>`;
  }
}

// Actualizar estadísticas
async function updateStats() {
  try {
    const res = await fetch(`${API_URL}/api/stats`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const stats = await res.json();
    
    document.getElementById("total-coffees").textContent = stats.total || 0;
    document.getElementById("avg-price").textContent = `$${stats.avgPrice || '0.00'}`;
    document.getElementById("popular-origin").textContent = stats.popularOrigin || "N/A";
  } catch (error) {
    console.error('❌ Error al cargar estadísticas:', error);
  }
}

// ================================
// 📝 MANEJAR ENVÍO DE FORMULARIO
// ================================

document.getElementById("coffee-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Recolectar datos del formulario
  const coffeeData = {
    name: document.getElementById("name").value.trim(),
    origin: document.getElementById("origin").value.trim() || "Desconocido",
    type: document.getElementById("type").value.trim() || "Desconocido",
    price: parseFloat(document.getElementById("price").value),
    roast: document.getElementById("roast").value || "Medium",
    rating: parseFloat(document.getElementById("rating").value) || 0,
    description: document.getElementById("description").value.trim() || "Sin descripción"
  };
  
  console.log('📤 Datos a enviar:', coffeeData);
  
  // ✅ VALIDACIÓN EN EL CLIENTE
  const validation = validateCoffeeData(coffeeData);
  if (!validation.valid) {
    showError(validation.errors);
    return;
  }
  
  try {
    let response;
    let successMessage;
    
    if (editingCoffeeId) {
      // 🔄 Actualizar café existente
      console.log(`🔄 Actualizando café ${editingCoffeeId}`);
      response = await fetch(`${API_URL}/api/products/${editingCoffeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coffeeData)
      });
      successMessage = 'Café actualizado exitosamente';
    } else {
      // ➕ Crear nuevo café
      console.log('➕ Creando nuevo café');
      response = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coffeeData)
      });
      successMessage = 'Café agregado exitosamente';
    }
    
    // Manejar errores del servidor
    if (!response.ok) {
      let errorMessage = `Error ${response.status}`;
      
      try {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        
        // Si hay detalles de validación del backend
        if (errorData.details && Array.isArray(errorData.details)) {
          showError(errorData.details);
          return;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Si no puede parsear JSON, usar mensaje genérico
        console.error('❌ Error parseando respuesta:', e);
      }
      
      throw new Error(errorMessage);
    }
    
    // ✅ Éxito
    const result = await response.json();
    console.log('✅ Respuesta del servidor:', result);
    
    showSuccess(successMessage);
    cancelEdit();
    toggleForm();
    await renderCoffees();
    await updateStats();
    
  } catch (error) {
    console.error('❌ Error al guardar café:', error);
    showError(`Error al guardar café: ${error.message}`);
  }
});

// ================================
// 🚀 INICIALIZACIÓN
// ================================

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando CoffeeHub Frontend');
  renderCoffees();
  updateStats();
});

// Por compatibilidad, también ejecutar si el DOM ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderCoffees();
    updateStats();
  });
} else {
  // DOM ya está listo
  renderCoffees();
  updateStats();
}