export default function decorate(block) {
  // Get the configuration from the block content
  const rows = [...block.children];
  
  // Initialize configuration object with defaults
  const config = {
    desktop: '28px', // default desktop spacing
    tablet: '50%',   // default tablet spacing
    mobile: '50%'    // default mobile spacing
  };
  
  // Parse configuration from block content (document-based authoring)
  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      
      if (key === 'desktop' || key === 'desktop-space') {
        config.desktop = value;
      } else if (key === 'tablet' || key === 'tablet-space') {
        config.tablet = value;
      } else if (key === 'mobile' || key === 'mobile-space') {
        config.mobile = value;
      }
    }
  });
  
  // Clear the block content
  block.innerHTML = '';
  
  // Create the spacer element
  const spacerElement = document.createElement('div');
  spacerElement.className = 'spacer-element';
  
  // Set CSS custom properties for responsive spacing
  spacerElement.style.setProperty('--spacer-desktop', config.desktop);
  spacerElement.style.setProperty('--spacer-tablet', config.tablet);
  spacerElement.style.setProperty('--spacer-mobile', config.mobile);
  
  // Add the spacer element to the block
  block.appendChild(spacerElement);
  
  // Add a class to the block for styling
  block.classList.add('spacer-configured');
}
