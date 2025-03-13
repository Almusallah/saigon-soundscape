#!/bin/bash

# Create a backup before modifying
cp client/index.html client/index.html.bak$(date +%s)

# Extract map click handler patch
MAP_CLICK_PATCH=$(cat map-click-fix.js)

# Use sed to replace the map click handler section
# We search for the text between "Setup map click for coordinates" and the closing });
sed -i "" '/Setup map click for coordinates/,/})/{
    /Setup map click for coordinates/!{
        /});/!d
    }
}' client/index.html

# Now insert our new click handler
sed -i "" '/Setup map click for coordinates/a \
                map.on('\''click'\'', function(e) {\
                    console.log('\''Map clicked at:'\'', e.lngLat);\
                    \
                    // Set coordinates for the forms\
                    document.getElementById('\''latitude'\'').value = e.lngLat.lat.toFixed(6);\
                    document.getElementById('\''longitude'\'').value = e.lngLat.lng.toFixed(6);\
                    \
                    if (document.getElementById('\''record-latitude'\'')) {\
                        document.getElementById('\''record-latitude'\'').value = e.lngLat.lat.toFixed(6);\
                    }\
                    \
                    if (document.getElementById('\''record-longitude'\'')) {\
                        document.getElementById('\''record-longitude'\'').value = e.lngLat.lng.toFixed(6);\
                    }\
                    \
                    // Store the location\
                    selectedLocation = {\
                        lat: e.lngLat.lat,\
                        lng: e.lngLat.lng\
                    };\
                    \
                    // Open the form\
                    openUploadForm();\
                });' client/index.html

echo "Updated client/index.html with map click handler"
