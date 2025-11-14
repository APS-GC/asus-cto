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

export async function createModal(contentNodes, persistent = false, modal = true) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);
  const dialog = document.createElement('dialog');
  const dialogContent = document.createElement('div');
  dialogContent.classList.add('modal-content');
  dialogContent.append(...contentNodes);
  dialog.append(dialogContent);
  if (!persistent) {
    const closeButton = document.createElement('button');
    closeButton.classList.add('close-button');
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.type = 'button';
    closeButton.innerHTML = '<span class="icon icon-close"></span>';
    closeButton.addEventListener('click', () => dialog.close());
    // Add class to hide focus outline by default
    closeButton.classList.add('no-focus-visible');
    // Add focus event to check if keyboard navigation is being used
    closeButton.addEventListener('focus', () => {
      if (usingKeyboard) {
        closeButton.classList.remove('no-focus-visible');
      } else {
        closeButton.classList.add('no-focus-visible');
      }
    });
    // Add blur event to reset
    closeButton.addEventListener('blur', () => {
      closeButton.classList.add('no-focus-visible');
    });
    dialog.prepend(closeButton);
  }

  const block = buildBlock('modal', '');
  document.querySelector('body > main').append(block);
  decorateBlock(block);
  await loadBlock(block);

  // close on click outside the dialog
  dialog.addEventListener('click', (e) => {
    const isVideoClass = e.target.closest('.video');
    if (!isVideoClass) {
      const {
        left, right, top, bottom,
      } = dialog.getBoundingClientRect();
      const { clientX, clientY } = e;
      if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
        dialog.close();
      }
    }
  });

  // Handle keyboard events for form submission
  dialog.addEventListener('keydown', (e) => {
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

  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    block.remove();
  });

  block.innerHTML = '';
  block.append(dialog);

  return {
    block,
    showModal: () => {
      if (modal) {
        dialog.showModal();
      } else {
        dialog.show();
        const custombackdrop = document.createElement('div');
        custombackdrop.className = 'custom-dialog-backdrop';
        dialog.parentNode.insertBefore(custombackdrop, dialog);
        custombackdrop.addEventListener('click', () => {
          dialog.close();
        });
      }
      // reset scroll position
      setTimeout(() => { dialogContent.scrollTop = 0; }, 0);
      document.body.classList.add('modal-open');
    },
  };
}

/**
 * Open modal with the given content fragment URL.
 * @param {String} fragmentUrl content fragment URL
 * @param {Boolean} persistent hides close button if true.
 */
export async function openModal(fragmentUrl, persistent = false, modal = true) {
  const path = fragmentUrl.startsWith('http')
    ? new URL(fragmentUrl, window.location).pathname
    : fragmentUrl;

  const fragment = await loadFragment(path);
  const { showModal } = await createModal(fragment.childNodes, persistent, modal);
  showModal();
}
