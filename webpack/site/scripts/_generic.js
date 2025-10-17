/*
  Make checkbox functional with enter key along with the spacebar.
*/
document.addEventListener('keydown', (event) => {
  const elem = document.activeElement;
  // Check if the focused element is the checkbox and the key pressed is Enter
  if (event.key === 'Enter' && elem.type === 'checkbox') {
    // Prevent default behavior (e.g., submitting a form if the checkbox is inside one)
    event.preventDefault();
    // Programmatically click the checkbox to toggle its state
    elem.click();
  }
});

document.addEventListener('change', (e) => {
  const elem = document.activeElement;
  if (elem.checked) {
    elem.setAttribute('aria-checked', true);
  } else {
    elem.setAttribute('aria-checked', false);
  }
});
