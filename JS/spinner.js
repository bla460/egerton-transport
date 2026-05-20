window.addEventListener('load', function() {
    const loader = document.getElementById('loader-wrapper');
    // Smooth fade out
    loader.style.transition = "opacity 0.5s ease";
    loader.style.opacity = "0";
    
    setTimeout(() => {
        loader.style.display = "none";
    }, 500);
});