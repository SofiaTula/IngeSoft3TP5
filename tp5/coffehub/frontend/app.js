let API_URL = "";

async function initConfig() {
  try {
    const res = await fetch("/config.json");
    const config = await res.json();

    // Detectar entorno según la URL del navegador
    if (window.location.hostname.includes("qa")) {
      API_URL = config.qa.apiUrl;
    } else if (window.location.hostname.includes("prod")) {
      API_URL = config.prod.apiUrl;
    } else {
      API_URL = config.local.apiUrl;
    }

    console.log("🌐 Usando API:", API_URL);

    renderCoffees();
    updateStats();
  } catch (err) {
    console.error("❌ Error cargando configuración:", err);
  }
}

initConfig();
