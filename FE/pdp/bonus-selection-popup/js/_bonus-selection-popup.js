document.addEventListener('DOMContentLoaded', () => {
  // Store reference to the currently active bundle card
  let currentActiveBonusCard = null;

  // Handle existing actions button clicks
  const actionsButtons = document.querySelectorAll('.actions');
  actionsButtons.forEach((button) => {
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      // Store reference to the bundle card that triggered this popup
      currentActiveBonusCard = this.closest('.cmp-bundles-card');

      // Preselect values if this is an edit action (button text is "Edit")
      if (this.textContent.trim().toLowerCase() === 'edit') {
        // Small delay to ensure popup is fully rendered
        preselectValuesInPopup(currentActiveBonusCard);
      } else {
        // Clear any existing selections for new configurations
        // clearPopupSelections();
      }
    });
  });

  // Handle confirm CTA button clicks
  const confirmButtons = document.querySelectorAll('.bonus-confirm-cta button');
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
      updateProductFeatures(selectedValues, currentActiveBonusCard);

      // Clear the reference after processing
      setTimeout(() => {
        currentActiveBonusCard = null;
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
        currentActiveBonusCard = null;
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
    const radioButtons = document.querySelectorAll('.cmp-bonus-dialog .bonus-radio:checked');

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
    const parentContainer = radioElement.closest('.cmp-bonus-options-radio');
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

    // Process the data (but don't close dialog here anymore)
    const processedData = {
      timestamp: new Date().toISOString(),
      selections: selectedValues,
      summary: {
        colour: selectedValues.colour?.label || 'Not selected',
      },
    };
    return true;
  }

  /**
   * Show validation error for missing selections
   * @param {Array} missingSelections - Array of missing selection names
   */
  function showValidationError(missingSelections) {
    // Alternatively, you could highlight the missing sections
    missingSelections.forEach((name) => {
      highlightMissingSelection(name);
    });
  }

  /**
   * Highlight missing selection sections
   * @param {string} selectionName - Name of the missing selection
   */
  function highlightMissingSelection(selectionName) {
    const radioGroup = document.querySelector(`input[name="${selectionName}"]`);
    if (radioGroup) {
      const container = radioGroup.closest('.cmp-custom__popup-content__item__text__options');
      if (container) {
        container.classList.add('radio-error-border');

        // Remove highlight after 3 seconds
        setTimeout(() => {
          container.classList.remove('radio-error-border');
        }, 3000);
      }
    }
  }

  /**
   * Update the product features list in the bundle card
   * @param {Object} selectedValues - The selected radio button values
   * @param {HTMLElement} bonusCard - The bundle card element that triggered the popup
   */
  function updateProductFeatures(selectedValues, bonusCard) {
    if (!bonusCard) {
      return;
    }

    // Find the product features container in the specific bundle card
    const featuresContainer = bonusCard.querySelector('.selected-items');
    if (!featuresContainer) {
      return;
    }

    // Generate the features list HTML
    const featuresHTML = generateFeaturesHTML(selectedValues);

    // Update the features container immediately
    featuresContainer.innerHTML = featuresHTML;

    // Store selected values in bundle card for future editing
    storeSelectedValuesInbonusCard(selectedValues, bonusCard);

    // Update the CTA button text to "Edit"
    updateCTAButtonText(bonusCard, 'Edit');

    // Add a subtle animation to indicate the update
    featuresContainer.classList.add('opacity-transition');
    featuresContainer.classList.add('opacity-7');
    setTimeout(() => {
      featuresContainer.classList.remove('opacity-7');
      featuresContainer.classList.add('opacity-1');
    }, 100);

    // Get bundle card identifier for logging
    const bonusCardId = bonusCard.querySelector('input[type="radio"]')?.id || 'unknown';
  }

  /**
   * Update the CTA button text in the bundle card
   * @param {HTMLElement} bonusCard - The bundle card element
   * @param {string} newText - The new text for the button
   */
  function updateCTAButtonText(bonusCard, newText) {
    if (!bonusCard) {
      return;
    }

    // Find the CTA button in the bundle card
    const ctaButton = bonusCard.querySelector('.select-cta button.actions');
    if (!ctaButton) {
      return;
    }

    // Update the button text
    ctaButton.textContent = newText;

    // Add a visual indicator that the button has changed
    ctaButton.classList.add('container-bg-transition');
    ctaButton.classList.add('bg-transparent');
  }

  /**
   * Generate HTML for the features list based on selected values
   * @param {Object} selectedValues - The selected radio button values
   * @returns {string} HTML string for the features list
   */
  function generateFeaturesHTML(selectedValues) {
    const features = [];

    // Add base bundle items (you can customize these based on your data)
    // features.push(
    //   'Desktop ASUS ROYAL CLUB Memory & Hard Drive Installation Service/Including System Installation (Physical Card Kit)',
    // );
    // features.push('JOGEEK P4X4 1TB M2 2280');

    // Add selected options as features
    if (selectedValues.colour) {
      features.push(
        `ASUS SmartO Mouse MD200 Silent Plus (${selectedValues.colour.label.toLowerCase()})`,
      );
    } else {
    }

    // Add any other selected options
    Object.keys(selectedValues).forEach((key) => {
      if (key !== 'colour') {
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
    const bonusList = `<ul>\n${listItems}\n</ul>`;
    return bonusList;
  }

  /**
   * Store selected values in bundle card data attributes for future editing
   * @param {Object} selectedValues - The selected radio button values
   * @param {HTMLElement} bonusCard - The bundle card element
   */
  function storeSelectedValuesInbonusCard(selectedValues, bonusCard) {
    if (!bonusCard) {
      return;
    }

    // Store selected values as JSON in a data attribute
    bonusCard.setAttribute('data-selected-values', JSON.stringify(selectedValues));
  }

  /**
   * Retrieve stored selected values from bundle card
   * @param {HTMLElement} bonusCard - The bundle card element
   * @returns {Object|null} The stored selected values or null if none exist
   */
  function getStoredValuesFrombonusCard(bonusCard) {
    if (!bonusCard) {
      return null;
    }

    const storedData = bonusCard.getAttribute('data-selected-values');
    if (!storedData) {
      return null;
    }

    try {
      return JSON.parse(storedData);
    } catch (error) {
      return null;
    }
  }

  /**
   * Preselect radio buttons in popup based on stored values
   * @param {HTMLElement} bonusCard - The bundle card element that triggered the popup
   */
  function preselectValuesInPopup(bonusCard) {
    const storedValues = getStoredValuesFrombonusCard(bonusCard);
    if (!storedValues) {
      return;
    }

    // Clear any existing selections first
    clearPopupSelections();

    // Preselect radio buttons based on stored values
    Object.keys(storedValues).forEach((name) => {
      const storedValue = storedValues[name];
      if (storedValue && storedValue.id) {
        const radioButton = document.querySelector(
          `.cmp-bonus-dialog input[name="${name}"][id="${storedValue.id}"]`,
        );
        if (radioButton) {
          radioButton.checked = true;
          // Add visual feedback for preselected items
          const container = radioButton.closest('.cmp-bonus-options-radio');
          if (container) {
            container.classList.add('bg-color-radio');
            container.classList.add('container-bg-transition');
            setTimeout(() => {
              container.classList.remove('bg-color-radio');
            }, 1000);
          }
        } else {
        }
      }
    });
  }

  /**
   * Clear all radio button selections in the popup
   */
  function clearPopupSelections() {
    const radioButtons = document.querySelectorAll('.cmp-bonus-dialog .bonus-radio');
    radioButtons.forEach((radio) => {
      radio.checked = false;
    });
  }
});
