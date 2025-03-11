// (Previous code remains the same)

// Modify the upload form submission handler
const uploadForm = document.getElementById('upload-form');
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const audioFile = document.getElementById('audio').files[0];
    
    // Check file size before upload
    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
    if (audioFile.size > MAX_FILE_SIZE) {
        alert('File is too large. Maximum file size is 30MB.');
        return;
    }
    
    // Rest of the existing upload logic remains the same
});

// (Rest of the previous code)
