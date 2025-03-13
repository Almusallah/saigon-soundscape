// Helper function to capture map clicks and set coordinates
function setupMapClickHandler(map) {
    map.on('click', function(e) {
        if (document.getElementById('form-overlay').style.display === 'flex') {
            document.getElementById('latitude').value = e.lngLat.lat.toFixed(6);
            document.getElementById('longitude').value = e.lngLat.lng.toFixed(6);
        }
    });
}

// Function to add markers for existing recordings
function addRecordingMarkers(map, recordings) {
    if (!recordings || !recordings.length) return;
    
    recordings.forEach(recording => {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'recording-marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#3887be';
        el.style.border = '2px solid #ffffff';
        el.style.cursor = 'pointer';
        
        // Create popup with recording info
        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
                <h3>${recording.title}</h3>
                <p>${recording.description}</p>
                <audio controls>
                    <source src="${recording.audioUrl}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
            `);
        
        // Add marker to map
        const marker = new mapboxgl.Marker(el)
            .setLngLat([recording.longitude, recording.latitude])
            .setPopup(popup)
            .addTo(map);
    });
}
