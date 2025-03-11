// Initialize variables
let map;
let userMarker;
let selectedLocation;
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2lkZXdhbGtjaXR5IiwiYSI6ImNtN2c3Z28zZzBiZmsya3M3eXU2emEzOXQifQ.hLfguhn2EXIhg3XZL1_Dcw';
const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/streets-v12';
const API_URL = 'https://saigon-soundscape-production.up.railway.app/api';

// DOM elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    
    map = new mapboxgl.Map({
    container: 'map',
    style: MAPBOX_STYLE_URL,
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
    
    map.on('load', () => {
        console.log('Map loaded successfully');
        
        // Add 3D buildings
        map.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 14,
            'paint': {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': [
                    'interpolate', ['linear'], ['zoom'],
                    14, 0,
                    16, ['get', 'height']
                ],
                'fill-extrusion-base': [
                    'interpolate', ['linear'], ['zoom'],
                    14, 0,
                    16, ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.7
            }
        });
    });
    
    // Set up UI elements and event listeners
    const recordingPanel = document.getElementById('recording-panel');
    const locationDisplay = document.getElementById('location-display');
    
    // Handle map clicks for recording location
    map.on('click', (e) => {
        selectedLocation = e.lngLat;
        locationDisplay.textContent = `Selected: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`;
        recordingPanel.classList.remove('hidden');
        
        // Add a marker
        if (userMarker) userMarker.remove();
        userMarker = new mapboxgl.Marker()
            .setLngLat(selectedLocation)
            .addTo(map);
    });
});
