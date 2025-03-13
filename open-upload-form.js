// Function to open upload form
function openUploadForm() {
    const formOverlay = document.getElementById('form-overlay');
    if (formOverlay) {
        formOverlay.style.display = 'flex';
    } else {
        console.error('Form overlay element not found!');
    }
}

// Function to close upload form
function closeUploadForm() {
    const formOverlay = document.getElementById('form-overlay');
    if (formOverlay) {
        formOverlay.style.display = 'none';
    }
    
    // Remove temporary marker if it exists
    if (typeof tempMarker !== 'undefined' && tempMarker) {
        tempMarker.remove();
        tempMarker = null;
    }
    
    // Reset any form data
    const audioForm = document.getElementById('audio-form');
    if (audioForm) {
        audioForm.reset();
    }
}
