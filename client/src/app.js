// Initialize variables
let map;
let userMarker;
let selectedLocation;
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2lkZXdhbGtjaXR5IiwiYSI6ImNtN2c3Z28zZzBiZmsya3M3eXU2emEzOXQifQ.hLfguhn2EXIhg3XZL1_Dcw';
const STREET_STYLE_URL = 'mapbox://styles/mapbox/streets-v12';
const SATELLITE_STYLE_URL = 'mapbox://styles/mapbox/satellite-streets-v12';

// The confirmed working Railway API URL
const API_URL = 'https://saigon-soundscape-production.up.railway.app/api';
const DEMO_MODE = false; // API is now working, so we can disable demo mode

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing Saigon Sound Archive');
    console.log('API URL:', API_URL);
    
    // Check API availability
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
    
    // Rest of your code...
    
    // Upload form handler
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
            // Show loading indicator
            console.log('Uploading audio to API...');
            
            const formData = new FormData();
            formData.append('audio', audioFile);
            formData.append('description', document.getElementById('recording-description').value);
            formData.append('lat', selectedLocation.lat);
            formData.append('lng', selectedLocation.lng);
            
            const response = await fetch(`${API_URL}/test`, {
                method: 'GET'
            });
            
            // For now, we're just checking if the API test endpoint works
            if (response.ok) {
                alert('Audio upload simulation successful!');
                uploadForm.reset();
                uploadPanel.classList.add('hidden');
                audioPreview.style.display = 'none';
            } else {
                alert('Upload simulation failed. API returned status: ' + response.status);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload audio. Please check your network connection.');
        }
    });
});
