// (Previous code remains the same, only modifying the upload form submission)

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedLocation) {
        alert('Please select a location on the map');
        return;
    }

    const audioFile = fileInput.files[0];
    if (!audioFile) {
        alert('Please select an audio file');
        return;
    }

    const formData = new FormData();
    formData.append('audio', audioFile);
    
    // Add current date to the description
    const description = `${document.getElementById('recording-description').value} | Recorded on ${new Date().toLocaleDateString()}`;
    formData.append('description', description);
    
    formData.append('lat', selectedLocation.lat);
    formData.append('lng', selectedLocation.lng);

    try {
        const response = await fetch(`${API_URL}/recordings`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert('Audio uploaded successfully!');
            uploadForm.reset();
            uploadPanel.classList.add('hidden');
            document.getElementById('audio-preview').style.display = 'none';
        } else {
            const errorData = await response.json();
            alert(`Upload failed: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload audio. Please try again.');
    }
});
