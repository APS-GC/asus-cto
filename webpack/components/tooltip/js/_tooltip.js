class TooltipManager {
  constructor(options = {}) {
    this.tooltips = new Map();
    this.currentVisibleTooltip = null;
    this.config = {
      boundaryPadding: options.boundaryPadding || 13, // 8px spacing + 5px arrow size
      focusShowWithinMs: options.focusShowWithinMs || 1000, // only show on focus if keyboard interaction happened within this ms
    };

    // Track last user interaction (keyboard vs pointer)
    this.lastInteraction = { type: null, time: 0 };

    this.showTooltipTimeout = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.registerInitialTooltips();
    this.observeMutations();
  }

  observeMutations() {
    const handleTriggerElement = (el) => {
      this.registerTooltip(el);
    };

    const processAddedNode = (node) => {
      if (!(node instanceof HTMLElement)) return;

      if (node.matches?.('[data-tooltip-trigger]')) {
        handleTriggerElement(node);
      }

      if (node.querySelectorAll) {
        node.querySelectorAll('[data-tooltip-trigger]').forEach(handleTriggerElement);
      }
    };

    const handleMutations = (mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          processAddedNode(node);
        }
      }
    };

    this.mutationObserver = new MutationObserver(handleMutations);
    this.mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  setupEventListeners() {
    // Keep your existing handlers
    this._onKeyDown = (e) => {
      this.lastInteraction = { type: 'keyboard', time: Date.now() };
    };

    this._onPointerDown = (e) => {
      this.lastInteraction = { type: 'pointer', time: Date.now() };
    };

    this._onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        this.hideAllTooltips();
      }
    };

    document.addEventListener('keydown', this._onKeyDown, true);
    document.addEventListener('pointerdown', this._onPointerDown, true);
    window.addEventListener('scroll', this.updateVisibleTooltipPosition.bind(this));

    // Setup document click handler to hide tooltips if clicked outside
    let startX, startY, moved;

    document.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      moved = false;
    });

    document.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - startX);
      const dy = Math.abs(t.clientY - startY);
      if (dx > 10 || dy > 10) moved = true;
    });

    document.addEventListener('touchend', (e) => {
      if (!moved) {
        if (this.currentVisibleTooltip && this.currentVisibleTooltip?.trigger !== e.target) {
          this.hideTooltip(this.currentVisibleTooltip.trigger);
        }
      }
    });

    // Hide tooltips on swiper change
    window.addEventListener('swiper-slide-change', () => {
      this.hideAllTooltips();
    });

    // Setup resize observer for tooltip content
    this.resizeObserver = new ResizeObserver(() => {
      this.updateVisibleTooltipPosition();
    });
  }

  registerInitialTooltips() {
    document.querySelectorAll('[data-tooltip-trigger]').forEach((trigger) => {
      this.registerTooltip(trigger);
    });
  }

  registerTooltip(trigger) {
    const tooltipId = trigger.getAttribute('aria-describedby');
    if (!tooltipId) return;

    const tooltip = document.getElementById(tooltipId);
    if (!tooltip) return;

    // Check if tooltip is already registered
    if (this.tooltips.has(trigger)) return;

    // Move tooltip to body so positioning is simpler
    if (tooltip.parentElement !== document.body) {
      document.body.appendChild(tooltip);
    }

    // Accessibility attributes
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.setAttribute('aria-live', 'polite');

    // Initial off-screen style
    tooltip.style.position = 'fixed';
    tooltip.style.top = '-9999px';
    tooltip.style.left = '-9999px';

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // === Desktop handlers (hover + keyboard) ===
    const onHoverIn = () => !isTouch && this.showTooltip(trigger);
    const onHoverOut = (e) => {
      if (isTouch) return;
      const related = e.relatedTarget;
      if (related && tooltip.contains(related)) return;
      this.hideTooltip(trigger);
    };

    const onTooltipHoverOut = (e) => {
      if (isTouch) return;
      const related = e.relatedTarget;
      if (related && trigger.contains(related)) return;
      this.hideTooltip(trigger);
    };

    const onFocus = () => this.showTooltip(trigger);
    const onBlur = () => this.hideTooltip(trigger);

    // === Touch handlers (iPhone/iPad) ===
    const onTap = (e) => {
      // Don’t block native events → remove preventDefault
      const isVisible = this.currentVisibleTooltip?.trigger === trigger;
      if (isVisible) {
        this.hideTooltip(trigger);
      } else {
        this.showTooltip(trigger);
      }
    };

    const onDocTap = (e) => {
      if (!tooltip.contains(e.target) && !trigger.contains(e.target)) {
        this.hideTooltip(trigger);
      }
    };

    // Attach listeners
    if (isTouch) {
      trigger.addEventListener('click', onTap); // use click, more reliable on iOS
    } else {
      trigger.addEventListener('mouseenter', onHoverIn);
      trigger.addEventListener('mouseleave', onHoverOut);
      trigger.addEventListener('focus', onFocus);
      trigger.addEventListener('blur', onBlur);
      tooltip.addEventListener('mouseleave', onTooltipHoverOut);
    }

    this.tooltips.set(trigger, {
      element: tooltip,
      position: trigger.dataset.tooltipPosition || 'auto',
      listeners: { onHoverIn, onHoverOut, onFocus, onBlur, onTap, onDocTap, onTooltipHoverOut },
      hideTimeout: null,
    });

    // Observe tooltip content for changes
    this.resizeObserver.observe(tooltip);
  }

  showTooltip(trigger) {
    this.showTooltipTimeout = setTimeout(() => {
      const tooltipData = this.tooltips.get(trigger);
      if (!tooltipData) return;

      // If already visible for the same trigger, do nothing
      if (this.currentVisibleTooltip?.trigger === trigger) return;

      // Hide currently visible tooltip
      if (this.currentVisibleTooltip) {
        this.hideTooltip(this.currentVisibleTooltip.trigger);
      }

      const { element, position } = tooltipData;

      // Make tooltip measurable but keep it invisible while measuring:
      // set visibility hidden then add visible class (which may set display/block).
      const prevVisibility = element.style.visibility;
      element.style.visibility = 'hidden';
      element.classList.add('tooltip--visible'); // assumes CSS toggles display/opactiy/transform
      // Now compute and position
      this.positionTooltip(trigger, element, position);

      // restore visibility so it becomes visible (CSS transition will play if present)
      element.style.visibility = prevVisibility || '';

      element.setAttribute('aria-hidden', 'false');

      this.currentVisibleTooltip = { trigger, element };
    }, 100);
  }

  hideTooltip(trigger) {
    clearTimeout(this.showTooltipTimeout);

    const tooltipData = this.tooltips.get(trigger);
    if (!tooltipData) return;

    const { element } = tooltipData;

    // If it's currently visible, remove classes / attributes immediately
    element.classList.remove('tooltip--visible');
    element.setAttribute('aria-hidden', 'true');

    if (this.currentVisibleTooltip?.trigger === trigger) {
      this.currentVisibleTooltip = null;
    }
  }

  hideAllTooltips() {
    this.tooltips?.forEach((data, trigger) => {
      this.hideTooltip(trigger);
    });
  }

  calculateBestPosition(position, triggerRect, tooltipRect, space, padding) {
    const allowedPositions = ['top', 'bottom', 'left', 'right', 'x', 'y', 'auto'];
    const sanitized = allowedPositions.includes(position) ? position : 'auto';

    const strategies = {
      top: () => ({
        top: triggerRect.top - tooltipRect.height - padding,
        left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
        currentPosition: 'top',
      }),
      bottom: () => ({
        top: triggerRect.bottom + padding,
        left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
        currentPosition: 'bottom',
      }),
      left: () => ({
        left: triggerRect.left - tooltipRect.width - padding,
        top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
        currentPosition: 'left',
      }),
      right: () => ({
        left: triggerRect.right + padding,
        top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
        currentPosition: 'right',
      }),
      x: () => {
        const canPlaceRight = space.right > tooltipRect.width + padding;
        return {
          left: canPlaceRight
            ? triggerRect.right + padding // ✅ Default: right
            : triggerRect.left - tooltipRect.width - padding, // fallback: left
          top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
          currentPosition: canPlaceRight ? 'right' : 'left',
        };
      },

      y: () => {
        const canPlaceTop = space.top > tooltipRect.height + padding;
        return {
          top: canPlaceTop
            ? triggerRect.top - tooltipRect.height - padding // ✅ Default: top
            : triggerRect.bottom + padding, // fallback: bottom
          left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
          currentPosition: canPlaceTop ? 'top' : 'bottom',
        };
      },
      auto: () => {
        const positions = [
          {
            valid: space.bottom > tooltipRect.height + padding,
            top: triggerRect.bottom + padding,
            left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
            currentPosition: 'bottom',
            priority: space.bottom,
          },
          {
            valid: space.top > tooltipRect.height + padding,
            top: triggerRect.top - tooltipRect.height - padding,
            left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
            currentPosition: 'top',
            priority: space.top,
          },
          {
            valid: space.right > tooltipRect.width + padding,
            left: triggerRect.right + padding,
            top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
            currentPosition: 'right',
            priority: space.right,
          },
          {
            valid: space.left > tooltipRect.width + padding,
            left: triggerRect.left - tooltipRect.width - padding,
            top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
            currentPosition: 'left',
            priority: space.left,
          },
        ];

        const valid = positions.filter((p) => p.valid);
        if (valid.length === 0) return positions[0];
        return valid.reduce(
          (best, cur) => (cur.priority > best.priority ? cur : best),
          positions[0],
        );
      },
    };

    // The value of `sanitized` is strictly validated against a fixed whitelist.
    // eslint-disable-next-line security/detect-object-injection
    return strategies[sanitized]();
  }

  positionTooltip(trigger, tooltip, position = 'auto') {
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = this.config.boundaryPadding;

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const space = {
      top: triggerRect.top,
      bottom: viewport.height - triggerRect.bottom,
      left: triggerRect.left,
      right: viewport.width - triggerRect.right,
    };

    const posResult = this.calculateBestPosition(
      position,
      triggerRect,
      tooltipRect,
      space,
      padding,
    );

    tooltip.style.position = 'fixed';
    // Ensure we don't place negative values; keep inside viewport padding
    tooltip.style.top = `${Math.round(posResult.top)}px`;
    tooltip.style.left = `${Math.round(posResult.left)}px`;

    this.updatePositionClass(tooltip, posResult.currentPosition);
  }

  updatePositionClass(tooltip, position) {
    tooltip.classList.remove(
      'tooltip--position-top',
      'tooltip--position-bottom',
      'tooltip--position-left',
      'tooltip--position-right',
    );
    tooltip.classList.add(`tooltip--position-${position}`);
  }

  updateVisibleTooltipPosition() {
    if (this.currentVisibleTooltip) {
      const { trigger, element } = this.currentVisibleTooltip;
      const position = trigger.dataset.tooltipPosition || 'auto';
      this.positionTooltip(trigger, element, position);
    }
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  destroy() {
    // remove global handlers
    document.removeEventListener('keydown', this._onKeyDown, true);
    document.removeEventListener('pointerdown', this._onPointerDown, true);
    document.removeEventListener('visibilitychange', this._onVisibilityChange, true);
    window.removeEventListener('scroll', this.updateVisibleTooltipPosition, { passive: true });

    // Remove per-trigger listeners and restore DOM if needed
    this.tooltips.forEach((data, trigger) => {
      const t = data.element;
      const l = data.listeners;
      try {
        trigger.removeEventListener('pointerenter', l.onPointerEnter);
        trigger.removeEventListener('pointerleave', l.onPointerLeave);
        trigger.removeEventListener('focus', l.onFocus);
        trigger.removeEventListener('blur', l.onBlur);

        t.removeEventListener('pointerenter', l.onTooltipPointerEnter);
        t.removeEventListener('pointerleave', l.onTooltipPointerLeave);
      } catch (err) {
        console.error('Error removing event listeners:', err, trigger, t, l);
      }
    });

    this.tooltips.clear();
    this.currentVisibleTooltip = null;

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }
}

// Initialize automatically
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.tooltipManager === 'undefined') {
    window.tooltipManager = new TooltipManager();
  }
});
