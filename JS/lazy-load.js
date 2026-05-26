/**
 * Lazy Load Images Module
 * Provides intersection-based lazy loading for images to improve page performance.
 * Usage: Add data-src attribute instead of src, and add class="lazy-img" to img tags.
 * Alternative: Automatically applies to all img tags with data-src attribute.
 */

(function initLazyLoad() {
  if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver not supported. Falling back to immediate load.');
    document.querySelectorAll('img[data-src]').forEach(img => {
      if (!img.src) img.src = img.dataset.src;
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;

        // Load image
        if (src) {
          img.src = src;
          // Remove spinner or loading class if present
          img.classList.remove('loading');
          img.classList.add('loaded');
        }

        // Load responsive srcset if available
        if (srcset) {
          img.srcset = srcset;
        }

        // Stop observing this image
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px' // Start loading 50px before image enters viewport
  });

  // Observe all images with data-src
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });

  // Handle dynamically added images
  const mutationObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.tagName === 'IMG' && node.dataset.src) {
          imageObserver.observe(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
          });
        }
      });
    });
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('✓ LazyLoad initialized for images');
})();
