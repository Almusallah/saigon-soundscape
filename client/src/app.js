// Initialize variables
let map;
let userMarker;
let selectedLocation;
let recordedBlob = null;
let mediaRecorder = null;
let recordingMarkers = []; // Global array to store markers
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2lkZXdhbGtjaXR5IiwiYSI6ImNtN2c3Z28zZzBiZmsya3M3eXU2emEzOXQifQ.hLfguhn2EXIhg3XZL1_Dcw';
const STREET_STYLE_URL = 'mapbox://styles/mapbox/streets-v12';
const SATELLITE_STYLE_URL = 'mapbox://styles/mapbox/satellite-streets-v12';
const API_URL = 'https://saigon-soundscape-production.up.railway.app/api';

// Global error handler for debugging
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
});

// API Connectivity Test
(async function checkApiStatus() {
    console.log('Testing API connectivity...');
    
    try {
        // Try pinging the API with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_URL}/recordings`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            console.log('✅ API connectivity test passed');
            // Add a visible indicator on the page
            setTimeout(() => {
                const statusIndicator = document.createElement('div');
                statusIndicator.style.position = 'fixed';
                statusIndicator.style.bottom = '60px';
                statusIndicator.style.right = '10px';
                statusIndicator.style.backgroundColor = '#4CAF50';
                statusIndicator.style.color = 'white';
                statusIndicator.style.padding = '5px 10px';
                statusIndicator.style.borderRadius = '5px';
                statusIndicator.style.zIndex = '1000';
                statusIndicator.textContent = 'API: Connected';
                document.body.appendChild(statusIndicator);
            }, 2000);
        } else {
            console.error('❌ API returned status:', response.status);
            showApiError('API Error: ' + response.status);
        }
    } catch (error) {
        console.error('❌ API connectivity test failed:', error);
        showApiError(error.name === 'AbortError' ? 'API Timeout' : 'API Connection Failed');
    }
    
    function showApiError(message) {
        setTimeout(() => {
            const errorIndicator = document.createElement('div');
            errorIndicator.style.position = 'fixed';
            errorIndicator.style.bottom = '60px';
            errorIndicator.style.right = '10px';
            errorIndicator.style.backgroundColor = '#F44336';
            errorIndicator.style.color = 'white';
            errorIndicator.style.padding = '5px 10px';
            errorIndicator.style.borderRadius = '5px';
            errorIndicator.style.zIndex = '1000';
            errorIndicator.textContent = message;
            document.body.appendChild(errorIndicator);
            
            // Add debug info button
            const debugButton = document.createElement('button');
            debugButton.textContent = 'Debug Info';
            debugButton.style.marginLeft = '10px';
            debugButton.style.border = 'none';
            debugButton.style.borderRadius = '3px';
            debugButton.style.padding = '2px 5px';
            debugButton.style.backgroundColor = 'white';
            debugButton.style.color = '#F44336';
            debugButton.style.cursor = 'pointer';
            errorIndicator.appendChild(debugButton);
            
            debugButton.addEventListener('click', () => {
                alert(`API Connection Debug Info:
                - Current URL: ${window.location.href}
                - API URL: ${API_URL}
                - Browser: ${navigator.userAgent}
                - Error: ${message}
                
                Possible solutions:
                1. API server might be down
                2. CORS issues - API not accepting requests from this domain
                3. Network connectivity issues
                
                Try using the file upload option instead of recording.`);
            });
        }, 2000);
    }
})();

// Check API health function
async function checkApiHealth() {
    try {
        const healthEndpoint = `${API_URL}/health`;
        console.log(`Checking API health at: ${healthEndpoint}`);
        
        const response = await fetch(healthEndpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(5000)
        }).catch(err => {
            console.warn('Health endpoint not available:', err);
            return { ok: false };
        });
        
        if (response.ok) {
            console.log('API health check: OK');
            return true;
        } else {
            console.warn(`API health check failed: ${response.status || 'no response'}`);
            return false;
        }
    } catch (error) {
        console.error('API health check error:', error);
        return false;
    }
}

