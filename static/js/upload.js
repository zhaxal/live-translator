// static/js/upload.js
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const files = document.getElementById('files').files;
  const language = document.getElementById('language').value;
  
  if (files.length === 0) {
      alert('Please select at least one file');
      return;
  }

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
  }
  formData.append('language', language);

  try {
      const response = await fetch('/upload', {
          method: 'POST',
          body: formData
      });
      
      const data = await response.json();
      if (response.ok) {
          window.location.href = `/status/${data.job_id}`;
      } else {
          throw new Error(data.detail);
      }
  } catch (error) {
      alert('Upload failed: ' + error.message);
  }
});