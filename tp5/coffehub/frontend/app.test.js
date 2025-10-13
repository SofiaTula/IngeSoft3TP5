// ☕ CoffeeHub Frontend - Tests con Jest
// =======================================
import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';

// ✅ CRÍTICO: Polyfills ANTES de importar JSDOM
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Ahora sí importar JSDOM
import { JSDOM } from 'jsdom';

// ================================
// 🌐 SETUP DEL DOM
// ================================
let dom;
let window;
let document;

function setupDOM() {
  dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
  <div class="container">
    <header>
      <h1>☕ CoffeeHub</h1>
      <button id="add-btn" onclick="toggleForm()">➕ Agregar Café</button>
    </header>

    <section class="stats">
      <div class="stat-card">
        <h3>Total de Cafés</h3>
        <p id="total-coffees">0</p>
      </div>
      <div class="stat-card">
        <h3>Precio Promedio</h3>
        <p id="avg-price">$0</p>
      </div>
      <div class="stat-card">
        <h3>Origen Más Popular</h3>
        <p id="popular-origin">N/A</p>
      </div>
    </section>

    <section id="add-form" style="display:none;">
      <h3 id="form-title">Agregar Nuevo Café</h3>
      <form id="coffee-form">
        <input type="text" id="name" placeholder="Nombre" required />
        <input type="text" id="origin" placeholder="Origen" required />
        <input type="text" id="type" placeholder="Tipo" required />
        <input type="number" id="price" placeholder="Precio" step="0.01" required />
        <input type="text" id="roast" placeholder="Tostado" required />
        <input type="number" id="rating" placeholder="Rating" step="0.1" min="0" max="5" required />
        <textarea id="description" placeholder="Descripción"></textarea>
        <button type="submit" id="submit-btn">✅ Agregar Café</button>
        <button type="button" id="cancel-btn" onclick="cancelEdit()" style="display:none;">❌ Cancelar</button>
      </form>
    </section>

    <section id="coffee-grid"></section>
  </div>
</body>
</html>
`, {
    url: 'http://localhost:8080',
    runScripts: 'dangerously',
    resources: 'usable'
  });

  window = dom.window;
  document = dom.window.document;
  
  global.window = window;
  global.document = document;
  global.navigator = window.navigator;
}

// ================================
// 🎭 MOCKS
// ================================
global.fetch = jest.fn();
global.alert = jest.fn();
global.confirm = jest.fn();

// Variable global para simular el estado de edición
let currentEditingId = null;

// ================================
// 📦 FUNCIONES DEL FRONTEND (Simuladas)
// ================================

function getBackendURL() {
  // ✅ SOLUCIÓN: Usar global.window para compatibilidad con tests
  const hostname = (global.window || window).location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }
  
  if (hostname.includes('coffeehub-front-qa')) {
    return 'https://coffeehub-back-qa-f9ewg4hrhyhzgwgp.brazilsouth-01.azurewebsites.net';
  }
  
  if (hostname.includes('coffeehub-front-prod')) {
    return 'https://coffeehub-back-prod-aqh6hgg7gydre9hf.brazilsouth-01.azurewebsites.net';
  }
  
  return 'https://coffeehub-back-qa-f9ewg4hrhyhzgwgp.brazilsouth-01.azurewebsites.net';
}

function toggleForm() {
  const form = document.getElementById('add-form');
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
  } else {
    form.style.display = 'none';
    cancelEdit();
  }
}

function cancelEdit() {
  currentEditingId = null;
  document.getElementById('coffee-form').reset();
  document.getElementById('form-title').textContent = 'Agregar Nuevo Café';
  document.getElementById('submit-btn').innerHTML = '✅ Agregar Café';
  document.getElementById('cancel-btn').style.display = 'none';
  document.getElementById('add-form').style.display = 'none';
}

function editCoffee(coffee) {
  currentEditingId = coffee._id;
  
  document.getElementById('name').value = coffee.name;
  document.getElementById('origin').value = coffee.origin;
  document.getElementById('type').value = coffee.type;
  document.getElementById('price').value = coffee.price;
  document.getElementById('roast').value = coffee.roast;
  document.getElementById('rating').value = coffee.rating;
  document.getElementById('description').value = coffee.description || '';
  
  document.getElementById('form-title').textContent = 'Editar Café';
  document.getElementById('submit-btn').innerHTML = '💾 Guardar Cambios';
  document.getElementById('cancel-btn').style.display = 'inline-block';
  document.getElementById('add-form').style.display = 'block';
}

async function deleteCoffee(id, name) {
  if (!confirm(`¿Estás seguro de eliminar "${name}"?`)) {
    return;
  }

  try {
    const response = await fetch(`${getBackendURL()}/api/products/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('✅ Café eliminado exitosamente!');
      await renderCoffees();
      await updateStats();
    } else {
      alert('❌ Error al eliminar el café');
    }
  } catch (error) {
    alert('❌ Error de conexión');
  }
}

