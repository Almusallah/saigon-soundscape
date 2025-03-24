// Function to update storage info in the footer
function updateStorageInfo() {
    const footer = document.querySelector('footer p');
    if (footer) {
        footer.innerHTML = `&copy; 2025 Saigon Sound Archive | Created by <a href="https://officinegap.com/" target="_blank">Officine Gặp</a> | 
                           Storage: <span class="storage-indicator active">Local Storage (Active)</span>`;
    }
}
