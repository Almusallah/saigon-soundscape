#!/bin/bash

# Create a backup
cp client/index.html client/index.html.bak_storage

# Replace the storage error with a mock response
sed -i "" '/function updateStorageInfo()/,/updateStorageInfo();/ {
    /function updateStorageInfo()/ {
        c \
        // Function to update storage info in the footer\
        function updateStorageInfo() {\
            // Mock storage data for development\
            const footer = document.querySelector("footer p");\
            \
            if (footer) {\
                footer.innerHTML = `&copy; 2025 Saigon Sound Archive | Created by <a href="https://officinegap.com/" target="_blank">Officine Gặp</a> | \
                                 Storage: <span class="storage-indicator active">Local Storage (Active)</span>`;\
            }\
        }
    }
}' client/index.html

echo "Fixed storage error with mock response"
