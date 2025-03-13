// Initialize variables
let map;
let userMarker;
let selectedLocation;
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2lkZXdhbGtjaXR5IiwiYSI6ImNtN2c3Z28zZzBiZmsya3M3eXU2emEzOXQifQ.hLfguhn2EXIhg3XZL1_Dcw';
const STREET_STYLE_URL = 'mapbox://styles/mapbox/streets-v12';
const SATELLITE_STYLE_URL = 'mapbox://styles/mapbox/satellite-streets-v12';

// The confirmed working Railway API URL
const API_URL = 'https://saigon-soundscape-production.up.railway.app/api';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing Saigon Sound Archive');
    
    // API health check
    fetch(`${API_URL}/health`)
        .then(response => {
            console.log('API health check response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('API health check successful:', data);
        })
        .catch(error => {
            console.error('API health check failed:', error);
        });
    
    // Initialize map
    try {
        console.log('Initializing Mapbox with token:', MAPBOX_ACCESS_TOKEN);
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
        
        map = new mapboxgl.Map({
            container: 'map',
            style: STREET_STYLE_URL,
            center: [106.6953, 10.7719], // Ho Chi Minh City coordinates
            zoom: 12,
            pitch: 45,
            bearing: -17.6
        });
        
        console.log('Map initialized successfully');
        
        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add geolocate control
        map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
                showUserHeading: true
            }),
            'top-right'
        );
        
        // Get DOM elements
        const streetViewBtn = document.getElementById('street-view-btn');
        const satelliteViewBtn = document.getElementById('satellite-view-btn');
        const locationDisplay = document.getElementById('location-display');
        const uploadForm = document.getElementById('upload-form');
        const fileInput = document.getElementById('audio-file');
        const uploadPanel = document.getElementById('recording-panel');
        const audioPreview = document.getElementById('audio-preview');
        
        console.log('DOM elements:', {
            streetViewBtn: !!streetViewBtn,
            satelliteViewBtn: !!satelliteViewBtn,
            locationDisplay: !!locationDisplay,
            uploadForm: !!uploadForm,
            fileInput: !!fileInput,
            uploadPanel: !!uploadPanel,
            audioPreview: !!audioPreview
        });
        
        // Map click handler
        map.on('click', (e) => {
            selectedLocation = e.lngLat;
            
            if (locationDisplay) {
                locationDisplay.textContent = `Selected: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`;
            }
            
            if (uploadPanel) {
                uploadPanel.classList.remove('hidden');
            }
            
            // Remove previous marker
            if (userMarker) userMarker.remove();
            
            // Add new marker
            userMarker = new mapboxgl.Marker()
                .setLngLat(selectedLocation)
                .addTo(map);
        });
        
        // Style switching
        if (streetViewBtn) {
            streetViewBtn.addEventListener('click', () => {
                map.setStyle(STREET_STYLE_URL);
                streetViewBtn.classList.add('active');
                satelliteViewBtn.classList.remove('active');
            });
        }
        
        if (satelliteViewBtn) {
            satelliteViewBtn.addEventListener('click', () => {
                map.setStyle(SATELLITE_STYLE_URL);
                satelliteViewBtn.classList.add('active');
                streetViewBtn.classList.remove('active');
            });
        }
        
        // File upload handler
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                console.log('File selected:', {
                    name: file.name,
                    type: file.type,
                    size: file.size
                });
                
                // Preview audio file
                if (audioPreview) {
                    audioPreview.src = URL.createObjectURL(file);
                    audioPreview.style.display = 'block';
                }
            });
        }
        
        // Upload form handler
        if (uploadForm) {
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
                
                try {
                    // Simulate successful upload for now
                    alert('Your audio has been processed successfully!');
                    
                    // Clear form and UI
                    uploadForm.reset();
                    uploadPanel.classList.add('hidden');
                    audioPreview.style.display = 'none';
                } catch (error) {
                    console.error('Upload error:', error);
                    alert('Failed to upload audio. Please check your network connection.');
                }
            });
        }
    } catch (error) {
        console.error('Map initialization error:', error);
    }
});
EOL~
cat > client/src/app.js << 'EOL'
// Initialize variables
let map;
let userMarker;
let selectedLocation;
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2lkZXdhbGtjaXR5IiwiYSI6ImNtN2c3Z28zZzBiZmsya3M3eXU2emEzOXQifQ.hLfguhn2EXIhg3XZL1_Dcw';
const STREET_STYLE_URL = 'mapbox://styles/mapbox/streets-v12';
const SATELLITE_STYLE_URL = 'mapbox://styles/mapbox/satellite-streets-v12';

