import Choices from 'choices.js';

document.addEventListener('DOMContentLoaded', () => {
  const choicesConfig = {
    searchEnabled: false,
    removeItemButton: false,
    shouldSort: false,
    itemSelectText: '',
  };

  const initChoices = (selector) => {
    const el = document.getElementById(selector);
    if (el) {
      return new Choices(el, choicesConfig);
    }
    return false;
  };

  // Initialize Choices.js
  initChoices('select-resolution');
  initChoices('select-resolution-mobile');

  // Initialize accordion
  document.querySelectorAll('.game-fps-accordion-item').forEach((item) => {
    const header = item.querySelector('.game-fps-accordion-item-header');
    if (!header) return; // skip items without headers

    header.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      item.classList.toggle('open');

      document.dispatchEvent(
        new CustomEvent('floatingNavAccordionToggle', {
          detail: {
            isOpen: !wasOpen,
            element: item,
            type: 'game-fps-accordion-item',
          },
        }),
      );
    });
  });
});
