// This is a complete script to replace the problematic JavaScript in index.html

// API endpoint configuration
const API_URL = 'https://saigon-soundscape-production.up.railway.app/api';
let map;
let tempMarker;
let selectedLocation = null;

// Function to update storage info in the footer
function updateStorageInfo() {
    // Mock storage data for development
    const footer = document.querySelector('footer p');
    
    if (footer) {
        footer.innerHTML = `&copy; 2025 Saigon Sound Archive | Created by <a href="https://officinegap.com/" target="_blank">Officine Gặp</a> | 
                        Storage: <span class="storage-indicator active">Local Storage (Active)</span>`;
    }
}

// Function to handle map load errors
function handleMapboxLoadError() {
    console.error('Failed to load Mapbox GL JS');
    if (document.getElementById('map')) {
        document.getElementById('map').innerHTML = '<div class="map-error"><h3>Map could not be loaded</h3><p>Please check your internet connection or try refreshing the page.</p></div>';
    }
}

// Function to initialize map with error handling
function initMap() {
    try {
        // Check if mapboxgl is defined
        if (typeof mapboxgl === 'undefined') {
            console.error('Mapbox GL JS is not defined');
            handleMapboxLoadError();
            return;
        }
        
        console.log('Initializing map with Mapbox GL JS');
        
        // Set Mapbox access token
        mapboxgl.accessToken = 'pk.eyJ1Ijoic2lkZXdhbGtjaXR5IiwiYSI6ImNtN2c3Z28zZzBiZmsya3M3eXU2emEzOXQifQ.hLfguhn2EXIhg3XZL1_Dcw';
        
        // Create map instance
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [106.6953, 10.7765], // Ho Chi Minh City
            zoom: 12,
            minZoom: 10, // Restrict zoom out
            maxZoom: 18, // Allow good zoom in
            maxBounds: [ // Restrict to area around HCMC
                [106.5, 10.6], // Southwest coordinates
                [106.9, 10.9]  // Northeast coordinates
            ]
        });
        
        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl());
        
        // Add geolocation control
        map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true
            })
        );
        
        // Setup map click for coordinates
        map.on('click', function(e) {
            console.log('Map clicked at:', e.lngLat);
            
            // Update form coordinates
            const latitudeInput = document.getElementById('latitude');
            const longitudeInput = document.getElementById('longitude');
            const recordLatitudeInput = document.getElementById('record-latitude');
            const recordLongitudeInput = document.getElementById('record-longitude');
            
            if (latitudeInput) latitudeInput.value = e.lngLat.lat.toFixed(6);
            if (longitudeInput) longitudeInput.value = e.lngLat.lng.toFixed(6);
            if (recordLatitudeInput) recordLatitudeInput.value = e.lngLat.lat.toFixed(6);
            if (recordLongitudeInput) recordLongitudeInput.value = e.lngLat.lng.toFixed(6);
            
            // Store the selected location
            selectedLocation = {
                lat: e.lngLat.lat,
                lng: e.lngLat.lng
            };
            
            // Create a temporary marker
            if (typeof tempMarker !== 'undefined' && tempMarker) {
                tempMarker.remove();
            }
            
            // Create marker element
            const markerElement = document.createElement('div');
            markerElement.className = 'marker-pin';
            markerElement.style.width = '20px';
            markerElement.style.height = '20px';
            markerElement.style.backgroundColor = '#FF5722';
            markerElement.style.borderRadius = '50%';
            markerElement.style.border = '2px solid white';
            
            // Add marker to map
            tempMarker = new mapboxgl.Marker(markerElement)
                .setLngLat(e.lngLat)
                .addTo(map);
            
            // Open the form
            openUploadForm();
        });
    } catch (error) {
        console.error('Error initializing map:', error);
        handleMapboxLoadError();
    }
}

// Function to open upload form
function openUploadForm() {
    const formOverlay = document.getElementById('form-overlay');
    if (formOverlay) {
        formOverlay.style.display = 'flex';
    } else {
        console.error('Form overlay element not found!');
    }
}

// Function to close upload form
function closeUploadForm() {
    const formOverlay = document.getElementById('form-overlay');
    if (formOverlay) {
        formOverlay.style.display = 'none';
    }
    
    // Remove temporary marker if it exists
    if (typeof tempMarker !== 'undefined' && tempMarker) {
        tempMarker.remove();
        tempMarker = null;
    }
    
    // Reset any form data
    const audioForm = document.getElementById('audio-form');
    if (audioForm) {
        audioForm.reset();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app');
    
    // Initialize map
    initMap();
    
    // Setup form controls
    const uploadButton = document.getElementById('upload-button');
    const formOverlay = document.getElementById('form-overlay');
    const closeFormButton = document.getElementById('form-close');
    const cancelButton = document.getElementById('cancel-button');
    const audioForm = document.getElementById('audio-form');
    
    // Open upload form when clicking the + button
    if (uploadButton) {
        uploadButton.addEventListener('click', function() {
            openUploadForm();
        });
    }
    
    // Close form buttons
    if (closeFormButton) {
        closeFormButton.addEventListener('click', closeUploadForm);
    }
    
    if (cancelButton) {
        cancelButton.addEventListener('click', closeUploadForm);
    }
    
    // Close form when clicking outside
    if (formOverlay) {
        formOverlay.addEventListener('click', function(e) {
            if (e.target === formOverlay) {
                closeUploadForm();
            }
        });
    }
    
    // Handle form submission
    if (audioForm) {
        audioForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Check if coordinates are set
            const lat = document.getElementById('latitude').value;
            const lng = document.getElementById('longitude').value;
            
            if (!lat || !lng) {
                alert('Please click on the map to set a location first');
                return;
            }
            
            const formData = new FormData(audioForm);
            
            // Add loading state
            const submitButton = document.getElementById('submit-button');
            if (submitButton) {
                const originalText = submitButton.textContent;
                submitButton.textContent = 'Uploading...';
                submitButton.disabled = true;
                
                // Simulated upload
                setTimeout(function() {
                    alert('Upload functionality would connect to the backend API here');
                    closeUploadForm();
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }, 1500);
            }
        });
    }
    
    // Update storage info
    updateStorageInfo();
});
