document.addEventListener("DOMContentLoaded", () => {
    const images = document.querySelectorAll("img");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    const loaderWrapper = document.getElementById("loader-wrapper");
    
    let loadedCount = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
        
        hideLoader();
    } else {
        images.forEach((img) => {
            
            if (img.complete) {
                updateProgress();
            } else {
                img.addEventListener("load", updateProgress);
                img.addEventListener("error", updateProgress); 
            }
        });
    }

    function updateProgress() {
        loadedCount++;
        const percentage = Math.round((loadedCount / totalImages) * 100);
        
        progressBar.style.width = percentage + "%";
        progressText.innerText = percentage + "% Loaded";

        if (loadedCount >= totalImages) {
            setTimeout(hideLoader, 500); 
        }
    }

    function hideLoader() {
        loaderWrapper.style.opacity = "0";
        setTimeout(() => {
            loaderWrapper.style.display = "none";
        }, 500);
    }
});