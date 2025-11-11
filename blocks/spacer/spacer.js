export default function decorate(block) {
  // Initialize configuration object with defaults
  const config = {
    desktop: '28px', // default desktop spacing
    tablet: '50%',   // default tablet spacing
    mobile: '50%'    // default mobile spacing
  };
  
  // Read values from data attributes (Universal Editor)
  if (block.dataset.desktop) {
    config.desktop = block.dataset.desktop;
  }
  if (block.dataset.tablet) {
    config.tablet = block.dataset.tablet;
  }
  if (block.dataset.mobile) {
    config.mobile = block.dataset.mobile;
  }
  
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
  
  // Debug logging to help troubleshoot
  console.log('Spacer config:', config);
}
