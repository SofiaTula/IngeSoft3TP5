const API_URL = "http://localhost:4000";

// Toggle del formulario
function toggleForm() {
  const form = document.getElementById("add-form");
  form.style.display = form.style.display === "none" ? "block" : "none";
}

// Renderizar cafés
async function renderCoffees() {
  const res = await fetch(`${API_URL}/coffees`);
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
}

// Actualizar estadísticas
async function updateStats() {
  const res = await fetch(`${API_URL}/stats`);
  const stats = await res.json();
  document.getElementById("total-coffees").textContent = stats.total;
  document.getElementById("avg-price").textContent = `$${stats.avgPrice}`;
  document.getElementById("popular-origin").textContent = stats.popularOrigin;
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

  await fetch(`${API_URL}/coffees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(coffee)
  });

  e.target.reset();
  toggleForm();
  renderCoffees();
  updateStats();
});

// Inicializar
renderCoffees();
updateStats();