/**
 * Hero Banner Block with Hero Banner Slides
 * Supports authorable hero banner slides with video/image media, CTA buttons, and autoplay settings
 */

import { moveInstrumentation, createOptimizedPicture, loadSwiper } from '../../scripts/scripts.js';
import { getBlockConfigs } from '../../scripts/configs.js';
import { isUniversalEditor } from '../../scripts/utils.js';
import { trackPromotionView, trackPromotionClick } from '../../scripts/google-data-layer.js';

// Configuration defaults
const DEFAULT_CONFIG = {
  imageAutoplayDuration: 5,
  videoAutoplayDuration: 8
};

const pubUrl = 'https://publish-p165753-e1767020.adobeaemcloud.com';
const CONFIG_ROWS_COUNT = 2; // Number of configuration rows before slides

/**
 * Parse hero banner slides from block data
 */
function parseHeroBannerSlides(block, slideStartIndex) {
  const slides = [];
  const rows = [...block.children];
  
  // Parse slide data from rows after configuration
  rows.slice(slideStartIndex).forEach((row, index) => {
    const cells = [...row.children];

    // Debug logging
    console.log(`Processing slide row ${index + slideStartIndex}:`, cells.length, 'cells');
    
    // Support both 7-cell (legacy) and 8-cell (new with mediaAlt) formats
    if (cells.length >= 7) {
      // Extract media information
      let media = '';
      let mediaAlt = '';
      let isVideo = false;

      // Check third cell for media content (index 2)
      const mediaCell = cells[2];
      if (mediaCell) {
        const picture = mediaCell.querySelector('picture');
        const link = mediaCell.querySelector('a');
        const textContent = mediaCell.textContent?.trim();

        if (picture) {
          // Extract image source from picture element
          const img = picture.querySelector('img');
          if (img) {
            media = img.src;
            mediaAlt = img.alt || '';
          }
        } else if (link) {
          // Video or image link
          media = link.textContent;
          isVideo = media.match(/\.(mp4|webm|ogg)$/i) !== null;
        } else if (textContent) {
          // Direct media path in text content
          media = textContent;
          isVideo = media.match(/\.(mp4|webm|ogg)$/i) !== null;
        }
      }

      // Support both 7-cell and 8-cell formats
      let ctaText, ctaLocation, ctaLink, openNewTab;
      if (cells.length >= 8) {
        // New 8-cell format: title, subtitle, media, mediaAlt, ctaText, ctaLocation, ctaLink, openNewTab
        mediaAlt = cells[3]?.textContent?.trim() || mediaAlt;
        ctaText = cells[4]?.textContent?.trim() || '';
        ctaLocation = cells[5]?.textContent?.trim() || 'center-center';
        
        const ctaLinkCell = cells[6];
        if (ctaLinkCell) {
          const linkElement = ctaLinkCell.querySelector('a');
          ctaLink = linkElement ? linkElement.href : (ctaLinkCell.textContent?.trim() || '');
        } else {
          ctaLink = '';
        }
        
        openNewTab = cells[7]?.textContent?.toLowerCase().includes('true') || false;
      } else {
        // Legacy 7-cell format: title, subtitle, media, ctaText, ctaLocation, ctaLink, openNewTab
        ctaText = cells[3]?.textContent?.trim() || '';
        ctaLocation = cells[4]?.textContent?.trim() || 'center-center';
        
        const ctaLinkCell = cells[5];
        if (ctaLinkCell) {
          const linkElement = ctaLinkCell.querySelector('a');
          ctaLink = linkElement ? linkElement.href : (ctaLinkCell.textContent?.trim() || '');
        } else {
          ctaLink = '';
        }
        
        openNewTab = cells[6]?.textContent?.toLowerCase().includes('true') || false;
      }

      const slide = {
        id: `slide-${index}`,
        title: cells[0]?.textContent?.trim() || '',
        subtitle: cells[1]?.textContent?.trim() || '',
        media: media,
        mediaAlt: mediaAlt || 'Hero Banner slide media',
        ctaText: ctaText,
        ctaLocation: ctaLocation,
        ctaLink: ctaLink,
        openNewTab: openNewTab,
        isVideo: isVideo,
        originalRow: row // Store reference to original row for instrumentation
      };

      // Debug logging
      console.log(`Created slide ${index}:`, slide);
      
      slides.push(slide);
    } else {
      // console.warn(`Row ${index + slideStartIndex} has insufficient cells (${cells.length}), skipping`);
    }
  });

  console.log('Parsed slides:', slides);
  return slides;
}

