import { loadFragment } from '../fragment/fragment.js';
import {
  buildBlock, decorateBlock, loadBlock, loadCSS,
} from '../../scripts/aem.js';

// Track keyboard navigation
let usingKeyboard = false;

// Event listeners to detect keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    usingKeyboard = true;
  }
});

document.addEventListener('mousedown', () => {
  usingKeyboard = false;
});

/*
  This is not a traditional block, so there is no decorate function.
  Instead, links to a /modals/ path are automatically transformed into a modal.
  Other blocks can also use the createModal() and openModal() functions.
*/

export async function createModal(contentNodes, modal = true, dialogId = 'dialog', dialogClasses = []) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);
  
  // Create the dialog container with common structure
  const dialogContainer = document.createElement('div');
  dialogContainer.classList.add('dialog-container');
  if (dialogClasses.length > 0) {
    dialogContainer.classList.add(...dialogClasses);
  }
  dialogContainer.setAttribute('data-a11y-dialog', dialogId);
  dialogContainer.setAttribute('id', dialogId);
  dialogContainer.setAttribute('aria-modal', 'true');
  dialogContainer.setAttribute('tabindex', '-1');
  dialogContainer.setAttribute('role', 'dialog');
  dialogContainer.setAttribute('aria-hidden', 'true');

  // Create the dialog content wrapper
  const dialogContent = document.createElement('div');
  dialogContent.classList.add('dialog-content');
  dialogContent.setAttribute('role', 'dialog');
  dialogContent.setAttribute('aria-modal', 'true');
  dialogContent.append(...contentNodes);

  dialogContainer.append(dialogContent);

  const block = buildBlock('modal', '');
  document.querySelector('body > main').append(block);
  decorateBlock(block);
  await loadBlock(block);

  // Handle close buttons from individual blocks
  dialogContainer.addEventListener('click', (e) => {
    // Check if clicked element is a close button
    const closeButton = e.target.closest(`[data-a11y-dialog-hide="${dialogId}"], .dialog-close, .close-icon`);
    if (closeButton) {
      e.preventDefault();
      closeDialog(dialogContainer);
      return;
    }

    // Close on click outside the dialog content
    if (e.target === dialogContainer) {
      const isVideoClass = e.target.closest('.video');
      if (!isVideoClass) {
        closeDialog(dialogContainer);
      }
    }
  });

  // Handle keyboard events
  dialogContainer.addEventListener('keydown', (e) => {
    // Close on Escape key
    if (e.key === 'Escape') {
      closeDialog(dialogContainer);
    }
    
    if (e.key === 'Enter') {
      const { target } = e;
      // Check if Enter is pressed within a form context
      const form = target.closest('form');
      if (form) {
        // If target is a form input or within a form, let the form handle submission
        const isFormElement = target.matches('input, textarea, select') || target.closest('button[type="submit"]');
        if (isFormElement) {
          // Prevent modal from handling this event and let form submission proceed
          e.preventDefault();
          e.stopPropagation();

          // Trigger form submission if Enter is pressed on input field
          if (target.matches('input, textarea, button')) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
        }
      }
    }
    // FIX: Stop OneTrust from intercepting Tab keys in modal
    if (e.key === 'Tab') {
      e.stopPropagation(); // Prevents OneTrust from seeing this event
      usingKeyboard = true;
    }
  });

  function closeDialog(container) {
    container.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    // Remove after animation completes
    setTimeout(() => {
      block.remove();
    }, 300);
  }

  block.innerHTML = '';
  block.append(dialogContainer);

  return {
    block,
    dialogContainer,
    dialogContent,
    showModal: () => {
      dialogContainer.setAttribute('aria-hidden', 'false');
      // reset scroll position
      setTimeout(() => { dialogContent.scrollTop = 0; }, 0);
      document.body.classList.add('modal-open');
    },
    closeModal: () => closeDialog(dialogContainer),
  };
}

/**
 * Open modal with the given content fragment URL.
 * @param {String} fragmentUrl content fragment URL
 * @param {Boolean} modal determines if it's a modal or regular dialog.
 * @param {String} dialogId unique identifier for the dialog.
 * @param {Array} dialogClasses additional classes for the dialog container.
 */
export async function openModal(fragmentUrl, modal = true, dialogId = 'dialog', dialogClasses = []) {
  // Load modal CSS first before loading fragment content
  await loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);
  
  const path = fragmentUrl.startsWith('http')
    ? new URL(fragmentUrl, window.location).pathname
    : fragmentUrl;

  const fragment = await loadFragment(path);
  const { showModal } = await createModal(fragment.childNodes, modal, dialogId, dialogClasses);
  showModal();
}
