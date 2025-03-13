#!/bin/bash

# Create a backup
cp client/index.html client/index.html.bak_marker

# Add marker style to the CSS section
sed -i "" '/recording-marker {/a \
        .marker-pin {\
            width: 20px;\
            height: 20px;\
            border-radius: 50%;\
            background-color: #FF5722;\
            border: 2px solid white;\
            cursor: pointer;\
        }' client/index.html

echo "Added marker style to client/index.html"
