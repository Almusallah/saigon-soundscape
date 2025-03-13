#!/bin/bash

echo "Creating backup of index.html..."
cp client/index.html client/index.html.js-fix-backup

echo "Looking for map click handler code..."
MAP_CLICK_LINE_START=$(grep -n "map.on('click'" client/index.html | cut -d':' -f1)
if [ -z "$MAP_CLICK_LINE_START" ]; then
    MAP_CLICK_LINE_START=$(grep -n "Setup map click for coordinates" client/index.html | cut -d':' -f1)
fi

if [ -z "$MAP_CLICK_LINE_START" ]; then
    echo "Could not find map click handler code. Aborting."
    exit 1
fi

echo "Map click handler found at line $MAP_CLICK_LINE_START"

# Find the end of the map click handler (next instance of '});')
MAP_CLICK_LINE_END=$(tail -n +$MAP_CLICK_LINE_START client/index.html | grep -n "});" | head -1 | cut -d':' -f1)
MAP_CLICK_LINE_END=$((MAP_CLICK_LINE_START + MAP_CLICK_LINE_END))

echo "Map click handler ends at line $MAP_CLICK_LINE_END"

# Create a temporary file with content before the map click handler
head -n $((MAP_CLICK_LINE_START - 1)) client/index.html > client/index.html.tmp

# Append our new map click handler
cat map-click-handler.js >> client/index.html.tmp

# Append the rest of the file after the map click handler
tail -n +$((MAP_CLICK_LINE_END + 1)) client/index.html >> client/index.html.tmp

# Replace the original file
mv client/index.html.tmp client/index.html

echo "Updated map click handler successfully!"

# Now find and replace the openUploadForm function
OPEN_FORM_LINE=$(grep -n "function openUploadForm" client/index.html | cut -d':' -f1)

if [ -n "$OPEN_FORM_LINE" ]; then
    echo "Found openUploadForm function at line $OPEN_FORM_LINE"
    
    # Find where the function ends (next curly brace in a line by itself)
    OPEN_FORM_END=$(tail -n +$OPEN_FORM_LINE client/index.html | grep -n "^[[:space:]]*}$" | head -1 | cut -d':' -f1)
    OPEN_FORM_END=$((OPEN_FORM_LINE + OPEN_FORM_END))
    
    # Create a temporary file with content before openUploadForm
    head -n $((OPEN_FORM_LINE - 1)) client/index.html > client/index.html.tmp
    
    # Append our new functions
    cat open-upload-form.js >> client/index.html.tmp
    
    # Append the rest of the file
    tail -n +$((OPEN_FORM_END + 1)) client/index.html >> client/index.html.tmp
    
    # Replace the original file
    mv client/index.html.tmp client/index.html
    
    echo "Updated form functions successfully!"
else
    # If we can't find the function, add it right before the initialization code
    INIT_LINE=$(grep -n "document.addEventListener('DOMContentLoaded'" client/index.html | cut -d':' -f1)
    
    if [ -n "$INIT_LINE" ]; then
        echo "Adding form functions before DOM initialization..."
        
        # Create a temporary file with content before init
        head -n $((INIT_LINE - 1)) client/index.html > client/index.html.tmp
        
        # Append our new functions
        cat open-upload-form.js >> client/index.html.tmp
        echo "" >> client/index.html.tmp
        
        # Append the rest of the file
        tail -n +$INIT_LINE client/index.html >> client/index.html.tmp
        
        # Replace the original file
        mv client/index.html.tmp client/index.html
        
        echo "Added form functions successfully!"
    else
        echo "Could not find a suitable place to add form functions. Please add them manually."
    fi
fi

# Add the marker-pin style if it doesn't exist
if ! grep -q "marker-pin" client/index.html; then
    echo "Adding marker-pin style..."
    
    # Find the end of the style block
    STYLE_END=$(grep -n "</style>" client/index.html | head -1 | cut -d':' -f1)
    
    if [ -n "$STYLE_END" ]; then
        # Create a temporary file with content before style end
        head -n $((STYLE_END - 1)) client/index.html > client/index.html.tmp
        
        # Add marker-pin style
        cat >> client/index.html.tmp << 'END_STYLE'

        .marker-pin {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: #FF5722;
            border: 2px solid white;
            cursor: pointer;
            position: relative;
            z-index: 1;
        }
END_STYLE
        
        # Append the rest of the file
        tail -n +$((STYLE_END)) client/index.html >> client/index.html.tmp
        
        # Replace the original file
        mv client/index.html.tmp client/index.html
        
        echo "Added marker-pin style successfully!"
    else
        echo "Could not find style block end. Please add marker-pin style manually."
    fi
fi

# Add tempMarker variable declaration if not present
if ! grep -q "let tempMarker" client/index.html; then
    echo "Adding tempMarker variable declaration..."
    
    # Find the variable declarations
    VAR_LINE=$(grep -n "let map;" client/index.html | head -1 | cut -d':' -f1)
    
    if [ -n "$VAR_LINE" ]; then
        # Create a temporary file with content before var line
        head -n $VAR_LINE client/index.html > client/index.html.tmp
        
        # Add tempMarker declaration
        echo "        let tempMarker;" >> client/index.html.tmp
        
        # Append the rest of the file
        tail -n +$((VAR_LINE + 1)) client/index.html >> client/index.html.tmp
        
        # Replace the original file
        mv client/index.html.tmp client/index.html
        
        echo "Added tempMarker variable declaration successfully!"
    else
        echo "Could not find variable declarations. Please add tempMarker variable manually."
    fi
fi

echo "JavaScript fixes completed!"
