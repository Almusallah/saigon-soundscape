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
    
    // Load existing recordings when map loads
    map.on('load', () => {
        loadRecordings();
    });
    
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

    // Load recordings function
    async function loadRecordings() {
        try {
            const response = await fetch(`${API_URL}/recordings`);
            const { data } = await response.json();

            // Add markers for each recording
            data.forEach(recording => {
                // Create marker element
                const markerElement = document.createElement('div');
                markerElement.className = 'marker recording-marker';
                
                // Add marker to map
                const marker = new mapboxgl.Marker(markerElement)
                    .setLngLat(recording.location.coordinates)
                    .addTo(map);
                
                // Add popup with recording details
                const popup = new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`
                        <div class="recording-popup">
                            <h3>Sound Recording</h3>
                            <p>${recording.description}</p>
                            <audio controls>
                                <source src="${recording.audioPath}" type="audio/webm">
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    `);
                
                marker.setPopup(popup);
            });
        } catch (error) {
            console.error('Error loading recordings:', error);
        }
    }

    // Handle recording upload
    const uploadForm = document.getElementById('upload-form');
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedLocation) {
            alert('Please select a location on the map');
            return;
        }

        const audioFile = document.getElementById('audio-preview');
        const description = document.getElementById('recording-description').value;

        // Convert audio preview to blob
        const audioBlob = await fetch(audioFile.src).then(r => r.blob());

        // Create form data
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('description', description);
        formData.append('lat', selectedLocation.lat);
        formData.append('lng', selectedLocation.lng);

        try {
            const response = await fetch(`${API_URL}/recordings`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // Reload recordings to show the new marker
                loadRecordings();
                
                // Reset form and hide panel
                uploadForm.reset();
                recordingPanel.classList.add('hidden');
                audioFile.src = '';
                audioFile.style.display = 'none';
                
                alert('Recording uploaded successfully!');
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload recording');
        }
    });
});
