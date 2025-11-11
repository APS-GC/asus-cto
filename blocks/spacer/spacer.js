export default function decorate(block) {
  // Check if we're in Universal Editor (UE) mode
  const isUE = document.querySelector('meta[name="urn:adobe:aue:system:aemconnection"]') || 
               window.location.search.includes('aue=') ||
               document.body.classList.contains('aue-edit-mode');
  
  // Get the configuration from the block content or data attributes
  const rows = [...block.children];
  
  // Initialize configuration object with defaults
  const config = {
    desktop: '28px', // default desktop spacing
    tablet: '50%',   // default tablet spacing
    mobile: '50%'    // default mobile spacing
  };
  
  // For Universal Editor, check data attributes first
  if (isUE) {
    config.desktop = block.dataset.desktop || config.desktop;
    config.tablet = block.dataset.tablet || config.tablet;
    config.mobile = block.dataset.mobile || config.mobile;
  }
  
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
  
  // For Universal Editor, add data attributes for editing
  if (isUE) {
    spacerElement.setAttribute('data-aue-prop', 'desktop');
    spacerElement.setAttribute('data-aue-type', 'text');
    spacerElement.setAttribute('data-aue-label', 'Desktop Spacing');
    
    // Add visual indicator for UE editing
    const ueIndicator = document.createElement('div');
    ueIndicator.className = 'spacer-ue-indicator';
    ueIndicator.textContent = `Spacer: Desktop ${config.desktop} | Tablet ${config.tablet} | Mobile ${config.mobile}`;
    spacerElement.appendChild(ueIndicator);
  }
  
  // Add the spacer element to the block
  block.appendChild(spacerElement);
  
  // Add a class to the block for styling
  block.classList.add('spacer-configured');
  
  // Add UE-specific class if in Universal Editor
  if (isUE) {
    block.classList.add('spacer-ue-mode');
  }
}
