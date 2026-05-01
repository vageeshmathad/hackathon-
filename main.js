// main.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Inject dynamic image URLs
document.getElementById('insight-chart').src = `${API_BASE_URL}/static/place_vs_flood.png`;
document.getElementById('dist-chart').src = `${API_BASE_URL}/static/flood_distribution.png`;
document.getElementById('reg-chart').src = `${API_BASE_URL}/static/place_vs_flood.png`;
document.getElementById('corr-chart').src = `${API_BASE_URL}/static/correlation_heatmap.png`;
document.getElementById('api-endpoint-display').value = `${API_BASE_URL}/predict`;

// --- Tab Logic ---
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('data-target');
    
    // Update active class on links
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    
    // Show target view, hide others
    views.forEach(view => {
      if (view.id === targetId) {
        view.classList.add('active');
        // Fix map size bug when unhiding
        if(targetId === 'view-overview' && map) {
            setTimeout(() => map.invalidateSize(), 100);
        }
      } else {
        view.classList.remove('active');
      }
    });
  });
});

// --- Leaflet Map Init ---
const map = L.map('map', {
  zoomControl: false // Move zoom to bottom right
}).setView([22.5937, 78.9629], 5); // Centered on India

L.control.zoom({
  position: 'bottomright'
}).addTo(map);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// --- Base Locations ---
const locations = {
  'CHENNAI': { lat: 13.0827, lng: 80.2707, name: 'Chennai', desc: 'Coastal city, high monsoon impact.' },
  'DELHI': { lat: 28.6139, lng: 77.2090, name: 'Delhi', desc: 'Urban heat island, drainage issues.' },
  'KOLKATA': { lat: 22.5726, lng: 88.3639, name: 'Kolkata', desc: 'Riverine region, prone to flooding.' },
  'LOHIT': { lat: 27.9150, lng: 96.1710, name: 'Lohit', desc: 'Himalayan foothills, flash floods.' },
  'MUMBAI': { lat: 19.0760, lng: 72.8777, name: 'Mumbai', desc: 'Heavy monsoon, dense urbanization.' },
  'NICOBAR': { lat: 7.0423, lng: 93.7712, name: 'Nicobar', desc: 'Island territory, sea-level risks.' }
};

// --- Markers & Icons ---
const markers = {};

// Custom marker icon (cyan to fit dark theme)
const customIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #0ea5e9; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(14,165,233,0.8);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Custom click marker icon (purple)
const customClickIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #d946ef; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(217,70,239,0.8);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Initialize base markers
Object.keys(locations).forEach(key => {
  const loc = locations[key];
  const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);
  
  marker.bindPopup(`<b>${loc.name}</b><br/><span style="color:#a1a1aa; font-size:12px;">${loc.desc}</span>`);
  
  marker.on('click', () => {
    document.getElementById('place').value = key;
    map.flyTo([loc.lat, loc.lng], 6, { duration: 1.0 });

    // Mock environment values for demonstration
    document.getElementById('monsoonintensity').value = (Math.random() * 0.5 + 0.2).toFixed(3);
    document.getElementById('urbanization').value = (Math.random() * 0.05 + 0.01).toFixed(3);
    document.getElementById('topographydrainage').value = (Math.random() * 0.8 + 0.1).toFixed(3);
    
    // Automatically trigger prediction
    setTimeout(() => {
      document.getElementById('prediction-form').dispatchEvent(new Event('submit'));
    }, 400);
  });
  
  markers[key] = marker;
});

// --- ANY REGION SELECTION ---
let customMarker = null;

map.on('click', function(e) {
  const lat = e.latlng.lat.toFixed(4);
  const lng = e.latlng.lng.toFixed(4);
  
  // Remove existing custom marker if any
  if (customMarker) {
    map.removeLayer(customMarker);
  }
  
  // Add new marker
  customMarker = L.marker([lat, lng], { icon: customClickIcon }).addTo(map);
  customMarker.bindPopup(`<b>Custom Region</b><br/><span style="color:#a1a1aa; font-size:12px;">Lat: ${lat}, Lng: ${lng}</span>`).openPopup();
  
  // Update form place input
  const regionName = `Lat: ${lat}, Lng: ${lng}`;
  document.getElementById('place').value = regionName;

  // Mock environment values based loosely on coordinate heuristics or just random
  document.getElementById('monsoonintensity').value = (Math.random() * 0.8 + 0.1).toFixed(3);
  document.getElementById('urbanization').value = (Math.random() * 0.2).toFixed(3);
  document.getElementById('topographydrainage').value = (Math.random() * 0.9).toFixed(3);

  // Automatically trigger prediction
  setTimeout(() => {
    document.getElementById('prediction-form').dispatchEvent(new Event('submit'));
  }, 400);
});

// --- Handle Form Submission ---
document.getElementById('prediction-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = document.querySelector('.btn-primary');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Analyzing...';
  submitBtn.disabled = true;

  const placeVal = document.getElementById('place').value;
  const requestData = {
    place: placeVal,
    monsoonintensity: parseFloat(document.getElementById('monsoonintensity').value),
    urbanization: parseFloat(document.getElementById('urbanization').value),
    topographydrainage: parseFloat(document.getElementById('topographydrainage').value)
  };

  try {
    const errorDiv = document.getElementById('form-error');
    errorDiv.classList.add('hidden');
    errorDiv.innerHTML = '';

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      if (response.status === 422) {
         const errorData = await response.json();
         let messages = errorData.detail.map(e => `• <b>${e.loc[e.loc.length-1]}</b>: ${e.msg}`).join('<br>');
         errorDiv.innerHTML = `<strong>Validation Error:</strong><br>${messages}`;
         errorDiv.classList.remove('hidden');
         return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      errorDiv.innerHTML = data.error;
      errorDiv.classList.remove('hidden');
    } else {
      const resultBox = document.getElementById('result-box');
      const resultStatus = document.getElementById('result-status');
      const resultProb = document.getElementById('result-prob');
      const probBar = document.getElementById('prob-bar');
      
      resultBox.classList.remove('hidden');
      resultStatus.textContent = data.status;
      
      const probPercent = (data.flood_probability * 100).toFixed(1);
      resultProb.textContent = probPercent + '%';
      probBar.style.width = probPercent + '%';
      
      if (data.prediction === 1) {
        resultStatus.style.color = 'var(--accent-red)';
        probBar.style.backgroundColor = 'var(--accent-red)';
      } else {
        resultStatus.style.color = 'var(--accent-green)';
        probBar.style.backgroundColor = 'var(--accent-green)';
      }
    }
  } catch (error) {
    console.error('Error during prediction:', error);
    alert('Failed to connect to the prediction API. Ensure the backend server is running.');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});
