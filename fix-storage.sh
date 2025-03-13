#!/bin/bash

# Create a simplified updateStorageInfo function that always shows "Active"
cat > storage-function.js << 'STORAGE_FUNC'
// Function to update storage info in the footer
function updateStorageInfo() {
    const footer = document.querySelector('footer p');
    if (footer) {
        footer.innerHTML = `&copy; 2025 Saigon Sound Archive | Created by <a href="https://officinegap.com/" target="_blank">Officine Gặp</a> | 
                           Storage: <span class="storage-indicator active">Local Storage (Active)</span>`;
    }
}
STORAGE_FUNC

# Find the updateStorageInfo function
UPDATE_STORAGE_LINE=$(grep -n "function updateStorageInfo" client/index.html | cut -d':' -f1)

if [ -n "$UPDATE_STORAGE_LINE" ]; then
    echo "Found updateStorageInfo function at line $UPDATE_STORAGE_LINE"
    
    # Find where the function ends
    UPDATE_STORAGE_END=$(tail -n +$UPDATE_STORAGE_LINE client/index.html | grep -n "^[[:space:]]*}" | head -1 | cut -d':' -f1)
    UPDATE_STORAGE_END=$((UPDATE_STORAGE_LINE + UPDATE_STORAGE_END))
    
    # Create a temporary file with content before updateStorageInfo
    head -n $((UPDATE_STORAGE_LINE - 1)) client/index.html > client/index.html.tmp
    
    # Append our new function
    cat storage-function.js >> client/index.html.tmp
    
    # Append the rest of the file
    tail -n +$((UPDATE_STORAGE_END + 1)) client/index.html >> client/index.html.tmp
    
    # Replace the original file
    mv client/index.html.tmp client/index.html
    
    echo "Updated storage function successfully!"
else
    echo "Could not find updateStorageInfo function. Please add it manually."
fi