// Function to check if a blob is valid
function isBlobValid(blob) {
    if (!blob) return false;
    if (blob.size === 0) return false;
    if (!blob.type || !blob.type.startsWith('audio/')) {
        console.warn('Blob type is not audio:', blob.type);
        return false;
    }
    return true;
}

// CORS proxy function (use as fallback)
async function fetchWithCorsProxy(url, options = {}) {
    // Try direct fetch first
    try {
        console.log('Attempting direct fetch to:', url);
        const directResponse = await fetch(url, options);
        return directResponse;
    } catch (directError) {
        console.warn('Direct API call failed, trying CORS proxy:', directError);
        
        // If direct fetch fails with CORS error, try with a proxy
        const corsProxyUrl = 'https://corsproxy.io/?';
        const proxyUrl = corsProxyUrl + encodeURIComponent(url);
        
        console.log('Attempting fetch through CORS proxy:', proxyUrl);
        
        // When using proxy, we can't use credentials
        const proxyOptions = {...options};
        if (proxyOptions.credentials) {
            delete proxyOptions.credentials;
        }
        
        return await fetch(proxyUrl, proxyOptions);
    }
}

// DOM elements
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for mapboxgl...');
    
    // Verify mapbox loaded correctly
    if (!window.mapboxgl) {
        console.error('mapboxgl is not defined! Mapbox script may not have loaded correctly.');
        alert('Error: Map library failed to load. Please check your internet connection and try again.');
        return;
    }
    
    // Check if Mapbox Geocoder loaded
    if (!window.MapboxGeocoder) {
        console.warn('Mapbox Geocoder not loaded correctly!');
        
        // Attempt to load it dynamically
        const geocoderScript = document.createElement('script');
        geocoderScript.src = 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.min.js';
        geocoderScript.async = true;
        geocoderScript.onload = () => {
            console.log('Mapbox Geocoder script loaded dynamically');
            if (window.mapboxgl && window.mapboxgl.Map) {
                // Refresh the page or reinitialize components
                window.location.reload();
            }
        };
        document.head.appendChild(geocoderScript);
        
        // Also add the CSS
        const geocoderCss = document.createElement('link');
        geocoderCss.rel = 'stylesheet';
        geocoderCss.href = 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css';
        geocoderCss.type = 'text/css';
        document.head.appendChild(geocoderCss);
    }
    
    // Get DOM elements
    const streetViewBtn = document.getElementById('street-view-btn');
    const satelliteViewBtn = document.getElementById('satellite-view-btn');
    const recordAudioBtn = document.getElementById('record-audio');
    const stopRecordBtn = document.getElementById('stop-record');
    const audioPreview = document.getElementById('audio-preview');
    const recordingPanel = document.getElementById('recording-panel');
    const locationDisplay = document.getElementById('location-display');
    const uploadForm = document.getElementById('upload-form');
    
    // Add file upload support to allow selecting audio files
    const fileInputContainer = document.createElement('div');
    fileInputContainer.className = 'file-input-container';
    fileInputContainer.innerHTML = `
        <label for="audio-file">Or select audio file:</label>
        <input type="file" id="audio-file" accept="audio/*" style="margin-top: 10px;">
    `;
    recordAudioBtn.parentNode.appendChild(fileInputContainer);
    
    const audioFileInput = document.getElementById('audio-file');
    audioFileInput.addEventListener('change', handleFileSelect);

    // Create search control container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
        <div id="geocoder" class="geocoder"></div>
    `;
    document.body.appendChild(searchContainer);

    // Initialize map
    try {
        console.log('Initializing map...');
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
        
        // Add error handling for the map
        map.on('error', (e) => {
            console.error('Map error:', e);
            if (e.error && (e.error.message.includes('blocked') || e.error.message.includes('ERR_BLOCKED_BY_CLIENT'))) {
                // This is okay - just ad blockers preventing analytics
                console.log('Map analytics blocked by browser, but map should still function.');
            }
        });
        
        console.log('Map initialized successfully');

        // Add standard navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add geolocation control
        map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserHeading: true
            }),
            'top-right'
        );
        
        // Add geocoder (search) functionality
        if (mapboxgl.Geocoder) {
            const geocoder = new mapboxgl.Geocoder({
                accessToken: mapboxgl.accessToken,
                mapboxgl: mapboxgl,
                marker: false,
                placeholder: 'Search for a location...',
                proximity: {
                    longitude: 106.6953,
                    latitude: 10.7719
                }
            });
            
            map.addControl(geocoder, 'top-left');
            
            // Handle selection from search
            geocoder.on('result', (e) => {
                const coordinates = e.result.center;
                selectedLocation = {
                    lng: coordinates[0],
                    lat: coordinates[1]
                };
                
                locationDisplay.textContent = `Selected: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`;
                recordingPanel.classList.remove('hidden');
                
                // Add a marker
                if (userMarker) userMarker.remove();
                userMarker = new mapboxgl.Marker()
                    .setLngLat(selectedLocation)
                    .addTo(map);
            });
        } else {
            console.warn('Mapbox Geocoder not available. Search functionality disabled.');
            
            // Create a simple search input as fallback
            const searchBar = document.createElement('div');
            searchBar.className = 'search-bar-fallback';
            searchBar.innerHTML = `
                <div class="search-bar-fallback">
                    <input type="text" id="fallback-search" placeholder="Search feature not available (API issue)">
                    <button id="search-help-btn" style="padding: 5px; margin-left: 5px;">?</button>
                </div>
            `;
            document.querySelector('.search-container').appendChild(searchBar);
            
            // Add help button functionality
            document.getElementById('search-help-btn').addEventListener('click', () => {
                alert('Search functionality is currently unavailable. Possible reasons:\n\n1. Mapbox Geocoder library failed to load\n2. API connectivity issues\n\nYou can still click directly on the map to select a location.');
            });
        }
        
        // Load existing recordings when map loads
        map.on('load', () => {
            console.log('Map loaded');
            loadRecordings();
        });
        
        // Map style switching with proper event handling
        streetViewBtn.addEventListener('click', () => {
            // Save current map state
            const currentCenter = map.getCenter();
            const currentZoom = map.getZoom();
            
            map.setStyle(STREET_STYLE_URL);
            streetViewBtn.classList.add('active');
            satelliteViewBtn.classList.remove('active');
            
            // Reload markers when style loads
            map.once('style.load', () => {
                // Restore map state
                map.setCenter(currentCenter);
                map.setZoom(currentZoom);
                // Reload markers
                loadRecordings();
            });
        });

        satelliteViewBtn.addEventListener('click', () => {
            // Save current map state
            const currentCenter = map.getCenter();
            const currentZoom = map.getZoom();
            
            map.setStyle(SATELLITE_STYLE_URL);
            satelliteViewBtn.classList.add('active');
            streetViewBtn.classList.remove('active');
            
            // Reload markers when style loads
            map.once('style.load', () => {
                // Restore map state
                map.setCenter(currentCenter);
                map.setZoom(currentZoom);
                // Reload markers
                loadRecordings();
            });
        });
        
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
    } catch (error) {
        console.error('Error initializing map:', error);
    }

    // Handle file selection
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        console.log('File selected:', file);
        
        // Create a preview of the selected file
        const audioURL = URL.createObjectURL(file);
        audioPreview.src = audioURL;
        audioPreview.style.display = 'block';
        
        // Store the file for later upload
        recordedBlob = file;
        
        // Disable recording buttons since we have a file
        recordAudioBtn.disabled = true;
        stopRecordBtn.disabled = true;
        
        // Log blob details for debugging
        console.log('File blob details:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toISOString()
        });
    }

    // Audio recording handlers
    recordAudioBtn.addEventListener('click', startRecording);
    stopRecordBtn.addEventListener('click', stopRecording);

    // Function to start recording with better mobile support
    async function startRecording() {
        try {
            // Reset any selected file
            audioFileInput.value = '';
            
            // Check if browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Your browser does not support audio recording');
                return;
            }
            
            console.log('Requesting audio access...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            console.log('Audio access granted');
            
            // Try different audio formats for better compatibility
            const options = {};
            
            // Check format support
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options.mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options.mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options.mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                options.mimeType = 'audio/ogg;codecs=opus';
            }
            
            console.log('Using MIME type:', options.mimeType || 'default');
            mediaRecorder = new MediaRecorder(stream, options);
            const audioChunks = [];
            
            mediaRecorder.addEventListener('dataavailable', event => {
                console.log('Data available event, data size:', event.data.size);
                audioChunks.push(event.data);
            });
            
            mediaRecorder.addEventListener('stop', () => {
                console.log('Recording stopped, chunks:', audioChunks.length);
                recordedBlob = new Blob(audioChunks, { 
                    type: options.mimeType || 'audio/webm' 
                });
                console.log('Created blob, size:', recordedBlob.size, 'type:', recordedBlob.type);
                const audioURL = URL.createObjectURL(recordedBlob);
                audioPreview.src = audioURL;
                audioPreview.style.display = 'block';
                
                // Stop tracks to release the microphone
                stream.getTracks().forEach(track => track.stop());
            });
            
            // Start recording
            mediaRecorder.start();
            console.log('Recording started');
            recordAudioBtn.disabled = true;
            stopRecordBtn.disabled = false;
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Failed to start recording: ' + error.message);
        }
    }
    
    // Function to stop recording
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            recordAudioBtn.disabled = false;
            stopRecordBtn.disabled = true;
        }
    }

    // Load recordings function
    async function loadRecordings() {
        try {
            // Clear existing markers
            if (recordingMarkers && recordingMarkers.length) {
                recordingMarkers.forEach(marker => {
                    if (marker && typeof marker.remove === 'function') {
                        marker.remove();
                    }
                });
                recordingMarkers = [];
            }
            
            // Fetch recordings with timeout and retry logic
            const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), timeout);
                
                try {
                    const response = await fetch(url, {
                        ...options,
                        signal: controller.signal
                    });
                    clearTimeout(id);
                    return response;
                } catch (error) {
                    clearTimeout(id);
                    throw error;
                }
            };
            
            console.log('Fetching recordings from API...');
            let response;
            
            try {
                response = await fetchWithTimeout(`${API_URL}/recordings`);
            } catch (error) {
                console.warn('Direct API call failed, trying with CORS proxy:', error);
                response = await fetchWithCorsProxy(`${API_URL}/recordings`);
            }
            
            if (!response.ok) {
                console.error('API response not OK:', response.status);
                throw new Error('API response: ' + response.status);
            }
            
            const responseData = await response.json();
            console.log('Loaded recordings:', responseData);
            
            if (!responseData.data || !Array.isArray(responseData.data)) {
                console.warn('API response missing data array:', responseData);
                return;
            }

            // Add markers for each recording
            responseData.data.forEach(recording => {
                if (!recording.location || !recording.location.coordinates) {
                    console.warn('Recording missing location data:', recording);
                    return;
                }
                
                // Create marker element
                const markerElement = document.createElement('div');
                markerElement.className = 'marker recording-marker';
                
                // Add marker to map
                const marker = new mapboxgl.Marker(markerElement)
                    .setLngLat(recording.location.coordinates)
                    .addTo(map);
                
                // Create safe HTML content
                const safeDescription = recording.description ? 
                    recording.description.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 
                    'No description';
                
                const audioPath = recording.audioPath || '';
                
                // Add popup with recording details
                const popup = new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`
                        <div class="recording-popup">
                            <h3>Sound Recording</h3>
                            <p>${safeDescription}</p>
                            <audio controls>
                                <source src="${audioPath}" type="audio/webm">
                                <source src="${audioPath}" type="audio/mp4">
                                <source src="${audioPath}" type="audio/ogg">
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    `);
                
                marker.setPopup(popup);
                
                // Store marker reference for later cleanup
                recordingMarkers.push(marker);
            });
            
            console.log(`Added ${recordingMarkers.length} markers to the map`);
        } catch (error) {
            console.error('Error loading recordings:', error);
        }
    }

    // Handle recording upload with enhanced error handling and CORS workarounds
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedLocation) {
            alert('Please select a location on the map');
            return;
        }
        
        if (!recordedBlob) {
            alert('Please record a sound or select an audio file');
            return;
        }

        // Validate the blob
        if (!isBlobValid(recordedBlob)) {
            alert('The audio recording appears to be invalid or empty. Please try recording again.');
            return;
        }

        const description = document.getElementById('recording-description').value;
        
        // Show uploading status
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Uploading...';
        submitBtn.disabled = true;

        try {
            // Check API health first
            await checkApiHealth();
            
            // Create form data
            const formData = new FormData();
            
            // Determine file extension based on mime type
            let filename = 'recording.webm';
            if (recordedBlob.type) {
                const ext = recordedBlob.type.split('/')[1];
                if (ext) {
                    filename = `recording.${ext}`;
                }
            }
            
            formData.append('audio', recordedBlob, filename);
            formData.append('description', description);
            formData.append('lat', selectedLocation.lat);
            formData.append('lng', selectedLocation.lng);
            
            console.log('Uploading recording as:', filename);
            console.log('Attempting to upload to:', `${API_URL}/recordings`);
            
            // Log blob information for debugging
            console.log('Blob details:', {
                size: recordedBlob.size,
                type: recordedBlob.type
            });
            
            // Log the request headers for debugging
            console.log('Request headers:', {
                'Accept': 'application/json',
                'Origin': window.location.origin
            });
            
            // Use fetch with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
            
            // Attempt upload with fallback to CORS proxy
            let response;
            try {
                response = await fetch(`${API_URL}/recordings`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    signal: controller.signal
                });
            } catch (fetchError) {
                console.warn('Direct upload failed, trying with CORS proxy:', fetchError);
                
                // If we're using a CORS proxy, we need new FormData (can't reuse)
                const proxyFormData = new FormData();
                proxyFormData.append('audio', recordedBlob, filename);
                proxyFormData.append('description', description);
                proxyFormData.append('lat', selectedLocation.lat);
                proxyFormData.append('lng', selectedLocation.lng);
                
                response = await fetchWithCorsProxy(`${API_URL}/recordings`, {
                    method: 'POST',
                    body: proxyFormData,
                    headers: {
                        'Accept': 'application/json'
                    },
                    // Can't use credentials with proxy
                    signal: controller.signal
                });
            }
            
            clearTimeout(timeoutId);
            console.log('Upload response status:', response.status);
            
            if (response.ok) {
                // Reload recordings to show the new marker
                loadRecordings();
                
                // Reset form and hide panel
                uploadForm.reset();
                recordingPanel.classList.add('hidden');
                audioPreview.src = '';
                audioPreview.style.display = 'none';
                recordedBlob = null;
                recordAudioBtn.disabled = false;
                
                alert('Recording uploaded successfully!');
            } else {
                let errorText = '';
                try {
                    const errorData = await response.json();
                    errorText = JSON.stringify(errorData);
                } catch (e) {
                    try {
                        errorText = await response.text();
                    } catch (e2) {
                        errorText = 'Could not get error details';
                    }
                }
                
                console.error('Server response:', errorText);
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Upload error details:', error);
            
            // Add more detailed error information
            let errorMessage = error.message;
            
            if (error.name === 'AbortError') {
                errorMessage = 'Upload timed out. Please check your internet connection and try again.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to the API server. This could be due to CORS settings, network issues, or the server being down.';
            }
            
            alert(`Failed to upload recording: ${errorMessage}`);
            
            // Log more debugging information
            console.log('Debug information:');
            console.log('- Browser:', navigator.userAgent);
            console.log('- Current URL:', window.location.href);
            console.log('- API URL:', API_URL);
        } finally {
            // Reset button state
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
    
    // Test API connection on load
    (async function testApiConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${API_URL}/recordings`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.warn(`API connection test failed with status: ${response.status}`);
            } else {
                console.log('API connection test successful');
            }
        } catch (error) {
            console.error('API connection test failed:', error);
        }
    })();
});
