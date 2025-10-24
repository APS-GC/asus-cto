/**
 * Carousel Block with Hero Banner Slides
 * Supports authorable hero banner slides with video/image media, CTA buttons, and autoplay settings
 */

// Configuration defaults
const DEFAULT_IMAGE_AUTOPLAY = 5000;
const DEFAULT_VIDEO_AUTOPLAY = 8000;

/**
 * Parse carousel configuration from block data
 */
function parseCarouselConfig(block) {
  const config = {
    imageAutoplayDuration: DEFAULT_IMAGE_AUTOPLAY,
    videoAutoplayDuration: DEFAULT_VIDEO_AUTOPLAY,
    slides: []
  };

  // Check if this is UE authoring format (has carousel-slide components as children)
  const slideElements = block.querySelectorAll('.carousel-slide');
  
  if (slideElements.length > 0) {
    // UE Authoring format - parse carousel-slide components
    slideElements.forEach((slideElement, index) => {
      const slide = parseSlideFromUEFormat(slideElement, index);
      if (slide) {
        config.slides.push(slide);
      }
    });
    
    // Check for carousel settings in data attributes or separate elements
    const settingsElement = block.querySelector('.carousel-settings');
    if (settingsElement) {
      const imageAutoplay = settingsElement.dataset.imageAutoplayDuration;
      const videoAutoplay = settingsElement.dataset.videoAutoplayDuration;
      
      if (imageAutoplay) config.imageAutoplayDuration = parseInt(imageAutoplay, 10) * 1000;
      if (videoAutoplay) config.videoAutoplayDuration = parseInt(videoAutoplay, 10) * 1000;
    }
    
    return config;
  }

  // Legacy table format for demo compatibility
  const rows = [...block.children];
  
  if (rows.length === 0) return config;

  // First row might contain carousel settings
  const firstRow = rows[0];
  const firstRowCells = [...firstRow.children];
  
  // Check if first row contains carousel settings (if it has specific structure)
  if (firstRowCells.length >= 2 && firstRowCells[0].textContent.toLowerCase().includes('autoplay')) {
    // Parse autoplay settings
    const settingsText = firstRowCells[1].textContent;
    const imageMatch = settingsText.match(/image[:\s]*(\d+)/i);
    const videoMatch = settingsText.match(/video[:\s]*(\d+)/i);
    
    if (imageMatch) config.imageAutoplayDuration = parseInt(imageMatch[1], 10) * 1000;
    if (videoMatch) config.videoAutoplayDuration = parseInt(videoMatch[1], 10) * 1000;
    
    // Remove settings row from slides processing
    rows.shift();
  }

  // Parse slide data from table format
  rows.forEach((row, index) => {
    const cells = [...row.children];
    if (cells.length >= 6) {
      const slide = {
        id: `slide-${index}`,
        title: cells[0]?.textContent?.trim() || '',
        subtitle: cells[1]?.textContent?.trim() || '',
        media: cells[2]?.querySelector('a')?.href || cells[2]?.textContent?.trim() || '',
        mediaAlt: cells[3]?.textContent?.trim() || '',
        ctaText: cells[4]?.textContent?.trim() || '',
        ctaLocation: cells[5]?.textContent?.trim() || 'center',
        ctaLink: cells[6]?.querySelector('a')?.href || cells[6]?.textContent?.trim() || '',
        openNewTab: cells[7]?.textContent?.toLowerCase().includes('true') || false
      };
      
      // Determine if media is video
      slide.isVideo = slide.media.match(/\.(mp4|webm|ogg)$/i) !== null;
      
      config.slides.push(slide);
    }
  });

  return config;
}

/**
 * Parse slide data from UE format carousel-slide component
 */
