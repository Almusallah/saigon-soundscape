// Initialize variables
let map;
let userMarker;
let selectedLocation;
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2lkZXdhbGtjaXR5IiwiYSI6ImNtN2c3Z28zZzBiZmsya3M3eXU2emEzOXQifQ.hLfguhn2EXIhg3XZL1_Dcw';
const STREET_STYLE_URL = 'mapbox://styles/mapbox/streets-v12';
const SATELLITE_STYLE_URL = 'mapbox://styles/mapbox/satellite-streets-v12';
const API_URL = 'https://saigon-soundscape-production.up.railway.app/api';

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const streetViewBtn = document.getElementById('street-view-btn');
    const satelliteViewBtn = document.getElementById('satellite-view-btn');
    const locationDisplay = document.getElementById('location-display');
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('audio-file');
    const uploadPanel = document.getElementById('recording-panel');

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

    // Add navigation and geolocation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        }),
        'top-right'
    );

    // Map click handler for location selection
    map.on('click', (e) => {
        selectedLocation = e.lngLat;
        locationDisplay.textContent = `Selected: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`;
        uploadPanel.classList.remove('hidden');
        
        // Remove previous marker
        if (userMarker) userMarker.remove();
        userMarker = new mapboxgl.Marker()
            .setLngLat(selectedLocation)
            .addTo(map);
    });

    // Style switching
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

    // File upload handler
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview audio file
        const audioPreview = document.getElementById('audio-preview');
        audioPreview.src = URL.createObjectURL(file);
        audioPreview.style.display = 'block';
    });

    // Upload form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedLocation) {
            alert('Please select a location on the map');
            return;
        }

        const audioFile = fileInput.files[0];
        if (!audioFile) {
            alert('Please select an audio file');
            return;
        }

        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('description', document.getElementById('recording-description').value);
        formData.append('lat', selectedLocation.lat);
        formData.append('lng', selectedLocation.lng);

        try {
            const response = await fetch(`${API_URL}/recordings`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Audio uploaded successfully!');
                uploadForm.reset();
                uploadPanel.classList.add('hidden');
                document.getElementById('audio-preview').style.display = 'none';
            } else {
                const errorData = await response.json();
                alert(`Upload failed: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload audio. Please try again.');
        }
    });
});
