#!/bin/bash

# Create a backup of current index.html
cp client/index.html client/index.html.backup-complete

# Find the opening and closing script tags of the main script
SCRIPT_START=$(grep -n "<script>" client/index.html | tail -1 | cut -d':' -f1)
SCRIPT_END=$(grep -n "</script>" client/index.html | tail -1 | cut -d':' -f1)

if [ -z "$SCRIPT_START" ] || [ -z "$SCRIPT_END" ]; then
    echo "Could not find script tags. Aborting."
    exit 1
fi

echo "Found script section from line $SCRIPT_START to $SCRIPT_END"

# Create a temporary file with content before the script
head -n $SCRIPT_START client/index.html > client/index.html.tmp

# Add opening script tag and our complete fixed script
echo "<script>" >> client/index.html.tmp
cat complete-fix.js >> client/index.html.tmp

# Add the rest of the file after the closing script tag
tail -n +$SCRIPT_END client/index.html >> client/index.html.tmp

# Replace the original file
mv client/index.html.tmp client/index.html

# Add the marker-pin class to the style section if it doesn't exist
STYLE_END=$(grep -n "</style>" client/index.html | head -1 | cut -d':' -f1)

if [ -n "$STYLE_END" ]; then
    # Create a temporary file with content before style end
    head -n $((STYLE_END - 1)) client/index.html > client/index.html.tmp
    
    # Add marker-pin style
    cat marker-style.css >> client/index.html.tmp
    
    # Append the rest of the file
    tail -n +$((STYLE_END)) client/index.html >> client/index.html.tmp
    
    # Replace the original file
    mv client/index.html.tmp client/index.html
    
    echo "Added marker-pin style successfully!"
else
    echo "Could not find style block end. Continuing without adding marker style."
fi

echo "JavaScript completely replaced with fixed version!"