function parseSlideFromUEFormat(slideElement, index) {
  // Look for data attributes first (preferred UE approach)
  const data = slideElement.dataset;
  
  if (data.title || data.media) {
    const slide = {
      id: `slide-${index}`,
      title: data.title || '',
      subtitle: data.subtitle || '',
      media: data.media || '',
      mediaAlt: data.mediaAlt || data.alt || '',
      ctaText: data.ctaText || data.buttonText || '',
      ctaLocation: data.ctaLocation || 'center',
      ctaLink: data.ctaLink || data.link || '',
      openNewTab: data.openNewTab === 'true' || data.newTab === 'true'
    };
    
    // Determine if media is video
    slide.isVideo = slide.media.match(/\.(mp4|webm|ogg)$/i) !== null;
    
    return slide;
  }
  
  // Fallback: try to parse from child elements
  const titleElement = slideElement.querySelector('.slide-title, h1, h2, h3, h4, h5, h6');
  const subtitleElement = slideElement.querySelector('.slide-subtitle, .subtitle');
  const mediaElement = slideElement.querySelector('img, video, .slide-media');
  const ctaElement = slideElement.querySelector('.cta-button, .button, a');
  
  if (titleElement || mediaElement) {
    const slide = {
      id: `slide-${index}`,
      title: titleElement?.textContent?.trim() || '',
      subtitle: subtitleElement?.textContent?.trim() || '',
      media: '',
      mediaAlt: '',
      ctaText: ctaElement?.textContent?.trim() || '',
      ctaLocation: slideElement.dataset.ctaLocation || 'center',
      ctaLink: ctaElement?.href || '',
      openNewTab: ctaElement?.target === '_blank'
    };
    
    // Extract media information
    if (mediaElement) {
      if (mediaElement.tagName === 'IMG') {
        slide.media = mediaElement.src;
        slide.mediaAlt = mediaElement.alt;
        slide.isVideo = false;
      } else if (mediaElement.tagName === 'VIDEO') {
        slide.media = mediaElement.src;
        slide.mediaAlt = mediaElement.getAttribute('aria-label') || '';
        slide.isVideo = true;
      } else {
        // Check for background image or other media
        const bgImage = window.getComputedStyle(mediaElement).backgroundImage;
        if (bgImage && bgImage !== 'none') {
          slide.media = bgImage.slice(4, -1).replace(/"/g, '');
          slide.isVideo = false;
        }
      }
    }
    
    return slide;
  }
  
  return null;
}

/**
 * Generate hero banner HTML for a slide
 */
function generateHeroBannerHTML(slide, config) {
  const ctaLocationClass = `hero-content--${slide.ctaLocation.toLowerCase()}`;
  const targetAttr = slide.openNewTab ? 'target="_blank" rel="noopener noreferrer"' : '';
  const autoplayDuration = slide.isVideo ? config.videoAutoplayDuration : config.imageAutoplayDuration;

  return `
    <div class="hero-banner cmp-hero-banner ${ctaLocationClass}">
      ${slide.isVideo ? `
        <div class="hero-video-wrapper">
          <video
            class="hero-video"
            loop
            muted
            playsinline
            poster="${slide.media.replace(/\.(mp4|webm|ogg)$/i, '.webp')}"
            src="${slide.media}"
            data-autoplay-duration="${autoplayDuration}"
          ></video>
        </div>
      ` : `
        <div class="hero-image-wrapper">
          <picture>
            <img src="${slide.media}" alt="${slide.mediaAlt}" class="hero-image" loading="lazy" />
          </picture>
        </div>
      `}

      <div class="hero-content">
        ${slide.subtitle ? `<p class="product-name">${slide.subtitle}</p>` : ''}
        <h2 class="headline">${slide.title}</h2>
        ${slide.ctaText && slide.ctaLink ? `
          <a href="${slide.ctaLink}" class="cta-button btn" ${targetAttr} aria-label="${slide.ctaText} ${slide.subtitle}">
            ${slide.ctaText}
          </a>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Initialize Swiper carousel
 */
function initializeSwiper(carouselElement, config) {
  // Wait for Swiper library to be available
  const initSwiper = () => {
    if (typeof window.Swiper === 'undefined') {
      // Load Swiper dynamically if not available
      const swiperCSS = document.createElement('link');
      swiperCSS.rel = 'stylesheet';
      swiperCSS.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
      document.head.appendChild(swiperCSS);

      const swiperJS = document.createElement('script');
      swiperJS.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
      swiperJS.onload = () => setupSwiper();
      document.head.appendChild(swiperJS);
    } else {
      setupSwiper();
    }
  };

  const setupSwiper = () => {
    const swiper = new window.Swiper(carouselElement.querySelector('.swiper'), {
      loop: true,
      autoplay: {
        delay: config.imageAutoplayDuration,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      pagination: {
        el: '.cmp-carousel__indicators',
        clickable: true,
        bulletClass: 'cmp-carousel__indicator',
        bulletActiveClass: 'cmp-carousel__indicator--active',
      },
      navigation: {
        nextEl: '.cmp-carousel__action--next',
        prevEl: '.cmp-carousel__action--previous',
      },
      on: {
        slideChange: function() {
          // Update autoplay delay based on current slide media type
          const activeSlide = this.slides[this.activeIndex];
          const video = activeSlide?.querySelector('video');
          const newDelay = video ? config.videoAutoplayDuration : config.imageAutoplayDuration;
          
          this.autoplay.stop();
          this.params.autoplay.delay = newDelay;
          this.autoplay.start();
        },
        slideChangeTransitionEnd: function() {
          // Handle video autoplay
          const activeSlide = this.slides[this.activeIndex];
          const video = activeSlide?.querySelector('video');
          
          if (video) {
            video.play().catch(() => {
              // Autoplay failed, which is expected in some browsers
            });
          }
          
          // Pause videos in other slides
          this.slides.forEach((slide, index) => {
            if (index !== this.activeIndex) {
              const slideVideo = slide.querySelector('video');
              if (slideVideo) {
                slideVideo.pause();
              }
            }
          });
        }
      }
    });

    // Add media control functionality
    const playPauseBtn = carouselElement.querySelector('.cmp-carousel__media-control--play-pause');
    const autoplayToggle = carouselElement.querySelector('.carousel-autoplay-toggle');
    
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        const activeSlide = swiper.slides[swiper.activeIndex];
        const video = activeSlide?.querySelector('video');
        
        if (video) {
          if (video.paused) {
            video.play();
            playPauseBtn.setAttribute('aria-label', `Pause ${activeSlide.querySelector('.product-name')?.textContent || 'video'}`);
          } else {
            video.pause();
            playPauseBtn.setAttribute('aria-label', `Play ${activeSlide.querySelector('.product-name')?.textContent || 'video'}`);
          }
        }
      });
    }

    if (autoplayToggle) {
      autoplayToggle.addEventListener('click', () => {
        if (swiper.autoplay.running) {
          swiper.autoplay.stop();
          autoplayToggle.setAttribute('aria-label', 'Play');
          carouselElement.setAttribute('aria-live', 'polite');
        } else {
          swiper.autoplay.start();
          autoplayToggle.setAttribute('aria-label', 'Pause');
          carouselElement.setAttribute('aria-live', 'off');
        }
      });
    }
  };

  initSwiper();
}

