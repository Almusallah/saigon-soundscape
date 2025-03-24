// Function to upload audio to server
function uploadAudio(formData) {
  console.log('Attempting to upload audio to:', `${API_URL}/recordings`);
  
  // Check what's in the formData
  for (let [key, value] of formData.entries()) {
    console.log(`FormData contains: ${key} = ${value instanceof File ? value.name : value}`);
  }
  
  fetch(`${API_URL}/recordings`, {
    method: 'POST',
    body: formData,
    credentials: 'include'  // Include this to allow CORS with credentials
  })
    .then(response => {
      console.log('Server response status:', response.status);
      if (!response.ok) {
        return response.text().then(text => {
          console.log('Error response text:', text);
          throw new Error(`Upload failed with status: ${response.status}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Upload success response:', data);
      alert('Audio uploaded successfully!');
      
      // Reset UI
      document.getElementById('upload-form').reset();
      document.getElementById('recording-description-mic').value = '';
      document.getElementById('recording-panel').classList.add('hidden');
      document.getElementById('audio-preview').style.display = 'none';
      document.getElementById('recording-preview').style.display = 'none';
      document.getElementById('upload-recording-button').disabled = true;
      recordedBlob = null;
      
      // Add the new recording to the map
      addRecordingMarker(data.data);
    })
    .catch(error => {
      console.error('Upload error:', error);
      alert('Failed to upload audio. Please try again.');
    });
}
