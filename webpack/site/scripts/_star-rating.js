function initializeStarRating(ratingElement) {
  const rating = parseFloat(ratingElement.dataset.rating) || 0;
  const percent = Math.max(0, Math.min(rating / 5, 1)) * 100;
  ratingElement.style.setProperty('--percent', percent + '%');
}

function initializeAllRatings(container) {
  const ratingElements = container.querySelectorAll('[data-rating]');
  ratingElements.forEach(initializeStarRating);
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize for elements present on initial load
  initializeAllRatings(document.body);

  // Use MutationObserver to initialize ratings loaded dynamically
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // If the added node has the data-rating attribute
            if (node.matches('[data-rating]')) {
              initializeStarRating(node);
            }
            // Or if it contains elements with the data-rating attribute
            node.querySelectorAll('[data-rating]').forEach(initializeStarRating);
          }
        });
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
