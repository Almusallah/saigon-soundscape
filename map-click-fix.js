// This is a patch to add to client/index.html
// Find the map.on('click', function(e) { ... }) section and replace it with this

map.on('click', function(e) {
    console.log('Map clicked at:', e.lngLat);
    
    // Set coordinates for the forms
    document.getElementById('latitude').value = e.lngLat.lat.toFixed(6);
    document.getElementById('longitude').value = e.lngLat.lng.toFixed(6);
    
    if (document.getElementById('record-latitude')) {
        document.getElementById('record-latitude').value = e.lngLat.lat.toFixed(6);
    }
    
    if (document.getElementById('record-longitude')) {
        document.getElementById('record-longitude').value = e.lngLat.lng.toFixed(6);
    }
    
    // Store the location
    selectedLocation = {
        lat: e.lngLat.lat,
        lng: e.lngLat.lng
    };
    
    // Add marker at clicked position
    if (tempMarker) {
        tempMarker.remove();
    }
    
    const el = document.createElement('div');
    el.className = 'marker-pin';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#FF5722';
    el.style.border = '2px solid white';
    
    tempMarker = new mapboxgl.Marker(el)
        .setLngLat(e.lngLat)
        .addTo(map);
    
    // Open the form
    openUploadForm();
});
