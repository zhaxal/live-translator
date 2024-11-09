// static/js/status.js
const jobId = window.location.pathname.split('/').pop();
const statusIndicator = document.querySelector('.status-indicator');
const statusText = document.querySelector('.status-text');
const downloadSection = document.getElementById('downloadSection');
const downloadLinks = document.getElementById('downloadLinks');

async function checkStatus() {
    try {
        const response = await fetch(`/status/${jobId}/check`);
        const data = await response.json();
        
        statusText.textContent = data.status;
        statusIndicator.className = `status-indicator ${data.status}`;

        if (data.status === 'completed') {
            downloadSection.style.display = 'block';
            downloadLinks.innerHTML = data.files.map(file => `
                <a href="/download/${file.id}" class="download-link">
                    Download ${file.original_filename}
                </a>
            `).join('');
            return true;
        } else if (data.status === 'failed') {
            return true;
        }
        return false;
    } catch (error) {
        console.error('Status check failed:', error);
        return false;
    }
}

(async function pollStatus() {
    const done = await checkStatus();
    if (!done) {
        setTimeout(pollStatus, 5000);
    }
})();