// Initialize variables
let map;
let userMarker;
let selectedLocation;
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2lkZXdhbGtjaXR5IiwiYSI6ImNtN2c3Z28zZzBiZmsya3M3eXU2emEzOXQifQ.hLfguhn2EXIhg3XZL1_Dcw';
const STREET_STYLE_URL = 'mapbox://styles/mapbox/streets-v12';
const SATELLITE_STYLE_URL = 'mapbox://styles/mapbox/satellite-streets-v12';
const API_URL = 'https://saigon-soundscape-production.up.railway.app/api';

// DOM elements
document.addEventListener('DOMContentLoaded', () => {
    const streetViewBtn = document.getElementById('street-view-btn');
    const satelliteViewBtn = document.getElementById('satellite-view-btn');

    // Initialize map
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    
    map = new mapboxgl.Map({
        container: 'map',
        style: STREET_STYLE_URL,
        center: [106.6953, 10.7719], // Ho Chi Minh City coordinates
        zoom: 12,
        pitch: 45,
        bearing: -17.6,
        maxBounds: [
            [106.4, 10.5], // Southwest coordinates
            [107.0, 11.0]  // Northeast coordinates
        ]
    });
    
    map.addControl(new mapboxgl.NavigationControl());
    
    // Async function to update storage usage
    async function updateStorageUsage() {
        try {
            const response = await fetch(`${API_URL}/admin/storage-usage`);
            const result = await response.json();

            if (result.success) {
                const { usedSpaceBytes, totalSpaceBytes, usedPercentage } = result.data;
                
                // Create or update storage usage indicator
                let storageIndicator = document.getElementById('storage-usage-indicator');
                if (!storageIndicator) {
                    storageIndicator = document.createElement('div');
                    storageIndicator.id = 'storage-usage-indicator';
                    storageIndicator.classList.add('storage-indicator');
                    
                    // Position it in the bottom-right of the map
                    storageIndicator.style.position = 'absolute';
                    storageIndicator.style.bottom = '10px';
                    storageIndicator.style.right = '10px';
                    storageIndicator.style.backgroundColor = 'rgba(255,255,255,0.8)';
                    storageIndicator.style.padding = '10px';
                    storageIndicator.style.borderRadius = '5px';
                    storageIndicator.style.zIndex = '1000';
                    
                    map.getContainer().appendChild(storageIndicator);
                }

                // Update content
                storageIndicator.innerHTML = `
                    <strong>Storage Usage:</strong><br>
                    ${(usedSpaceBytes / (1024 * 1024)).toFixed(2)} MB / 
                    ${(totalSpaceBytes / (1024 * 1024)).toFixed(2)} MB<br>
                    ${usedPercentage.toFixed(2)}% Used
                `;

                // Color-code the indicator based on usage
                if (usedPercentage < 50) {
                    storageIndicator.style.color = 'green';
                } else if (usedPercentage < 80) {
                    storageIndicator.style.color = 'orange';
                } else {
                    storageIndicator.style.color = 'red';
                }
            }
        } catch (error) {
            console.error('Error fetching storage usage:', error);
        }
    }
    
    // Map style switching
    streetViewBtn.addEventListener('click', () => {
        map.setStyle(STREET_STYLE_URL);
        streetViewBtn.classList.add('active');
        satelliteViewBtn.classList.remove('active');
    });

    satelliteViewBtn.addEventListener('click', () => {
        map.setStyle(SATELLITE_STYLE_URL);
        satelliteViewBtn.classList.add('active');
        streetViewBtn.classList.remove('active');
    });
    
    // Load existing recordings when map loads
    map.on('load', () => {
        loadRecordings();
        updateStorageUsage();
        
        // Optional: Update storage usage periodically
        setInterval(updateStorageUsage, 5 * 60 * 1000); // Every 5 minutes
    });
    
    // Rest of the existing code remains the same (loadRecordings, etc.)
});
