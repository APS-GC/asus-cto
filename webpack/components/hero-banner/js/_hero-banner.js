document.addEventListener('DOMContentLoaded', function () {
  const heroBanners = document.querySelectorAll('.hero-banner');
  heroBanners.forEach((heroBanner) => {
    // When CTA is present and banner is clicked, navigate to CTA URL
    const ctaButton = heroBanner.querySelector('.cta-button');
    if (ctaButton) {
      heroBanner.addEventListener('click', function () {
        ctaButton.click();
      });
    }
  });
});
