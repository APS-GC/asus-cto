document.addEventListener('click', function (event) {
  const watchNowBtn = event.target.closest('.cmp-advantage-card__btn');
  const card = watchNowBtn?.closest('.cmp-advantage-card');
  const videoPlayer = card?.querySelector('.cmp-advantage-card__video');
  const closeVideoBtn = card?.querySelector('.cmp-advantage-card__close-video');
  const swiperInstance = card?.closest('.swiper')?.swiperInstance;
  const slide = card?.closest('.swiper-slide');

  if (!watchNowBtn || !card || !videoPlayer || !swiperInstance) {
    return;
  }

  // First resume autoplay to ensure swiper progress is correct.
  swiperInstance.autoplay.resume();

  // Then stop the autoplay until the video loads.
  swiperInstance.autoplay.stop();

  // Lazy load video
  if (videoPlayer.dataset.src && !videoPlayer.getAttribute('src')) {
    videoPlayer.setAttribute('src', videoPlayer.dataset.src);
    videoPlayer.load();
  }

  if (videoPlayer.readyState >= 1 && !isNaN(videoPlayer.duration)) {
    // Metadata is already loaded
    slide.dataset.swiperAutoplay = (Math.ceil(videoPlayer.duration) + 1) * 1000;
  } else {
    // Wait for metadata
    videoPlayer.addEventListener('loadedmetadata', () => {
      slide.dataset.swiperAutoplay = (videoPlayer.duration + 1) * 1000;
    });
  }

  videoPlayer.play();
  card.classList.add('is-playing');

  // Resume swiper autoplay
  swiperInstance.autoplay.start();

  swiperInstance.on('slideChangeTransitionStart', () => {
    videoPlayer.removeAttribute('src');
    card.classList.remove('is-playing');
  });

  closeVideoBtn.addEventListener(
    'click',
    () => {
      videoPlayer.pause();
      card.classList.remove('is-playing');
    },
    { once: true },
  );

  // When the video ends, reset the card and restart the swiper
  videoPlayer.onended = () => {
    slide.dataset.swiperAutoplay = '';
    card.classList.remove('is-playing');
    videoPlayer.currentTime = 0;
  };
});