/**
 * Main decoration function
 */
export default function decorate(block) {
  const config = parseCarouselConfig(block);
  
  if (config.slides.length === 0) {
    // Fallback content if no slides configured
    block.innerHTML = '<div class="carousel-placeholder"><p>No carousel slides configured</p></div>';
    return;
  }

  // Generate carousel ID
  const carouselId = `carousel-${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate slides HTML
  const slidesHTML = config.slides.map((slide, index) => `
    <div id="${carouselId}-item-${slide.id}-tabpanel" 
         class="cmp-carousel__item swiper-slide ${index === 0 ? 'cmp-carousel__item--active' : ''}"
         role="group" 
         aria-label="Slide ${index + 1} of ${config.slides.length}"
         data-swiper-slide-index="${index}"
         ${slide.isVideo ? `data-swiper-autoplay="${config.videoAutoplayDuration}"` : `data-swiper-autoplay="${config.imageAutoplayDuration}"`}>
      ${generateHeroBannerHTML(slide, config)}
    </div>
  `).join('');

  // Generate indicators HTML
  const indicatorsHTML = config.slides.map((slide, index) => `
    <li class="cmp-carousel__indicator ${index === 0 ? 'cmp-carousel__indicator--active' : ''}"
        aria-label="Go to slide ${index + 1}"
        role="tab"
        tabindex="0"
        ${index === 0 ? 'aria-current="true"' : ''}></li>
  `).join('');

  // Build complete carousel HTML
  const carouselHTML = `
    <div class="carousel panelcontainer">
      <div id="${carouselId}" class="cmp-carousel" role="group" aria-live="off" aria-roledescription="carousel" 
           data-cmp-delay="${config.imageAutoplayDuration}" data-placeholder-text="false" data-loop-slides="true">
        <div class="cmp-carousel__content">
          <div class="swiper swiper-initialized swiper-horizontal swiper-watch-progress swiper-backface-hidden is-autoplay-enabled">
            <div class="swiper-wrapper" aria-live="off">
              ${slidesHTML}
            </div>
            <span class="swiper-notification" aria-live="assertive" aria-atomic="true"></span>
          </div>
          
          <div class="cmp-carousel__footer">
            <div class="cmp-carousel__indicators-group">
              <ol class="cmp-carousel__indicators swiper-pagination swiper-pagination-clickable swiper-pagination-bullets swiper-pagination-horizontal" 
                  role="tablist" aria-label="Choose a slide to display">
                ${indicatorsHTML}
              </ol>
              <button class="carousel-autoplay-toggle" aria-label="Pause"></button>
            </div>
            <div class="cmp-carousel__media-controls">
              <button class="cmp-carousel__media-control cmp-carousel__media-control--play-pause" 
                      aria-label="Play ${config.slides[0]?.subtitle || 'media'}"></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Replace block content
  block.innerHTML = carouselHTML;
  
  // Initialize carousel functionality
  initializeSwiper(block, config);

  // Add hero banner click functionality (from original hero-banner.js)
  const heroBanners = block.querySelectorAll('.hero-banner');
  heroBanners.forEach((heroBanner) => {
    const ctaButton = heroBanner.querySelector('.cta-button');
    if (ctaButton) {
      heroBanner.addEventListener('click', function() {
        ctaButton.click();
      });
    }
  });
}
