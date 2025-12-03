document.addEventListener('DOMContentLoaded', () => {
  // Store reference to the currently active bundle card
  let currentActiveBundleCard = null;

  // Handle existing actions button clicks
  const actionsButtons = document.querySelectorAll('.actions');
  actionsButtons.forEach((button) => {
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      // Store reference to the bundle card that triggered this popup
      currentActiveBundleCard = this.closest('.cmp-bundles-card');

      // Preselect values if this is an edit action (button text is "Edit")
      if (this.textContent.trim().toLowerCase() === 'edit') {
        preselectValuesInPopup(currentActiveBundleCard);
      }
    });
  });

  // Handle confirm CTA button clicks
  const confirmButtons = document.querySelectorAll('.confirm-cta button');
  confirmButtons.forEach((button) => {
    button.addEventListener('click', function (e) {
      // Get selected radio button values
      const selectedValues = getSelectedRadioValues();
      // Process the selections before the dialog closes
      const isValid = handleConfirmAction(selectedValues);

      // If validation fails, prevent the dialog from closing
      if (!isValid) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // If validation passes, update the features and let the dialog close
      updateProductFeatures(selectedValues, currentActiveBundleCard);

      // Clear the reference after processing
      setTimeout(() => {
        currentActiveBundleCard = null;
      }, 100);
    });
  });

  // Also listen for dialog close events to clear the reference
  document.addEventListener('click', (e) => {
    if (
      e.target.matches('[data-a11y-dialog-hide]') ||
      e.target.closest('[data-a11y-dialog-hide]')
    ) {
      setTimeout(() => {
        currentActiveBundleCard = null;
      }, 100);
    }
  });

  /**
   * Get all selected radio button values from the popup
   * @returns {Object} Object containing selected values grouped by radio button name
   */
  function getSelectedRadioValues() {
    const selectedValues = {};

    // Get all radio buttons in the popup
    const radioButtons = document.querySelectorAll('.cmp-bundles-dialog .bundles-radio:checked');

    radioButtons.forEach((radio) => {
      const name = radio.name;
      const value = radio.id; // Using ID as value, you can also use radio.value if set
      const label = getRadioLabel(radio);
      selectedValues[name] = {
        id: value,
        label: label,
        element: radio,
      };
    });

    return selectedValues;
  }

  /**
   * Get the label text for a radio button
   * @param {HTMLInputElement} radioElement - The radio button element
   * @returns {string} The label text
   */
  function getRadioLabel(radioElement) {
    // Find the associated label text
    const parentContainer = radioElement.closest('.cmp-bundles-options-radio');
    if (parentContainer) {
      // Get all span elements and find the one with text (not the image span)
      const spanElements = parentContainer.querySelectorAll('.cmp-product-name span');
      for (let span of spanElements) {
        const text = span.textContent.trim();
        // Skip spans that are empty or contain only whitespace, and skip the image span
        if (text && !span.classList.contains('cmp-product-colour')) {
          return text;
        }
      }
    }
    return '';
  }

  /**
   * Handle the confirm action with selected values
   * @param {Object} selectedValues - The selected radio button values
   * @returns {boolean} True if validation passes, false otherwise
   */
  function handleConfirmAction(selectedValues) {
    // No validation required - allow any combination of selections

    return true;
  }

  /**
   * Update the product features list in the bundle card
   * @param {Object} selectedValues - The selected radio button values
   * @param {HTMLElement} bundleCard - The bundle card element that triggered the popup
   */
  function updateProductFeatures(selectedValues, bundleCard) {
    if (!bundleCard) {
      return;
    }

    // Find the product features container in the specific bundle card
    const featuresContainer = bundleCard.querySelector('.cmp-product-features');
    if (!featuresContainer) {
      return;
    }

    // Generate the features list HTML
    const featuresHTML = generateFeaturesHTML(selectedValues);

    // Update the features container immediately
    featuresContainer.innerHTML = featuresHTML;

    // Store selected values in bundle card for future editing
    storeSelectedValuesInBundleCard(selectedValues, bundleCard);

    // Update the CTA button text to "Edit"
    updateCTAButtonText(bundleCard, 'Edit');
    // Add a subtle animation to indicate the update
    featuresContainer.classList.add('opacity-transition');
    featuresContainer.classList.add('opacity-7');
    setTimeout(() => {
      featuresContainer.classList.remove('opacity-7');
      featuresContainer.classList.add('opacity-1');
    }, 100);
  }

  /**
   * Update the CTA button text in the bundle card
   * @param {HTMLElement} bundleCard - The bundle card element
   * @param {string} newText - The new text for the button
   */
  function updateCTAButtonText(bundleCard, newText) {
    if (!bundleCard) {
      return;
    }

    // Find the CTA button in the bundle card
    const ctaButton = bundleCard.querySelector('.select-cta button.actions');
    if (!ctaButton) {
      return;
    }

    // Update the button text
    ctaButton.textContent = newText;

    // Add a visual indicator that the button has changed
    ctaButton.classList.add('container-bg-transition');
    ctaButton.classList.add('bg-transparent'); // Green color to indicate "configured"
  }

  /**
   * Generate HTML for the features list based on selected values
   * @param {Object} selectedValues - The selected radio button values
   * @returns {string} HTML string for the features list
   */
  function generateFeaturesHTML(selectedValues) {
    const features = [];

    // Add base bundle items (you can customize these based on your data)
    features.push(
      'Desktop ASUS ROYAL CLUB Memory & Hard Drive Installation Service/Including System Installation (Physical Card Kit)',
    );
    features.push('JOGEEK P4X4 1TB M2 2280');

    // Add selected options as features
    if (selectedValues.colour) {
      features.push(
        `ASUS SmartO Mouse MD200 Silent Plus (${selectedValues.colour.label.toLowerCase()})`,
      );
    }
    if (selectedValues.spec) {
      features.push(`ASUS ROG Phone II suitcase - ${selectedValues.spec.label}`);
    }

    // Add any other selected options
    Object.keys(selectedValues).forEach((key) => {
      if (key.toLowerCase() !== 'colour' && key.toLowerCase() !== 'spec') {
        const selection = selectedValues[key];
        features.push(`${key}: ${selection.label}`);
      }
    });

    // Truncate features that are longer than 70 characters
    const truncatedFeatures = features.map((feature) => {
      if (feature.length > 45) {
        return feature.substring(0, 45) + '...';
      }
      return feature;
    });

    // Generate the HTML using truncated features
    const listItems = truncatedFeatures.map((feature) => `<li>${feature}</li>`).join('\n');
    const bundleList = `<ul>\n${listItems}\n</ul>`;
    return bundleList;
  }

  /**
   * Store selected values in bundle card data attributes for future editing
   * @param {Object} selectedValues - The selected radio button values
   * @param {HTMLElement} bundleCard - The bundle card element
   */
  function storeSelectedValuesInBundleCard(selectedValues, bundleCard) {
    if (!bundleCard) {
      return;
    }

    // Store selected values as JSON in a data attribute
    bundleCard.setAttribute('data-selected-values', JSON.stringify(selectedValues));
  }

  /**
   * Retrieve stored selected values from bundle card
   * @param {HTMLElement} bundleCard - The bundle card element
   * @returns {Object|null} The stored selected values or null if none exist
   */
  function getStoredValuesFromBundleCard(bundleCard) {
    if (!bundleCard) {
      return null;
    }

    const storedData = bundleCard.getAttribute('data-selected-values');
    if (!storedData) {
      return null;
    }

    try {
      return JSON.parse(storedData);
    } catch (error) {
      console.debug('Failed to parse storedData:', error);
      return null;
    }
  }

  /**
   * Preselect radio buttons in popup based on stored values
   * @param {HTMLElement} bundleCard - The bundle card element that triggered the popup
   */
  function preselectValuesInPopup(bundleCard) {
    const storedValues = getStoredValuesFromBundleCard(bundleCard);
    if (!storedValues) {
      return;
    }

    // Clear any existing selections first
    clearPopupSelections();

    // Preselect radio buttons based on stored values
    Object.keys(storedValues).forEach((name) => {
      const storedValue = storedValues[name];
      if (storedValue?.id) {
        const radioButton = document.querySelector(
          `.cmp-bundles-dialog input[name="${name}"][id="${storedValue.id}"]`,
        );
        if (radioButton) {
          radioButton.checked = true;
          // Add visual feedback for preselected items
          const container = radioButton.closest('.cmp-bundles-options-radio');
          if (container) {
            container.classList.add('bg-color-radio');
            container.classList.add('container-bg-transition');
            setTimeout(() => {
              container.classList.remove('bg-color-radio');
            }, 1000);
          }
        }
      }
    });
  }

  /**
   * Clear all radio button selections in the popup
   */
  function clearPopupSelections() {
    const radioButtons = document.querySelectorAll('.cmp-bundles-dialog .bundles-radio');
    radioButtons.forEach((radio) => {
      radio.checked = false;
    });
  }
});
