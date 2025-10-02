document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const imageUrl = urlParams.get('url');

    if (imageUrl) {
        document.getElementById('fullImage').src = decodeURIComponent(imageUrl);
    } else {
        // Handle cases where the URL is not provided
        const container = document.querySelector('.image-container');
        container.innerHTML = '<p>No image URL provided.</p>';
    }
});