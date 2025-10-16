/**
 * Bonus Card Selection Controller
 * Manages dynamic selection counting for bonus sections
 */
class BonusCardController {
  constructor() {
    this.initialized = false;
    this.bonusSections = new Map();

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * Initialize the controller
   */
  init() {
    try {
      this.cacheBonusSections();
      this.bindEvents();
      this.initialized = true;
    } catch (error) {}
  }

  /**
   * Cache bonus sections and their max values
   */
  cacheBonusSections() {
    const bonusSelectedElements = document.querySelectorAll(
      '.cmp__bonus-selected[data-bonus-section]',
    );

    bonusSelectedElements.forEach((element) => {
      const sectionId = element.getAttribute('data-bonus-section');
      const maxValue = parseInt(element.getAttribute('data-max')) || 1;
      const selectedValue = parseInt(element.getAttribute('data-selected')) || 0;

      this.bonusSections.set(sectionId, {
        maxValue: maxValue,
        selectedCount: selectedValue,
        checkboxes: [],
        element: element,
      });
    });

    // Cache checkboxes for each section
    this.bonusSections.forEach((section, sectionId) => {
      const sectionElement = document
        .querySelector(`[data-bonus-section="${sectionId}"]`)
        .closest('.cmp-bonus-section');
      if (sectionElement) {
        const checkboxes = sectionElement.querySelectorAll(
          '.bundles-checkbox:not(.bonus-out-of-stock)',
        );
        section.checkboxes = Array.from(checkboxes);

        // Count initially selected checkboxes
        const actualSelected = section.checkboxes.filter((cb) => cb.checked).length;
        section.selectedCount = actualSelected;

        // Update display immediately
        this.updateBonusCounter(sectionId, section.selectedCount, section.maxValue);
      }
    });
  }

  /**
   * Bind event listeners to checkboxes
   */
  bindEvents() {
    this.bonusSections.forEach((section, sectionId) => {
      section.checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', (e) => this.handleCheckboxChange(e, sectionId));
      });
    });
  }

  /**
   * Handle checkbox change events
   * @param {Event} event - The change event
   * @param {string} sectionId - The bonus section ID
   */
  handleCheckboxChange(event, sectionId) {
    const checkbox = event.target;
    const section = this.bonusSections.get(sectionId);

    if (!section) return;

    if (checkbox.checked) {
      // Check if we can select more
      if (section.selectedCount >= section.maxValue) {
        // Prevent selection if max reached
        checkbox.checked = false;
        // this.showMaxSelectionMessage(sectionId, section.maxValue);
        return;
      }
      section.selectedCount++;
    } else {
      section.selectedCount--;
    }

    // Update the bonus selected counter display
    this.updateBonusCounter(sectionId, section.selectedCount, section.maxValue);

    // Update checkbox states based on limits
    this.updateCheckboxStates(sectionId);
  }

  /**
   * Update bonus selection counter display
   * @param {string} sectionId - The bonus section ID
   * @param {number} selected - Number of selected bonuses
   * @param {number} max - Maximum number of bonuses
   */
  updateBonusCounter(sectionId, selected, max) {
    const section = this.bonusSections.get(sectionId);
    if (!section || !section.element) return;

    // Update data attributes
    section.element.setAttribute('data-selected', selected);

    // Update the display text
    section.element.textContent = `(${selected} / ${max} selected) bonuses selected`;
  }

  /**
   * Update checkbox states (disable/enable based on selection limit)
   * @param {string} sectionId - The bonus section ID
   */
  updateCheckboxStates(sectionId) {
    const section = this.bonusSections.get(sectionId);
    if (!section) return;

    const maxReached = section.selectedCount >= section.maxValue;

    section.checkboxes.forEach((checkbox) => {
      if (!checkbox.checked && !checkbox.classList.contains('bonus-out-of-stock')) {
        // Disable unchecked checkboxes if max is reached
        checkbox.disabled = maxReached;

        // Add visual indication
        const card = checkbox.closest('.cmp-bundles-card');
        if (card && !card.classList.contains('bonus-out-of-stock')) {
          if (maxReached) {
            card.classList.add('selection-disabled');
          } else {
            card.classList.remove('selection-disabled');
          }
        }
      }
    });
  }

  /**
   * Show message when max selection is reached
   * @param {string} sectionId - The bonus section ID
   * @param {number} maxValue - Maximum allowed selections
   */

  /**
   * Get current selection state for a section
   * @param {string} sectionId - The bonus section ID
   * @returns {Object} Current selection state
   */
  getSectionState(sectionId) {
    const section = this.bonusSections.get(sectionId);
    return section
      ? {
          sectionId: sectionId,
          selected: section.selectedCount,
          max: section.maxValue,
          canSelectMore: section.selectedCount < section.maxValue,
        }
      : null;
  }

  /**
   * Manually update a section's selected count (for external use)
   * @param {string} sectionId - The bonus section ID
   * @param {number} selected - New selected count
   */
  updateSectionCount(sectionId, selected) {
    const section = this.bonusSections.get(sectionId);
    if (!section) return;

    section.selectedCount = Math.max(0, Math.min(selected, section.maxValue));
    this.updateBonusCounter(sectionId, section.selectedCount, section.maxValue);
    this.updateCheckboxStates(sectionId);
  }
}

// Initialize the controller
const bonusCardController = new BonusCardController();

// Make it globally available
window.bonusCardController = bonusCardController;