/**
 * Generate hero banner element for a slide
 */
function generateHeroBannerHTML(slide, config, index = 0) {
  const ctaLocationClass = `hero-content--${slide.ctaLocation.toLowerCase()}`;
  const autoplayDuration = slide.isVideo ? config.videoAutoplayDuration : config.imageAutoplayDuration;
  const isFirstSlide = index === 0; // Track first slide for LCP optimization

  // Create the main hero banner container
  const heroBanner = document.createElement('div');
  heroBanner.className = `hero-banner cmp-hero-banner ${ctaLocationClass}`;

  // Create media wrapper (video or image)
  if (slide.isVideo) {
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'hero-video-wrapper';

    const video = document.createElement('video');
    video.className = 'hero-video';
    video.loop = true;
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('data-autoplay-duration', autoplayDuration);

    const source = document.createElement('source');
    source.src = pubUrl + slide.media;
    source.type = 'video/mp4';

    video.appendChild(source);
    videoWrapper.appendChild(video);
    heroBanner.appendChild(videoWrapper);
  } else {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'hero-image-wrapper';

    // Use createOptimizedPicture for responsive images + WebP optimization
    const optimizedPicture = createOptimizedPicture(
      slide.media,
      slide.mediaAlt || 'Hero Banner',
      isFirstSlide, // eager=true for first slide (LCP optimization!)
      [
        { media: '(min-width: 1200px)', width: '750' },
        { media: '(min-width: 768px)', width: '1024' },
        { width: '640' },
      ], // eslint-disable-line comma-dangle
      isFirstSlide ? 'high' : null, // fetchpriority='high' for first slide (LCP boost!)
    );

    const img = optimizedPicture.querySelector('img');
    if (img) {
      img.className = 'hero-image';
    }

    imageWrapper.appendChild(optimizedPicture);
    heroBanner.appendChild(imageWrapper);
  }

  // Create hero content section
  const heroContent = document.createElement('div');
  heroContent.className = 'hero-content';

  if (slide.subtitle) {
    const productName = document.createElement('p');
    productName.className = 'product-name';
    productName.textContent = slide.subtitle;
    heroContent.appendChild(productName);
  }

  const headline = document.createElement('h2');
  headline.className = 'headline';
  headline.innerHTML = slide.title;
  heroContent.appendChild(headline);

  if (slide.ctaText && slide.ctaLink) {
    const ctaButton = document.createElement('a');
    ctaButton.href = slide.ctaLink;
    ctaButton.className = 'cta-button btn';
    ctaButton.textContent = slide.ctaText;
    ctaButton.setAttribute('aria-label', `${slide.ctaText} ${slide.subtitle}`);

    if (slide.openNewTab) {
      ctaButton.target = '_blank';
      ctaButton.rel = 'noopener noreferrer';
    }

    heroContent.appendChild(ctaButton);
  }

  heroBanner.appendChild(heroContent);
  return heroBanner;
}

/**
 * Manages video playback (play/pause) and handles promises to avoid uncaught errors.
 * @param {HTMLVideoElement} video - The video element to control.
 * @param {'play' | 'pause'} action - The action to perform.
 */
