// Initialize variables
let map;
let userMarker;
let selectedLocation;
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2lkZXdhbGtjaXR5IiwiYSI6ImNtN2c3Z28zZzBiZmsya3M3eXU2emEzOXQifQ.hLfguhn2EXIhg3XZL1_Dcw';
const STREET_STYLE_URL = 'mapbox://styles/mapbox/streets-v12';
const SATELLITE_STYLE_URL = 'mapbox://styles/mapbox/satellite-streets-v12';
const API_URL = 'https://saigon-soundscape-production.up.railway.app/api';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing Saigon Sound Archive');

    // Robust element selection with error handling
    const getElement = (selector) => {
        const element = document.querySelector(selector);
        if (!element) {
            console.error(`Element not found: ${selector}`);
            return null;
        }
        return element;
    };

    const streetViewBtn = getElement('#street-view-btn');
    const satelliteViewBtn = getElement('#satellite-view-btn');
    const locationDisplay = getElement('#location-display');
    const uploadForm = getElement('#upload-form');
    const fileInput = getElement('#audio-file');
    const uploadPanel = getElement('#recording-panel');
    const audioPreview = getElement('#audio-preview');

    // Detailed logging for element selection
    console.log('Elements selected:', {
        uploadForm: !!uploadForm,
        fileInput: !!fileInput,
        locationDisplay: !!locationDisplay,
        uploadPanel: !!uploadPanel,
        audioPreview: !!audioPreview
    });

    // Check if all required elements exist
    if (!uploadForm || !fileInput || !locationDisplay || !uploadPanel || !audioPreview) {
        console.error('One or more required elements are missing');
        return;
    }

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
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview audio file
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
        
        // Add current date to the description
        const descriptionInput = getElement('#recording-description');
        const description = `${descriptionInput.value} | Recorded on ${new Date().toLocaleDateString()}`;
        formData.append('description', description);
        
        formData.append('lat', selectedLocation.lat);
        formData.append('lng', selectedLocation.lng);

        console.log('Attempting to upload with following data:', {
            fileSize: audioFile.size,
            fileType: audioFile.type,
            description: description,
            location: selectedLocation
        });

        try {
            console.log(`Sending request to: ${API_URL}/recordings`);
            const response = await fetch(`${API_URL}/recordings`, {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                alert('Audio uploaded successfully!');
                uploadForm.reset();
                uploadPanel.classList.add('hidden');
                audioPreview.style.display = 'none';
            } else {
                try {
                    const errorData = await response.json();
                    console.error('Server error response:', errorData);
                    alert(`Upload failed: ${errorData.message || 'Unknown error'}`);
                } catch (parseError) {
                    console.error('Could not parse error response', parseError);
                    alert('Upload failed with an unreadable error');
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload audio. Please check your network connection.');
        }
    });
});
