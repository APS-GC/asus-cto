/**
 * Tabs Block
 * Accessible tabs component with keyboard navigation
 * Uses functional programming approach for EDS compatibility
 */

import { getBlockConfigs } from '../../scripts/configs.js';

/**
 * Activate a specific tab
 * @param {HTMLElement} selectedTab - The tab to activate
 * @param {Array<HTMLElement>} allTabs - All tab elements
 * @param {Array<HTMLElement>} allPanels - All panel elements
 * @param {boolean} setFocus - Whether to focus the tab
 */
function activateTab(selectedTab, allTabs, allPanels, setFocus = true) {
  // Deactivate all tabs
  allTabs.forEach((tab) => {
    tab.setAttribute('aria-selected', 'false');
    tab.setAttribute('tabindex', '-1');
    tab.classList.remove('cmp-tabs__tab--active');
  });

  // Hide all panels
  allPanels.forEach((panel) => {
    panel.setAttribute('aria-hidden', 'true');
    panel.classList.remove('cmp-tabs__tabpanel--active');
  });

  // Activate selected tab
  const newPanelId = selectedTab.getAttribute('aria-controls');
  const newPanel = allPanels.find((panel) => panel.id === newPanelId);

  selectedTab.setAttribute('aria-selected', 'true');
  selectedTab.setAttribute('tabindex', '0');
  selectedTab.classList.add('cmp-tabs__tab--active');

  if (setFocus) {
    selectedTab.focus();
  }

  // Show selected panel
  if (newPanel) {
    newPanel.setAttribute('aria-hidden', 'false');
    newPanel.classList.add('cmp-tabs__tabpanel--active');
  }
}

/**
 * Handle click events on tabs
 * @param {Event} event - Click event
 * @param {Array<HTMLElement>} allTabs - All tab elements
 * @param {Array<HTMLElement>} allPanels - All panel elements
 */
function handleTabClick(event, allTabs, allPanels) {
  const clickedTab = event.target.closest('[role="tab"]');
  if (!clickedTab) return;

  const currentActiveTab = allTabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
  if (clickedTab !== currentActiveTab) {
    activateTab(clickedTab, allTabs, allPanels);
  }
}

/**
 * Handle keyboard navigation
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Array<HTMLElement>} allTabs - All tab elements
 * @param {Array<HTMLElement>} allPanels - All panel elements
 */
function handleTabKeyDown(event, allTabs, allPanels) {
  const currentTab = event.target.closest('[role="tab"]');
  if (!currentTab) return;

  const currentIndex = allTabs.indexOf(currentTab);
  const max = allTabs.length - 1;
  let newIndex;

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      newIndex = currentIndex >= max ? 0 : currentIndex + 1;
      event.preventDefault();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      newIndex = currentIndex <= 0 ? max : currentIndex - 1;
      event.preventDefault();
      break;
    case 'Enter':
    case ' ':
      if (currentIndex >= 0 && currentIndex < allTabs.length) {
        activateTab(allTabs[currentIndex], allTabs, allPanels);
      }
      event.preventDefault();
      return;
    case 'Home':
      newIndex = 0;
      event.preventDefault();
      break;
    case 'End':
      newIndex = max;
      event.preventDefault();
      break;
    default:
      return;
  }

  if (newIndex !== undefined && newIndex !== currentIndex) {
    if (newIndex >= 0 && newIndex < allTabs.length) {
      activateTab(allTabs[newIndex], allTabs, allPanels);
    }
  }
}

/**
 * Initialize tabs functionality
 * @param {HTMLElement} container - The tabs container element
 */
function initializeTabs(container) {
  const tablist = container.querySelector('[role="tablist"]');
  const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
  const panels = Array.from(container.querySelectorAll('[role="tabpanel"]'));

  if (!tablist || tabs.length === 0) {
    return;
  }

  // Set initial active tab
  const initialActiveTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
  activateTab(initialActiveTab, tabs, panels, false);

  // Add event listeners using event delegation
  tablist.addEventListener('click', (event) => handleTabClick(event, tabs, panels));
  tablist.addEventListener('keydown', (event) => handleTabKeyDown(event, tabs, panels));
}

// Default configuration
const DEFAULT_CONFIG = {
  style: 'solid', // default style: 'solid' or 'outline'
};

/**
 * Generate unique ID for tab panel
 * @param {string} prefix - ID prefix
 * @param {number} index - Tab index
 * @returns {string} Unique ID
 */