const manageVideoPlayback = (video, action) => {
  if (!video) {
    return;
  }

  let promise;
  if (action === 'play') {
    if (typeof video.play === 'function') {
      promise = video.play();
    }
  } else if (action === 'pause') {
    if (typeof video.pause === 'function') {
      promise = video.pause();
    }
  } else {
    // console.error('Invalid video action:', action);
    return;
  }

  if (promise !== undefined) { // eslint-disable-next-line no-unused-vars
    promise.catch((e) => { /* console.error(`Video ${action} failed:`, e) */ }); // eslint-disable-line no-unused-vars
  }
};

/**
 * Toggle video play/pause and manage paused class on media controls
 */
const toggleSliderVideo = (videoPlayPauseBtn) => {
  const activeSlide = document.querySelector('.swiper-slide-active');
  const activeSlideProdName = document.querySelector('.swiper-slide-active .product-name')?.textContent;

  const activeVideo = activeSlide?.querySelector('video');
  const mediaControls = document.querySelector('.cmp-hero-banner__media-controls');
  
  if (activeSlide && activeVideo) {
    if (activeVideo.paused) {
      manageVideoPlayback(activeVideo, 'play');
      videoPlayPauseBtn?.setAttribute('aria-label', `Pause ${activeSlideProdName}`);
      videoPlayPauseBtn?.setAttribute('title', `Pause ${activeSlideProdName}`);
      mediaControls?.classList.remove('paused');
    } else {
      manageVideoPlayback(activeVideo, 'pause');
      videoPlayPauseBtn?.setAttribute('aria-label', `Play ${activeSlideProdName}`);
      videoPlayPauseBtn?.setAttribute('title', `Play ${activeSlideProdName}`);
      mediaControls?.classList.add('paused');
    }
  }
};

/**
 * Initialize Swiper hero banner
 */