// The confirmed working Railway API URL
const API_URL = 'https://saigon-soundscape-production.up.railway.app/api';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing Saigon Sound Archive');
    
    // API health check
    fetch(`${API_URL}/health`)
        .then(response => {
            console.log('API health check response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('API health check successful:', data);
        })
        .catch(error => {
            console.error('API health check failed:', error);
        });
    
    // Initialize map
    try {
        console.log('Initializing Mapbox with token:', MAPBOX_ACCESS_TOKEN);
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
        
        map = new mapboxgl.Map({
            container: 'map',
            style: STREET_STYLE_URL,
            center: [106.6953, 10.7719], // Ho Chi Minh City coordinates
            zoom: 12,
            pitch: 45,
            bearing: -17.6
        });
        
        console.log('Map initialized successfully');
        
        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add geolocate control
        map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
                showUserHeading: true
            }),
            'top-right'
        );
        
        // Get DOM elements
        const streetViewBtn = document.getElementById('street-view-btn');
        const satelliteViewBtn = document.getElementById('satellite-view-btn');
        const locationDisplay = document.getElementById('location-display');
        const uploadForm = document.getElementById('upload-form');
        const fileInput = document.getElementById('audio-file');
        const uploadPanel = document.getElementById('recording-panel');
        const audioPreview = document.getElementById('audio-preview');
        
        console.log('DOM elements:', {
            streetViewBtn: !!streetViewBtn,
            satelliteViewBtn: !!satelliteViewBtn,
            locationDisplay: !!locationDisplay,
            uploadForm: !!uploadForm,
            fileInput: !!fileInput,
            uploadPanel: !!uploadPanel,
            audioPreview: !!audioPreview
        });
        
        // Map click handler
        map.on('click', (e) => {
            selectedLocation = e.lngLat;
            
            if (locationDisplay) {
                locationDisplay.textContent = `Selected: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`;
            }
            
            if (uploadPanel) {
                uploadPanel.classList.remove('hidden');
            }
            
            // Remove previous marker
            if (userMarker) userMarker.remove();
            
            // Add new marker
            userMarker = new mapboxgl.Marker()
                .setLngLat(selectedLocation)
                .addTo(map);
        });
        
        // Style switching
        if (streetViewBtn) {
            streetViewBtn.addEventListener('click', () => {
                map.setStyle(STREET_STYLE_URL);
                streetViewBtn.classList.add('active');
                satelliteViewBtn.classList.remove('active');
            });
        }
        
        if (satelliteViewBtn) {
            satelliteViewBtn.addEventListener('click', () => {
                map.setStyle(SATELLITE_STYLE_URL);
                satelliteViewBtn.classList.add('active');
                streetViewBtn.classList.remove('active');
            });
        }
        
        // File upload handler
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                console.log('File selected:', {
                    name: file.name,
                    type: file.type,
                    size: file.size
                });
                
                // Preview audio file
                if (audioPreview) {
                    audioPreview.src = URL.createObjectURL(file);
                    audioPreview.style.display = 'block';
                }
            });
        }
        
        // Upload form handler
        if (uploadForm) {
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
                
                try {
                    // Simulate successful upload for now
                    alert('Your audio has been processed successfully!');
                    
                    // Clear form and UI
                    uploadForm.reset();
                    uploadPanel.classList.add('hidden');
                    audioPreview.style.display = 'none';
                } catch (error) {
                    console.error('Upload error:', error);
                    alert('Failed to upload audio. Please check your network connection.');
                }
            });
        }
    } catch (error) {
        console.error('Map initialization error:', error);
    }
});