function generateId(prefix, index) {
  return `${prefix}-${index}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Build tab button element
 * @param {string} title - Tab title
 * @param {string} panelId - Associated panel ID
 * @param {number} index - Tab index
 * @returns {HTMLElement} Tab button element
 */
function buildTab(title, panelId, index) {
  const tab = document.createElement('li');
  tab.setAttribute('role', 'tab');
  tab.classList.add('cmp-tabs__tab');
  tab.setAttribute('aria-controls', panelId);
  tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
  tab.textContent = title;

  if (index === 0) {
    tab.classList.add('cmp-tabs__tab--active');
    tab.setAttribute('tabindex', '0');
  } else {
    tab.setAttribute('tabindex', '-1');
  }

  return tab;
}

/**
 * Build tab panel element
 * @param {HTMLElement} contentCell - Cell containing panel content
 * @param {string} panelId - Panel ID
 * @param {number} index - Panel index
 * @returns {HTMLElement} Panel element
 */
function buildPanel(contentCell, panelId, index) {
  const panel = document.createElement('div');
  panel.setAttribute('id', panelId);
  panel.setAttribute('role', 'tabpanel');
  panel.classList.add('cmp-tabs__tabpanel');
  panel.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');

  if (index === 0) {
    panel.classList.add('cmp-tabs__tabpanel--active');
  }

  // Move content from cell to panel
  while (contentCell.firstChild) {
    panel.appendChild(contentCell.firstChild);
  }

  return panel;
}

/**
 * Build tabs structure from rows
 * @param {Array<HTMLElement>} rows - Table rows
 * @param {Object} config - Configuration object
 * @returns {Object} Object containing tablist and panels array
 */
function buildTabsStructure(rows, config) {
  const tablist = document.createElement('ol');
  tablist.setAttribute('role', 'tablist');
  tablist.classList.add('cmp-tabs__tablist');

  const panels = [];

  rows.forEach((row, index) => {
    const cells = Array.from(row.children);

    if (cells.length < 2) {
      console.warn('Tab row must have at least 2 cells (title and content)');
      return;
    }

    // First cell is tab title
    const titleCell = cells[0];
    const tabTitle = titleCell.textContent.trim();

    // Second cell is tab content
    const contentCell = cells[1];

    // Generate unique panel ID
    const panelId = generateId('tab-panel', index);

    // Build and append tab
    const tab = buildTab(tabTitle, panelId, index);
    tablist.appendChild(tab);

    // Build panel
    const panel = buildPanel(contentCell, panelId, index);
    panels.push(panel);
  });

  return { tablist, panels };
}

/**
 * Decorate the tabs block
 * @param {HTMLElement} block - The block element
 */
export default async function decorate(block) {
  // Parse configuration using getBlockConfigs
  const config = await getBlockConfigs(block, DEFAULT_CONFIG, 'tabs');

  // Get all rows (each row is a tab)
  const rows = Array.from(block.children);

  if (rows.length === 0) {
    block.innerHTML = '<p>No tabs defined</p>';
    return;
  }

  // Build tabs structure
  const { tablist, panels } = buildTabsStructure(rows, config);

  // Create container structure
  const tabsContainer = document.createElement('div');
  tabsContainer.setAttribute('data-cmp-is', 'custom-tabs');
  tabsContainer.classList.add('tabs');

  const tabsInner = document.createElement('div');
  tabsInner.classList.add('cmp-tabs');
  tabsInner.setAttribute('data-style', config.style);

  // Create panels container
  const panelsContainer = document.createElement('div');
  panelsContainer.classList.add('cmp-tabs__panels');
  panels.forEach((panel) => panelsContainer.appendChild(panel));

  // Assemble the structure
  tabsInner.appendChild(tablist);
  tabsInner.appendChild(panelsContainer);
  tabsContainer.appendChild(tabsInner);

  // Replace block content
  block.innerHTML = '';
  block.appendChild(tabsContainer);

  // Initialize tabs functionality
  // Use setTimeout to ensure DOM is fully updated
  setTimeout(() => {
    initializeTabs(tabsContainer);
  }, 0);
}

/**
 * Auto-initialize tabs in dynamically added content
 * This function can be called from other blocks that create tabs dynamically
 * @param {HTMLElement} container - Container with tabs to initialize
 */
export function initDynamicTabs(container) {
  const tabContainers = container.querySelectorAll('[data-cmp-is="custom-tabs"]');
  tabContainers.forEach((tabContainer) => initializeTabs(tabContainer));
}

/**
 * Helper function to activate a specific tab by index
 * Useful for programmatic tab switching
 * @param {HTMLElement} container - The tabs container
 * @param {number} index - Tab index to activate
 */
export function activateTabByIndex(container, index) {
  const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
  const panels = Array.from(container.querySelectorAll('[role="tabpanel"]'));

  if (index >= 0 && index < tabs.length) {
    activateTab(tabs[index], tabs, panels);
  }
}