async function initializeSwiper(heroBannerElement, config) {
  const isUE = isUniversalEditor();

  // Force apply UE authoring class and attributes for CSS targeting
  if (isUE) {
    const heroBanner = heroBannerElement.querySelector('.cmp-hero-banner');
    if (heroBanner) {
      heroBanner.classList.add('ue-authoring');
      heroBanner.setAttribute('data-authoring', 'true');
      document.body.setAttribute('data-aue-behavior', 'true');
    }
  }

  // Load Swiper dynamically
  const setupSwiper = async () => {
    try {
      // Dynamically load Swiper library
      await loadSwiper();

      const swiperConfig = {
        loop: true, // Disable loop in UE authoring,
        autoplay: {
          delay: config.imageAutoplayDuration,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        },
        pagination: {
          el: '.cmp-hero-banner__indicators',
          clickable: true,
          bulletClass: 'cmp-hero-banner__indicator',
          bulletActiveClass: 'cmp-hero-banner__indicator--active',
          renderBullet: (index, className) => {
            return `<li class="${className}" aria-label="Go to slide ${index + 1}" role="tab"></li>`;
          },
        },
        navigation: {
          nextEl: '.cmp-hero-banner__action--next',
          prevEl: '.cmp-hero-banner__action--previous',
        },
        on: {
          slideChange() {
            // Update autoplay delay based on current slide media type
            const activeSlide = this.slides[this.activeIndex];
            const video = activeSlide?.querySelector('video');
            const newDelay = video ? config.videoAutoplayDuration : config.imageAutoplayDuration;

            // Remove paused class when switching slides
            const mediaControls = document.querySelector('.cmp-hero-banner__media-controls');
            const playPauseBtn = document.querySelector('.hero-banner-autoplay-toggle');
            mediaControls?.classList.remove('paused');
            this.el.classList.remove('is-autoplay-paused');
            
            if (playPauseBtn) {
              playPauseBtn.setAttribute('aria-label', 'play');
            }
            
            // Reset inactive bullets progress to 0
            this.pagination.bullets.forEach((bullet, idx) => {
              if (idx !== this.realIndex) {
                bullet.style.setProperty('--slide-progress', 0);
              }
            });
            
            if (this.autoplay && this.autoplay.stop) {
              this.autoplay.stop();
              this.params.autoplay.delay = newDelay;
              this.autoplay.start();
            }
          },
          slideChangeTransitionEnd() {
            const activeSlide = this.slides[this.activeIndex];
            const video = activeSlide?.querySelector('video');

            if (video) {
              manageVideoPlayback(video, 'play');
            }

            // Pause videos in other slides
            this.slides.forEach((slide, index) => {
              if (index !== this.activeIndex) {
                const slideVideo = slide.querySelector('video');
                if (slideVideo) {
                  manageVideoPlayback(slideVideo, 'pause');
                }
              }
            });
          },
          autoplayTimeLeft(swiper, time, progress) {
            const activeBullet = swiper.pagination.bullets[swiper.realIndex];
            if (activeBullet) {
              activeBullet.style.setProperty('--slide-progress', 1 - progress);
            }
          },
        },
      };

      const swiper = new window.Swiper(heroBannerElement.querySelector('.swiper'), swiperConfig);

      // Add media control functionality (only if not in UE)
      const playPauseBtn = heroBannerElement.querySelector('.cmp-hero-banner__media-control--play-pause');
      const autoplayToggle = heroBannerElement.querySelector('.hero-banner-autoplay-toggle');
      
      if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
          toggleSliderVideo(playPauseBtn);
        });
      }

      if (autoplayToggle) {
        autoplayToggle.addEventListener('click', () => {
          const activeSlide = document.querySelector('.swiper-slide-active');
          const activeVideo = activeSlide?.querySelector('video');
          const mediaControls = document.querySelector('.cmp-hero-banner__media-controls');
          const isVideoPaused = mediaControls?.classList.contains('paused');
          const isPaused = swiper.el.classList.contains('is-autoplay-paused');
          
          if (isPaused) {
            // Resume autoplay
            swiper.autoplay.resume();
            swiper.el.classList.remove('is-autoplay-paused');
            autoplayToggle.setAttribute('aria-label', 'Pause');
            heroBannerElement.setAttribute('aria-live', 'off');
            
            // Resume video if it wasn't manually paused
            if (!isVideoPaused && activeVideo) {
              manageVideoPlayback(activeVideo, 'play');
            }
          } else {
            // Pause autoplay
            swiper.autoplay.pause();
            swiper.el.classList.add('is-autoplay-paused');
            autoplayToggle.setAttribute('aria-label', 'Play');
            heroBannerElement.setAttribute('aria-live', 'polite');
            
            // Maintain video pause state when autoplay is paused
            if (isVideoPaused && activeVideo) {
              manageVideoPlayback(activeVideo, 'pause');
              mediaControls?.classList.add('paused');
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading or initializing Swiper hero banner:', error);
      // Fallback: show static content
      heroBannerElement.querySelector('.swiper')?.classList.add('swiper-fallback');
    }
  };

  // Delay initialization to ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setupSwiper());
  } else {
    // Additional delay for UE environments
    setTimeout(() => setupSwiper(), isUE ? 500 : 100);
  }
}

/**
 * Determine where slide rows start based on block structure
 */
function getSlideStartIndex(block) {
  const rows = [...block.children];
  
  // Check if first rows are single-cell config rows (Universal Editor format)
  if (rows.length >= CONFIG_ROWS_COUNT) {
    const firstRowCells = [...rows[0].children];
    const secondRowCells = [...rows[1].children];
    
    // If first 2 rows have exactly 1 cell each, they are config rows
    if (firstRowCells.length === 1 && secondRowCells.length === 1) {
      return CONFIG_ROWS_COUNT;
    }
    
    // Check for key-value config rows (2 cells each)
    if (firstRowCells.length === 2 && secondRowCells.length === 2) {
      return CONFIG_ROWS_COUNT;
    }
  }
  
  // Default: no config rows, slides start at 0
  return 0;
}

/**
 * Main decoration function
 */
export default async function decorate(block) {
  const rows = [...block.children];
  
  // Determine where slides start
  const slideStartIndex = getSlideStartIndex(block);
  
  // Create a temporary block element with only config rows for getBlockConfigs
  const configBlock = document.createElement('div');
  for (let i = 0; i < slideStartIndex && i < rows.length; i++) {
    configBlock.appendChild(rows[i].cloneNode(true));
  }
  
  // Get configuration using getBlockConfigs
  const config = await getBlockConfigs(configBlock, DEFAULT_CONFIG, 'hero-banner');
  
  // Convert seconds to milliseconds
  config.imageAutoplayDuration = (config.imageAutoplayDuration || DEFAULT_CONFIG.imageAutoplayDuration) * 1000;
  config.videoAutoplayDuration = (config.videoAutoplayDuration || DEFAULT_CONFIG.videoAutoplayDuration) * 1000;
  
  // Parse slides from remaining rows
  config.slides = parseHeroBannerSlides(block, slideStartIndex);
  
  console.log('Final config:', config);
  console.log('Slide start index:', slideStartIndex);
  console.log('Total slides:', config.slides.length);
  
  if (config.slides.length === 0) {
    // Fallback content if no slides configured
    block.innerHTML = '<div class="hero-banner-placeholder"><p>No hero banner slides configured</p></div>';
    return;
  }

  // Generate hero banner ID
  const heroBannerId = `hero-banner-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create wrapper elements
  const heroBannerWrapper = document.createElement('div');
  heroBannerWrapper.className = 'hero-banner panelcontainer';
  
  const heroBanner = document.createElement('div');
  heroBanner.id = heroBannerId;
  heroBanner.className = 'cmp-hero-banner';
  heroBanner.setAttribute('role', 'group');
  heroBanner.setAttribute('aria-live', 'off');
  heroBanner.setAttribute('aria-roledescription', 'hero-banner');
  heroBanner.setAttribute('data-cmp-delay', config.imageAutoplayDuration);
  heroBanner.setAttribute('data-placeholder-text', 'false');
  heroBanner.setAttribute('data-loop-slides', 'true');
  
  const heroBannerContent = document.createElement('div');
  heroBannerContent.className = 'cmp-hero-banner__content';
  
  const swiper = document.createElement('div');
  swiper.className = 'swiper swiper-initialized swiper-horizontal swiper-watch-progress swiper-backface-hidden is-autoplay-enabled';

  const swiperWrapper = document.createElement('div');
  swiperWrapper.className = 'swiper-wrapper';
  swiperWrapper.setAttribute('aria-live', 'off');

  // Generate slides as DOM elements with moveInstrumentation
  config.slides.forEach((slide, index) => {
    const slideElement = document.createElement('div');
    slideElement.id = `${heroBannerId}-item-${slide.id}-tabpanel`;
    slideElement.className = `cmp-hero-banner__item swiper-slide ${index === 0 ? 'cmp-hero-banner__item--active' : ''}`;
    slideElement.setAttribute('role', 'group');
    slideElement.setAttribute('aria-label', `Slide ${index + 1} of ${config.slides.length}`);
    slideElement.setAttribute('data-swiper-slide-index', index);
    slideElement.setAttribute('data-swiper-autoplay', slide.isVideo ? config.videoAutoplayDuration : config.imageAutoplayDuration);

    // Move instrumentation from original row to slide element
    if (slide.originalRow) {
      moveInstrumentation(slide.originalRow, slideElement);
    }

    // Generate and append hero banner
    const heroBannerSlide = generateHeroBannerHTML(slide, config, index);
    slideElement.appendChild(heroBannerSlide);
    
    swiperWrapper.appendChild(slideElement);
  });

  const swiperNotification = document.createElement('span');
  swiperNotification.className = 'swiper-notification';
  swiperNotification.setAttribute('aria-live', 'assertive');
  swiperNotification.setAttribute('aria-atomic', 'true');

  swiper.appendChild(swiperWrapper);
  swiper.appendChild(swiperNotification);
  heroBannerContent.appendChild(swiper);

  // Create hero banner footer
  const heroBannerFooter = document.createElement('div');
  heroBannerFooter.className = 'cmp-hero-banner__footer';

  // Create indicators group
  const indicatorsGroup = document.createElement('div');
  indicatorsGroup.className = 'cmp-hero-banner__indicators-group';

  // Create indicators list
  const indicatorsList = document.createElement('ol');
  indicatorsList.className = 'cmp-hero-banner__indicators';
  indicatorsList.setAttribute('role', 'tablist');
  indicatorsList.setAttribute('aria-label', 'Choose a slide to display');

  // Generate indicator elements
  config.slides.forEach((slide, index) => {
    const indicator = document.createElement('li');
    indicator.className = `cmp-hero-banner__indicator ${index === 0 ? 'cmp-hero-banner__indicator--active' : ''}`;
    indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
    indicator.setAttribute('role', 'tab');
    indicator.setAttribute('tabindex', '0');
    if (index === 0) {
      indicator.setAttribute('aria-current', 'true');
    }
    indicatorsList.appendChild(indicator);
  });

  // Create autoplay toggle button
  const autoplayToggle = document.createElement('button');
  autoplayToggle.className = 'hero-banner-autoplay-toggle';
  autoplayToggle.setAttribute('aria-label', 'Pause');

  indicatorsGroup.appendChild(indicatorsList);
  indicatorsGroup.appendChild(autoplayToggle);

  // Create media controls
  const mediaControls = document.createElement('div');
  mediaControls.className = 'cmp-hero-banner__media-controls';

  const playPauseBtn = document.createElement('button');
  playPauseBtn.className = 'cmp-hero-banner__media-control cmp-hero-banner__media-control--play-pause';
  playPauseBtn.setAttribute('aria-label', `Play ${config.slides[0]?.subtitle || 'media'}`);

  mediaControls.appendChild(playPauseBtn);

  heroBannerFooter.appendChild(indicatorsGroup);
  heroBannerFooter.appendChild(mediaControls);

  heroBannerContent.appendChild(heroBannerFooter);
  heroBanner.appendChild(heroBannerContent);
  heroBannerWrapper.appendChild(heroBanner);

  // Replace block content
  block.textContent = '';
  block.appendChild(heroBannerWrapper);

  // Initialize Swiper hero banner
  initializeSwiper(heroBannerWrapper, config);

  // Track promotionView for all visible slides
  setTimeout(() => {
    const promotions = config.slides.map((slide, index) => ({
      id: slide.media || `hero_banner_slide_${index + 1}`,
      name: slide.title || slide.subtitle || `Hero Banner ${index + 1}`,
      position: `hero_banner_1_${index + 1}`
    }));
    trackPromotionView(promotions);
  }, 500);

  // Track promotionClick when CTA is clicked
  block.querySelectorAll('.cta-button').forEach((ctaButton, index) => {
    ctaButton.addEventListener('click', (e) => {
      const slide = config.slides[index];
      
      // Only prevent default if it's a link (to allow time for tracking)
      if (ctaButton.href) {
        e.preventDefault();
        const targetUrl = ctaButton.href;
        const openInNewTab = ctaButton.target === '_blank';
        
        // Track the click
        trackPromotionClick({
          id: slide.media || `hero_banner_slide_${index + 1}`,
          name: slide.title || slide.subtitle || `Hero Banner ${index + 1}`,
          position: `hero_banner_1_${index + 1}`
        });
        
        // Navigate after a short delay to ensure tracking fires
        setTimeout(() => {
          if (openInNewTab) {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = targetUrl;
          }
        }, 10000);
      } else {
        // No href, just track
        trackPromotionClick({
          id: slide.media || `hero_banner_slide_${index + 1}`,
          name: slide.title || slide.subtitle || `Hero Banner ${index + 1}`,
          position: `hero_banner_1_${index + 1}`
        });
      }
    });
  });
}
