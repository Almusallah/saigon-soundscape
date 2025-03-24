// Map click handling
map.on('click', function(e) {
    console.log('Map clicked at:', e.lngLat);
    
    // Set coordinates for both forms
    document.getElementById('latitude').value = e.lngLat.lat.toFixed(6);
    document.getElementById('longitude').value = e.lngLat.lng.toFixed(6);
    
    if (document.getElementById('record-latitude')) {
        document.getElementById('record-latitude').value = e.lngLat.lat.toFixed(6);
    }
    
    if (document.getElementById('record-longitude')) {
        document.getElementById('record-longitude').value = e.lngLat.lng.toFixed(6);
    }
    
    // Store selected location
    selectedLocation = {
        lat: e.lngLat.lat,
        lng: e.lngLat.lng
    };
    
    // Open the upload form automatically
    openUploadForm();
});
