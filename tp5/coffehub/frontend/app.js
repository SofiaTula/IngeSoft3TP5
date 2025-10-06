// ☕ CoffeeHub Frontend - API URL CORREGIDA

// 🔧 Detectar automáticamente la URL del backend
const API_URL = window.BACKEND_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:4000' 
    : 'https://coffehub-backend-qa-g7d7aehuf3avgucz.brazilsouth-01.azurewebsites.net'); // Cambiar a tu URL de Azure
console.log('🔗 API URL configurada:', API_URL);

// Toggle del formulario
function toggleForm() {
  const form = document.getElementById("add-form");
  form.style.display = form.style.display === "none" ? "block" : "none";
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
          <div><b>Tipo:</b> ${c.type}</div>
          <div><b>Precio:</b> $${c.price}/lb</div>
          <div><b>Tostado:</b> ${c.roast}</div>
          <div><b>Calificación:</b> ⭐ ${c.rating}/5</div>
        </div>
        <p class="coffee-description">${c.description}</p>
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
    document.getElementById("avg-price").textContent = `$${stats.avgPrice || 0}`;
    document.getElementById("popular-origin").textContent = stats.popularOrigin || "N/A";
  } catch (error) {
    console.error('❌ Error al cargar estadísticas:', error);
  }
}

// Manejar envío de formulario
document.getElementById("coffee-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const coffee = {
    name: document.getElementById("name").value,
    origin: document.getElementById("origin").value,
    type: document.getElementById("type").value,
    price: parseFloat(document.getElementById("price").value),
    roast: document.getElementById("roast").value,
    rating: parseFloat(document.getElementById("rating").value),
    description: document.getElementById("description").value || "Sin descripción"
  };
  
  try {
    const response = await fetch(`${API_URL}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coffee)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    e.target.reset();
    toggleForm();
    await renderCoffees();
    await updateStats();
    
    alert('✅ Café agregado exitosamente!');
  } catch (error) {
    console.error('❌ Error al agregar café:', error);
    alert(`⚠️ Error al agregar café: ${error.message}`);
  }
});

// Inicializar
renderCoffees();
updateStats();