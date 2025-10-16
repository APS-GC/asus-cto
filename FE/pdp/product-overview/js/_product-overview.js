import Swiper from 'swiper';
import { A11y, Navigation, Thumbs } from 'swiper/modules';

import 'a11y-dialog';

class ProductOverview {
  constructor(container) {
    if (!container || container.dataset.initialized) {
      return;
    }
    this.container = container;
    this.container.dataset.initialized = 'true';

    this._init();
  }

  _init() {
    this._initSwiperGallery();

    // Initialize game-fps sections
    this._initGameFps();
  }

  _initSwiperGallery() {
    const mainSwiperEl = this.container.querySelector('.product-gallery__main-carousel');
    const thumbSwiperEl = this.container.querySelector('.product-gallery__thumbs-carousel');

    if (!mainSwiperEl || !thumbSwiperEl) {
      return;
    }

    const prevEl = thumbSwiperEl.parentNode.querySelector('.carousel__action--previous');
    const nextEl = thumbSwiperEl.parentNode.querySelector('.carousel__action--next');

    const thumbSwiper = new Swiper(thumbSwiperEl, {
      modules: [Navigation, A11y],
      spaceBetween: 10,
      slidesPerView: 'auto',
      freeMode: true,
      slideToClickedSlide: true,
      watchSlidesProgress: true,
      watchOverflow: true,
      centeredSlides: false,
      initialSlide: 0,
    });

    const mainSwiper = new Swiper(mainSwiperEl, {
      modules: [Thumbs, A11y, Navigation],
      noSwipingClass: 'swiper-no-swiping',
      initialSlide: 0,
      loop: true,
      navigation: {
        nextEl,
        prevEl,
        disabledClass: 'cmp-carousel__action--disabled',
      },
      a11y: {
        enabled: true,
        slideLabelMessage: 'Image {{index}} of {{slidesLength}}',
        prevSlideMessage: 'Previous image in carousel',
        nextSlideMessage: 'Next image in carousel',
      },
      thumbs: {
        swiper: thumbSwiper,
        slideThumbActiveClass: 'carousel__item--active',
      },
    });

    if (mainSwiperEl.dataset.showImageGalleryModal === 'true') {
      let images = [];

      mainSwiper.slides.forEach((slide, index) => {
        // Ensure the index is within the bounds of the thumbSwiper's slides array
        if (index >= 0 && index < thumbSwiper.slides.length) {
          // eslint-disable-next-line security/detect-object-injection
          const thumbSlide = thumbSwiper.slides[index];
          if (thumbSlide) {
            images.push({
              image: slide.querySelector('img').src,
              thumbnail: thumbSlide.querySelector('img').src,
              title: slide.querySelector('img').alt,
            });
          }
        }
      });

      mainSwiperEl.addEventListener('click', () => {
        window.imageGallery.show(
          images,
          mainSwiper.realIndex,
          mainSwiperEl.dataset.galleryTitle,
          mainSwiperEl.dataset.galleryDescription,
        );
      });
    }
  }

  _initGameFps() {
    const desktopSection = this.container.querySelector('#game-fps-desktop-section');
    const mobileSection = this.container.querySelector('#game-fps-mobile-section');

    const gameFps = document.querySelector('#game-fps');

    if (!gameFps) {
      return;
    }

    if (window.innerWidth < 1024) {
      desktopSection.innerHTML = '';
      mobileSection.appendChild(gameFps);
    } else {
      mobileSection.innerHTML = '';
      desktopSection.appendChild(gameFps);
    }

    window.addEventListener('resize', () => {
      if (window.innerWidth < 1024) {
        desktopSection.innerHTML = '';
        mobileSection.appendChild(gameFps);
      } else {
        mobileSection.innerHTML = '';
        desktopSection.appendChild(gameFps);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document
    .querySelectorAll('.cmp-product-overview')
    .forEach((container) => new ProductOverview(container));

  // Set the score value and level when the dialog is opened
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-a11y-dialog-show="time-spy-score-dialog"]');
    const timeSpyDialog = document.querySelector('#time-spy-score-dialog');
    if (!btn || !timeSpyDialog) {
      return;
    }

    const score = btn.dataset.score || 'N/A';
    const level = btn.dataset.level;
    const scoreValueEl = timeSpyDialog.querySelector('.score-value');
    const scoreLevels = timeSpyDialog.querySelectorAll('.score-level');

    if (scoreValueEl) {
      scoreValueEl.textContent = score;
    }

    // Reset all levels before setting the active one
    scoreLevels.forEach((el) => el.classList.remove('current'));

    if (level) {
      const activeScoreLevel = timeSpyDialog.querySelector(`[data-level="${level}"]`);
      if (activeScoreLevel) {
        activeScoreLevel.classList.add('current');
      }
    }
  });
});
