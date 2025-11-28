import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';

document.addEventListener('DOMContentLoaded', () => {
  const swiper = new Swiper('.mySwiper', {
    modules: [Navigation, Pagination],
    slidesPerView: 1,
    spaceBetween: 20,
    loop: true,
    grabCursor: true,
    breakpoints: {
      // when window width is >= 768px
      768: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      1280: {
        slidesPerView: 4,
        spaceBetween: 20,
      },
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });
  const fractionPagination = document.querySelector('.pagination-fraction');
  swiper.on('slideChange', function () {
    const currentSlide = swiper.realIndex + 1;
    const totalSlides = swiper.slides.length;
    fractionPagination.textContent = `${currentSlide} / ${totalSlides}`;
  });

  // Initialize the fraction pagination on load
  const currentSlide = swiper.realIndex + 1;
  const totalSlides = swiper.slides.length;
  fractionPagination.textContent = `${currentSlide} / ${totalSlides}`;
});
