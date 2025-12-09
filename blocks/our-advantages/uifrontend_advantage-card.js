import { trackEvent } from '../../scripts/google-data-layer.js';

const advantageCardsWrapper = document.querySelector('.our-advantages-wrapper');
advantageCardsWrapper.addEventListener('click', (event) => {
  const watchNowBtn = event.target.closest('.cmp-advantage-card__btn');
  const card = watchNowBtn?.closest('.cmp-advantage-card');
  const activeSlider = watchNowBtn?.closest('.cmp-carousel');
  const activeSlideProgress = activeSlider?.querySelector('.cmp-carousel__indicator--active');
  const videoPlayer = card?.querySelector('.cmp-advantage-card__video');
  const closeVideoBtn = card?.querySelector('.cmp-advantage-card__close-video');
  const swiperInstance = card?.closest('.swiper')?.swiperInstance;
  const slide = card?.closest('.swiper-slide');
  let videoDeplayDuration;

  if (!watchNowBtn || !card || !videoPlayer || !swiperInstance) {
    return;
  }

  // Track Watch Now button click
  const buttonText = watchNowBtn.textContent?.trim().replace(/\s+/g, ' ') || 'Watch Now';
  trackEvent({
    eventName: 'play_advantages_home_cto_rog',
    category: 'play/advantages/home/cto/rog',
    label: `${buttonText}/play/advantages/home/cto/rog`
  });

  // First resume autoplay to ensure swiper progress is correct.
  swiperInstance.autoplay.resume();

  // Then stop the autoplay until the video loads.
  swiperInstance.autoplay.stop();

  const autoPlay = () => {
    videoPlayer.play();
    card.classList.add('is-playing');

    // Resume swiper autoplay
    swiperInstance.autoplay.start();
  };

  // Lazy load video
  if (videoPlayer.dataset.src && !videoPlayer.getAttribute('src')) {
    videoPlayer.setAttribute('src', videoPlayer.dataset.src);
    videoPlayer.load();
  }

  if (videoPlayer.readyState >= 1 && !Number.isNaN(videoPlayer.duration)) {
    // Metadata is already loaded
    slide.dataset.swiperAutoplay = (Math.ceil(videoPlayer.duration) + videoDeplayDuration) * 1000;
    autoPlay();
  } else {
    // Wait for metadata
    videoPlayer.addEventListener('loadedmetadata', () => {
      slide.dataset.swiperAutoplay = (videoPlayer.duration + videoDeplayDuration) * 1000;
      autoPlay();
    });
  }

  swiperInstance.on('slideChangeTransitionStart', () => {
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    card.classList.remove('is-playing');
  });
  swiperInstance.on('slideChange', () => {
    activeSlideProgress.classList.remove('cmp-carousel__indicator--active-full');
  });
  if (closeVideoBtn) {
    closeVideoBtn.addEventListener(
      'click',
      () => {
        videoPlayer.pause();
        card.classList.remove('is-playing');
        activeSlideProgress.classList.remove(
          'cmp-carousel__indicator--active-full',
        );
        swiperInstance.slideNext();
        swiperInstance.autoplay.start();
      },
      { once: true },
    );
    closeVideoBtn.addEventListener('keydown', (evt) => { // eslint-disable-line consistent-return
      if (evt.keyCode === 9) {
        /* Handling tab key press on close icon */
        evt.preventDefault();
        videoPlayer.focus();
        return false;
      } if (evt.keyCode === 13) {
        /* Handling enter key press on close icon */
        evt.preventDefault();
        videoPlayer.pause();
        card.classList.remove('is-playing');
        activeSlideProgress.classList.remove(
          'cmp-carousel__indicator--active-full',
        );
        swiperInstance.slideNext();
        swiperInstance.autoplay.start();
        return false;
      }
    });
  }

  if (closeVideoBtn) {
    videoPlayer.addEventListener('play', () => {
      activeSlideProgress.classList.remove('cmp-carousel__indicator--active-full');
      swiperInstance.autoplay.start();
    });

    // When the video ends, reset the card and restart the swiper
    videoPlayer.onended = () => {
      // slide.dataset.swiperAutoplay = '';
      // card.classList.remove('is-playing');
      activeSlideProgress.classList.add('cmp-carousel__indicator--active-full');
      swiperInstance.autoplay.stop();
      videoPlayer.currentTime = 0;
    };
  }
});

advantageCardsWrapper.querySelectorAll('.cmp-carousel__item').forEach((item) => {
  item.addEventListener('click', () => {
    if (item.getAttribute('data-video')) return;
    const link = item.getAttribute('data-url');
    const isBlank = item.getAttribute('data-blank');
    window.open(link, isBlank ? '_blank' : '_self');
  });
});
