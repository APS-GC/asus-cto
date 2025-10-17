class Tabs {
  constructor(container) {
    this.container = container;
    this.tablist = this.container.querySelector('[role="tablist"]');
    this.tabs = Array.from(this.tablist.querySelectorAll('[role="tab"]'));
    this.panels = Array.from(this.container.querySelectorAll('[role="tabpanel"]'));

    this.activeTab = null;
    this.activePanel = null;

    if (this.tabs.length > 0) {
      this.init();
    }
  }

  init() {
    // Set initial active tab
    const initialActiveTab =
      this.tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || this.tabs[0];
    this.activateTab(initialActiveTab, false);

    // Use event delegation
    this.tablist.addEventListener('click', (e) => this.handleClick(e));
    this.tablist.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleClick(event) {
    const clickedTab = event.target.closest('[role="tab"]');
    if (clickedTab && clickedTab !== this.activeTab) {
      this.activateTab(clickedTab);
    }
  }

  activateTab(selectedTab, setFocus = true) {
    // Deactivate the old tab and panel
    if (this.activeTab) {
      this.activeTab.setAttribute('aria-selected', 'false');
      this.activeTab.setAttribute('tabindex', '-1');
      this.activeTab.classList.remove('cmp-tabs__tab--active');
    }
    if (this.activePanel) {
      this.activePanel.setAttribute('aria-hidden', 'true');
      this.activePanel.classList.remove('cmp-tabs__tabpanel--active');
    }

    // Activate the new tab and panel
    const newPanelId = selectedTab.getAttribute('aria-controls');
    const newPanel = this.panels.find((panel) => panel.id === newPanelId);

    selectedTab.setAttribute('aria-selected', 'true');
    selectedTab.setAttribute('tabindex', '0');
    selectedTab.classList.add('cmp-tabs__tab--active');
    if (setFocus) {
      selectedTab.focus();
    }

    if (newPanel) {
      newPanel.setAttribute('aria-hidden', 'false');
      newPanel.classList.add('cmp-tabs__tabpanel--active');
    }

    // Update the cached active elements
    this.activeTab = selectedTab;
    this.activePanel = newPanel;
  }

  handleKeyDown(event) {
    const currentTab = event.target.closest('[role="tab"]');
    if (!currentTab) return;

    const currentIndex = this.tabs.indexOf(currentTab);
    const max = this.tabs.length - 1;
    let newIndex; // no initial assignment

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
        if (currentIndex >= 0 && currentIndex < this.tabs.length) {
          // eslint-disable-next-line security/detect-object-injection
          this.activateTab(this.tabs[currentIndex]);
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
      if (newIndex >= 0 && newIndex < this.tabs.length) {
        // eslint-disable-next-line security/detect-object-injection
        this.activateTab(this.tabs[newIndex]);
      }
    }
  }
}

// Auto-init all tab instances on page load
document.addEventListener('DOMContentLoaded', () => {
  const tabContainers = document.querySelectorAll('[data-cmp-is="custom-tabs"]');
  tabContainers.forEach((container) => new Tabs(container));

  // Check for dynamically added tab containers
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        const newTabContainers = mutation.target.querySelectorAll('[data-cmp-is="custom-tabs"]');
        newTabContainers.forEach((container) => new Tabs(container));
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});
