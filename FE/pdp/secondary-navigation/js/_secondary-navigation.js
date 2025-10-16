import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

document.addEventListener('DOMContentLoaded', () => {
  const productOverviewBody = document.querySelector('.cmp-product-overview__body');
  const stickyNav = document.querySelector('.cmp-game-fps-sticky-navigation');
  const pdpSecondaryNavigation = document.querySelector('#pdp-detail-tabs__navigation');

  if (pdpSecondaryNavigation) {
    document.documentElement.style.setProperty(
      '--secondaryNavHeight',
      pdpSecondaryNavigation.offsetHeight + 'px',
    );
  }

  const setFloatingNavHeight = () => {
    if (stickyNav) {
      document.documentElement.style.setProperty(
        '--floatingNavHeight',
        `${stickyNav.offsetHeight}px`,
      );
    }
  };

  if (productOverviewBody && stickyNav) {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio <= 0) {
        stickyNav.classList.add('show');
        setFloatingNavHeight();
      } else {
        stickyNav.classList.remove('show');
        document.documentElement.style.setProperty('--floatingNavHeight', '0px');
        document.querySelector('.game-fps-accordion-item')?.classList.remove('open');
      }
    });

    observer.observe(productOverviewBody);
  }

  document.addEventListener('floatingNavAccordionToggle', setFloatingNavHeight);

  const secondaryNavigation = document.querySelector('.secondary-navigation');
  const carousel = secondaryNavigation?.querySelector('.secondary-navigation-carousel');

  if (carousel) {
    const swiper = new Swiper(carousel, {
      modules: [Navigation],
      slidesPerView: 'auto',
      freeMode: true,
      navigation: {
        nextEl: secondaryNavigation.querySelector('.secondary-navigation-action-next'),
        prevEl: secondaryNavigation.querySelector('.secondary-navigation-action-prev'),
      },
    });

    // Store the swiper instance in the window object for global access
    // This is used to control the carousel from other scripts
    window.secondaryNavigationSwiper = swiper;
  }

  // Check if the URL has a hash for the secondary navigation
  // If yes then activate the tab and scroll to secondary navigation.
  const hash = window.location.hash;
  if (hash) {
    const tab = secondaryNavigation.querySelector(
      `.cmp-tabs__tab[aria-controls="${hash.replace('#', '')}"]`,
    );
    if (tab) {
      tab.click();

      // Scroll to secondary navigation
      secondaryNavigation.scrollIntoView({ behavior: 'smooth' });
    }
  }
});
