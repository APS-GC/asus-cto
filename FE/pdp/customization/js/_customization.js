document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.getElementById('customize-product');
  const nav = wrapper?.querySelector('.cmp-customization__sidebar-nav');
  const resetBtn = wrapper?.querySelector('#reset-customization');

  if (!nav) return;

  const tabs = [...nav.querySelectorAll('.cmp-customization__sidebar-nav-item')];
  if (!tabs.length) return;

  const sections = tabs
    .map((tab) => {
      const targetSelector = tab.getAttribute('href');
      const section = document.querySelector(targetSelector);
      return section ? { tab, section } : null;
    })
    .filter(Boolean);

  const getOffsets = () => {
    const secondaryNavHeight =
      document.querySelector('#pdp-detail-tabs__navigation')?.offsetHeight ?? 0;
    const floatingNavHeight =
      document.querySelector('.cmp-game-fps-sticky-navigation')?.offsetHeight ?? 0;
    return secondaryNavHeight + floatingNavHeight;
  };

  const activateTab = (tab) => {
    tabs.forEach((el) => el.classList.remove('active'));
    tab.classList.add('active');
  };

  // --- Handle click navigation ---
  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSelector = tab.getAttribute('href');
      const targetElement = document.querySelector(targetSelector);
      if (!targetElement) return;

      const offset = getOffsets();

      window.scrollTo({
        top: targetElement.offsetTop - offset,
        behavior: 'smooth',
      });

      activateTab(tab);
    });
  });

  // --- Handle scroll activation with IntersectionObserver ---
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const active = sections.find((s) => s.section === entry.target);
          if (active) activateTab(active.tab);
        }
      });
    },
    {
      rootMargin: `-${getOffsets()}px 0px -50% 0px`, // triggers when section enters view
      threshold: 0.1,
    },
  );

  sections.forEach(({ section }) => observer.observe(section));

  // --- Recalculate observer rootMargin on resize (in case sticky height changes) ---
  window.addEventListener('resize', () => {
    observer.disconnect();
    sections.forEach(({ section }) => observer.observe(section));
  });

  // --- Handle reset button ---
  if (resetBtn) {
    resetBtn?.addEventListener('click', () => {
      document.querySelectorAll('.customization-radio').forEach((radio) => (radio.checked = false));
      resetBtn.disabled = true;
    });

    // If radio is checked, enable reset button
    document.querySelectorAll('.customization-radio').forEach((radio) => {
      radio.addEventListener('change', () => {
        resetBtn.disabled = !document.querySelector('.customization-radio:checked');
      });
    });
  }
});
