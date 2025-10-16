import A11yDialog from 'a11y-dialog';
import Swiper from 'swiper';
import { Navigation, Thumbs } from 'swiper/modules';

class ImageGalleryModal {
  constructor() {
    this.container = document.getElementById('image-gallery-dialog');
    if (!this.container) {
      return;
    }

    this.dialog = new A11yDialog(this.container);
    this.swiperMain = null;
    this.swiperThumbs = null;

    this.init();
  }

  init() {
    const mainModal = this.container.querySelector('.image-gallery__main-carousel');
    const thumbsModal = this.container.querySelector('.image-gallery__thumbs-carousel');
    const prevEl = mainModal.querySelector('.carousel__action--previous');
    const nextEl = mainModal.querySelector('.carousel__action--next');

    this.swiperThumbs = new Swiper(thumbsModal, {
      spaceBetween: 8,
      slidesPerView: 'auto',
      freeMode: true,
      watchSlidesProgress: true,
    });

    this.swiperMain = new Swiper(mainModal, {
      modules: [Navigation, Thumbs],
      navigation: {
        nextEl,
        prevEl,
      },
      thumbs: {
        swiper: this.swiperThumbs,
        slideThumbActiveClass: 'carousel__item--active',
      },
    });
  }

  show(images = [], startIndex = 0, title = '', description = '', hideTitle = false) {
    if (!this.container || !images.length) {
      return;
    }

    const mainWrapper = this.container.querySelector(
      '.image-gallery__main-carousel .swiper-wrapper',
    );
    const thumbsWrapper = this.container.querySelector(
      '.image-gallery__thumbs-carousel .swiper-wrapper',
    );

    mainWrapper.innerHTML = '';
    thumbsWrapper.innerHTML = '';

    images.forEach((image) => {
      const mainSlide = `<div class="carousel__item swiper-slide">
        <img src="${image.image}" alt="${image.title}" />
      </div>`;
      const thumbSlide = `<div class="carousel__item swiper-slide">
        <img src="${image.thumbnail}" alt="${image.title}" />
      </div>`;
      mainWrapper.insertAdjacentHTML('beforeend', mainSlide);
      thumbsWrapper.insertAdjacentHTML('beforeend', thumbSlide);
    });

    this.swiperMain.update();
    this.swiperThumbs.update();
    this.swiperMain.slideTo(startIndex, 0);

    this.container.querySelector('#image-gallery-title').textContent = title;

    // If hide title is true, then keep title visually hidden
    this.container
      .querySelector('#image-gallery-title')
      .classList.toggle('visually-hidden', hideTitle);

    this.container.querySelector('#image-gallery-description').textContent = description;
    this.dialog.show();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.imageGallery = new ImageGalleryModal();
});
