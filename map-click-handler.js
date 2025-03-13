// Map click event handler
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
