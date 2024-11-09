// static/js/upload.js
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const files = document.getElementById('files').files;
    const language = document.getElementById('language').value;
    
    if (files.length === 0) {
        alert('Please select at least one file');
        return;
    }

    Array.from(files).forEach(file => {
        formData.append('files', file);
    });
    formData.append('language', language);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }
        
        const data = await response.json();
        window.location.href = `/status/${data.job_id}`;
    } catch (error) {
        alert(error.message);
    }
});