async function renderCoffees() {
  const grid = document.getElementById('coffee-grid');
  
  try {
    const response = await fetch(`${getBackendURL()}/api/products`);
    
    if (!response.ok) {
      grid.innerHTML = '<p class="error">❌ Error al conectar con el servidor</p>';
      return;
    }
    
    const coffees = await response.json();
    
    if (coffees.length === 0) {
      grid.innerHTML = '<p class="no-data">No hay cafés registrados. ¡Agrega uno!</p>';
      return;
    }
    
    grid.innerHTML = coffees.map(coffee => `
      <div class="coffee-card">
        <h3>${coffee.name}</h3>
        <p><strong>Origen:</strong> ${coffee.origin}</p>
        <p><strong>Tipo:</strong> ${coffee.type}</p>
        <p><strong>Precio:</strong> $${coffee.price}</p>
        <p><strong>Tostado:</strong> ${coffee.roast}</p>
        <p><strong>Rating:</strong> ${coffee.rating} ⭐</p>
        <p>${coffee.description || 'Sin descripción'}</p>
        <div class="card-actions">
          <button onclick='editCoffee(${JSON.stringify(coffee).replace(/'/g, "&#39;")})'>✏️ Editar</button>
          <button onclick='deleteCoffee("${coffee._id}", "${coffee.name}")'>🗑️ Eliminar</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    grid.innerHTML = '<p class="error">❌ Error al conectar con el servidor</p>';
  }
}

async function updateStats() {
  try {
    const response = await fetch(`${getBackendURL()}/api/stats`);
    
    if (!response.ok) {
      return;
    }
    
    const stats = await response.json();
    
    document.getElementById('total-coffees').textContent = stats.total || 0;
    document.getElementById('avg-price').textContent = `$${stats.avgPrice || 0}`;
    document.getElementById('popular-origin').textContent = stats.popularOrigin || 'N/A';
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const coffeeData = {
    name: document.getElementById('name').value,
    origin: document.getElementById('origin').value,
    type: document.getElementById('type').value,
    price: parseFloat(document.getElementById('price').value),
    roast: document.getElementById('roast').value,
    rating: parseFloat(document.getElementById('rating').value),
    description: document.getElementById('description').value || 'Sin descripción'
  };
  
  try {
    const url = currentEditingId 
      ? `${getBackendURL()}/api/products/${currentEditingId}`
      : `${getBackendURL()}/api/products`;
    
    const method = currentEditingId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coffeeData)
    });
    
    if (response.ok) {
      alert(currentEditingId ? '✅ Café actualizado!' : '✅ Café agregado!');
      cancelEdit();
      await renderCoffees();
      await updateStats();
    } else {
      alert('❌ Error al guardar el café');
    }
  } catch (error) {
    alert('❌ Error de conexión');
  }
}

// Exponer funciones globalmente para los tests
global.getBackendURL = getBackendURL;
global.toggleForm = toggleForm;
global.cancelEdit = cancelEdit;
global.editCoffee = editCoffee;
global.deleteCoffee = deleteCoffee;
global.renderCoffees = renderCoffees;
global.updateStats = updateStats;
global.handleFormSubmit = handleFormSubmit;

// ================================
// 🧪 TESTS
// ================================

describe('CoffeeHub Frontend', () => {
  
  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();
    fetch.mockClear();
    alert.mockClear();
    confirm.mockClear();
    currentEditingId = null;
  });

  // ================================
  // TESTS: getBackendURL()
  // ================================
  describe('getBackendURL()', () => {
    
    test('debe retornar URL local para localhost', () => {
      // ✅ El hostname por defecto de setupDOM() es 'localhost'
      expect(getBackendURL()).toBe('http://localhost:4000');
    });

    test('debe retornar URL de QA para ambiente QA', () => {
      // ✅ SOLUCIÓN: Reemplazar completamente el objeto location
      delete global.window.location;
      global.window.location = { hostname: 'coffeehub-front-qa-test.azurewebsites.net' };
      
      const result = getBackendURL();
      
      expect(result).toContain('coffeehub-back-qa');
    });

    test('debe retornar URL de PROD para ambiente PROD', () => {
      // ✅ Reemplazar el objeto location
      delete global.window.location;
      global.window.location = { hostname: 'coffeehub-front-prod-test.azurewebsites.net' };
      
      const result = getBackendURL();
      
      expect(result).toContain('coffeehub-back-prod');
    });

    test('debe usar fallback para hostname desconocido', () => {
      // ✅ Reemplazar el objeto location
      delete global.window.location;
      global.window.location = { hostname: 'unknown-domain.com' };
      
      const result = getBackendURL();
      
      expect(result).toContain('coffeehub-back-qa');
    });
  });

  // ================================
  // TESTS: toggleForm()
  // ================================
  describe('toggleForm()', () => {
    test('debe mostrar formulario cuando está oculto', () => {
      const form = document.getElementById('add-form');
      form.style.display = 'none';
      
      toggleForm();
      
      expect(form.style.display).toBe('block');
    });

    test('debe ocultar formulario cuando está visible', () => {
      const form = document.getElementById('add-form');
      form.style.display = 'block';
      
      toggleForm();
      
      expect(form.style.display).toBe('none');
    });
  });

  // ================================
  // TESTS: cancelEdit()
  // ================================
  describe('cancelEdit()', () => {
    test('debe resetear formulario correctamente', () => {
      document.getElementById('name').value = 'Café Test';
      document.getElementById('form-title').textContent = 'Editar Café';
      document.getElementById('submit-btn').innerHTML = '💾 Guardar Cambios';
      document.getElementById('cancel-btn').style.display = 'inline-block';
      currentEditingId = '12345';
      
      cancelEdit();
      
      expect(document.getElementById('name').value).toBe('');
      expect(document.getElementById('form-title').textContent).toBe('Agregar Nuevo Café');
      expect(document.getElementById('submit-btn').innerHTML).toBe('✅ Agregar Café');
      expect(document.getElementById('cancel-btn').style.display).toBe('none');
      expect(currentEditingId).toBeNull();
    });
  });

  // ================================
  // TESTS: editCoffee()
  // ================================
  describe('editCoffee()', () => {
    test('debe llenar formulario con datos del café', () => {
      const coffee = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Café Colombiano',
        origin: 'Colombia',
        type: 'Arábica',
        price: 15.99,
        roast: 'Medio',
        rating: 4.5,
        description: 'Café suave'
      };
      
      editCoffee(coffee);
      
      expect(document.getElementById('name').value).toBe('Café Colombiano');
      expect(document.getElementById('origin').value).toBe('Colombia');
      expect(document.getElementById('price').value).toBe('15.99');
      expect(document.getElementById('rating').value).toBe('4.5');
      expect(currentEditingId).toBe('507f1f77bcf86cd799439011');
    });

    test('debe cambiar a modo edición', () => {
      const coffee = {
        _id: '123',
        name: 'Test',
        origin: 'Test',
        type: 'Test',
        price: 10,
        roast: 'Test',
        rating: 4,
        description: 'Test'
      };
      
      editCoffee(coffee);
      
      expect(document.getElementById('form-title').textContent).toBe('Editar Café');
      expect(document.getElementById('submit-btn').innerHTML).toBe('💾 Guardar Cambios');
      expect(document.getElementById('cancel-btn').style.display).toBe('inline-block');
      expect(document.getElementById('add-form').style.display).toBe('block');
    });
  });

  // ================================
  // TESTS: deleteCoffee()
  // ================================
  describe('deleteCoffee()', () => {
    test('debe eliminar café cuando usuario confirma', async () => {
      confirm.mockReturnValue(true);
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Eliminado' })
      });
      
      await deleteCoffee('507f1f77bcf86cd799439011', 'Café Test');
      
      expect(confirm).toHaveBeenCalledWith('¿Estás seguro de eliminar "Café Test"?');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products/507f1f77bcf86cd799439011'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(alert).toHaveBeenCalledWith('✅ Café eliminado exitosamente!');
    });

    test('no debe eliminar si usuario cancela', async () => {
      confirm.mockReturnValue(false);
      
      await deleteCoffee('507f1f77bcf86cd799439011', 'Café Test');
      
      expect(confirm).toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });

    test('debe manejar error de API', async () => {
      confirm.mockReturnValue(true);
      fetch.mockResolvedValue({ ok: false });
      
      await deleteCoffee('507f1f77bcf86cd799439011', 'Café Test');
      
      expect(alert).toHaveBeenCalledWith('❌ Error al eliminar el café');
    });
  });

  // ================================
  // TESTS: renderCoffees()
  // ================================
  describe('renderCoffees()', () => {
    test('debe renderizar lista de cafés correctamente', async () => {
      const mockCoffees = [
        {
          _id: '1',
          name: 'Café Colombiano',
          origin: 'Colombia',
          type: 'Arábica',
          price: 15.99,
          roast: 'Medio',
          rating: 4.5,
          description: 'Café suave'
        },
        {
          _id: '2',
          name: 'Café Brasileño',
          origin: 'Brasil',
          type: 'Robusta',
          price: 12.99,
          roast: 'Oscuro',
          rating: 4.0,
          description: 'Café fuerte'
        }
      ];
      
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockCoffees
      });
      
      await renderCoffees();
      
      const grid = document.getElementById('coffee-grid');
      expect(grid.innerHTML).toContain('Café Colombiano');
      expect(grid.innerHTML).toContain('Café Brasileño');
      expect(grid.innerHTML).toContain('Colombia');
      expect(grid.innerHTML).toContain('Brasil');
    });

    test('debe mostrar mensaje cuando no hay cafés', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => []
      });
      
      await renderCoffees();
      
      const grid = document.getElementById('coffee-grid');
      expect(grid.innerHTML).toContain('No hay cafés registrados');
    });

    test('debe mostrar error cuando falla la API', async () => {
      fetch.mockResolvedValue({ ok: false });
      
      await renderCoffees();
      
      const grid = document.getElementById('coffee-grid');
      expect(grid.innerHTML).toContain('Error al conectar con el servidor');
    });

    test('debe incluir botones de editar y eliminar', async () => {
      const mockCoffees = [{
        _id: '1',
        name: 'Café Test',
        origin: 'Test',
        type: 'Test',
        price: 10,
        roast: 'Test',
        rating: 4,
        description: 'Test'
      }];
      
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockCoffees
      });
      
      await renderCoffees();
      
      const grid = document.getElementById('coffee-grid');
      expect(grid.innerHTML).toContain('Editar');
      expect(grid.innerHTML).toContain('Eliminar');
    });
  });

  // ================================
  // TESTS: updateStats()
  // ================================
  describe('updateStats()', () => {
    test('debe actualizar estadísticas correctamente', async () => {
      const mockStats = {
        total: 10,
        avgPrice: '15.50',
        popularOrigin: 'Colombia'
      };
      
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockStats
      });
      
      await updateStats();
      
      expect(document.getElementById('total-coffees').textContent).toBe('10');
      expect(document.getElementById('avg-price').textContent).toBe('$15.50');
      expect(document.getElementById('popular-origin').textContent).toBe('Colombia');
    });

    test('debe manejar error de API sin romper', async () => {
      fetch.mockResolvedValue({ ok: false });
      
      await expect(updateStats()).resolves.not.toThrow();
    });

    test('debe manejar valores por defecto', async () => {
      const mockStats = {
        total: 0,
        avgPrice: 0,
        popularOrigin: 'N/A'
      };
      
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockStats
      });
      
      await updateStats();
      
      expect(document.getElementById('total-coffees').textContent).toBe('0');
      expect(document.getElementById('avg-price').textContent).toBe('$0');
      expect(document.getElementById('popular-origin').textContent).toBe('N/A');
    });
  });

  // ================================
  // TESTS: handleFormSubmit()
  // ================================
  describe('handleFormSubmit()', () => {
    test('debe crear nuevo café exitosamente', async () => {
      document.getElementById('name').value = 'Café Nuevo';
      document.getElementById('origin').value = 'Guatemala';
      document.getElementById('type').value = 'Arábica';
      document.getElementById('price').value = '17.50';
      document.getElementById('roast').value = 'Claro';
      document.getElementById('rating').value = '4.7';
      document.getElementById('description').value = 'Excelente café';
      
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ _id: '123', name: 'Café Nuevo' })
      });
      
      const event = { preventDefault: jest.fn() };
      await handleFormSubmit(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Café Nuevo')
        })
      );
      expect(alert).toHaveBeenCalledWith('✅ Café agregado!');
    });

    test('debe actualizar café existente', async () => {
      currentEditingId = '507f1f77bcf86cd799439011';
      
      document.getElementById('name').value = 'Café Actualizado';
      document.getElementById('origin').value = 'Colombia';
      document.getElementById('type').value = 'Arábica';
      document.getElementById('price').value = '18.99';
      document.getElementById('roast').value = 'Medio';
      document.getElementById('rating').value = '4.8';
      
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Actualizado' })
      });
      
      const event = { preventDefault: jest.fn() };
      await handleFormSubmit(event);
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products/507f1f77bcf86cd799439011'),
        expect.objectContaining({ method: 'PUT' })
      );
      expect(alert).toHaveBeenCalledWith('✅ Café actualizado!');
    });

    test('debe usar descripción por defecto si está vacía', async () => {
      document.getElementById('name').value = 'Café Sin Desc';
      document.getElementById('origin').value = 'Test';
      document.getElementById('type').value = 'Test';
      document.getElementById('price').value = '10';
      document.getElementById('roast').value = 'Test';
      document.getElementById('rating').value = '4';
      document.getElementById('description').value = '';
      
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ _id: '123' })
      });
      
      const event = { preventDefault: jest.fn() };
      await handleFormSubmit(event);
      
      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining('Sin descripción')
        })
      );
    });

    test('debe manejar error de API', async () => {
      document.getElementById('name').value = 'Test';
      document.getElementById('origin').value = 'Test';
      document.getElementById('type').value = 'Test';
      document.getElementById('price').value = '10';
      document.getElementById('roast').value = 'Test';
      document.getElementById('rating').value = '4';
      
      fetch.mockResolvedValue({ ok: false });
      
      const event = { preventDefault: jest.fn() };
      await handleFormSubmit(event);
      
      expect(alert).toHaveBeenCalledWith('❌ Error al guardar el café');
    });
  });
});