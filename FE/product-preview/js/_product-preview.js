import Swiper from 'swiper';
import { A11y, Navigation, Thumbs } from 'swiper/modules';

import 'a11y-dialog';
import { allowedProductRenderTypes } from '../../../site/scripts/_helpers';

class ProductPreview {
  constructor(container, product) {
    if (!container) {
      return;
    }

    this.container = container;
    this.product = product;
  }

  init() {
    if (!this.product) return;

    this._populatePreview();
  }

  _populatePreview() {
    const dialogContentEl = this.container.querySelector('.dialog-content');
    if (!dialogContentEl) return;

    const newContent = `
      ${this._renderTopbar(this.product)}
      <div class="cmp-product-preview__body">
        <div class="product-preview-card">
          <button class="close-icon" data-a11y-dialog-hide="product-preview-dialog" aria-label="Close the dialog"></button>
          <div class="product-preview-image-section">
            ${this._renderGallery(this.product)}
            ${this._renderFPS(this.product)}
          </div>
          ${this._renderOverviewSection(this.product)}
        </div>
      </div>
    `;

    dialogContentEl.innerHTML = newContent;
    this._initSwiperGallery();
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

  // Section specific render functions
  _renderTopbar(data) {
    return `
      <div class="cmp-product-preview__topbar">
        <div class="cmp-product-preview__topbar-left">
          ${data.purchaseLimit ? `<p class="cmp-product-preview__purchase-limit">${data.purchaseLimit}</p>` : ''}
          ${data.shippingInfo ? `<p class="cmp-product-preview__shipping-info">${data.shippingInfo}</p>` : ''}
        </div>

        <div class="cmp-product-preview__topbar-right">
          ${this._renderPriceSection(data)}
          <div class="cmp-product-preview__action-buttons">
            ${data.isBuyable ? `<button class="btn">Add to Cart</button>` : ''}
            <button class="btn btn-outline">View Details</button>
          </div>
        </div>
      </div>
    `;
  }

  _renderPriceSection(data) {
    return `
      <div class="cmp-product-preview__price-group">
        ${data.price ? `<div class="cmp-product-preview__price-final">$${data.price}</div>` : ''}
        <div class="cmp-product-preview__price-meta">
          ${data.originalPrice ? `<span class="cmp-product-preview__price-old">$${data.originalPrice}</span>` : ''}
          ${data.discount ? `<span class="cmp-product-preview__price-save">Save $${data.discount}</span>` : ''}
        </div>
        ${
          data.installment
            ? `
          <div class="cmp-product-preview__installment">
            Starting at $${data.installment.startingAt} with
            <img src="${data.installment.providerImage}" alt="${data.installment.providerName}">
            ${data.installment.tooltip}
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  _renderGallery(data) {
    let images = data.images;
    if (!images) {
      images = [
        {
          image: data.image,
          thumbnail: data.image,
          title: data.name,
        },
      ];
    }

    return `
      <div class="product-gallery">
        <div class="swiper product-gallery__main-carousel">
          <div class="swiper-wrapper">
            ${images
              .map(
                (img, idx) => `
              <div class="carousel__item swiper-slide">
                <img src="${img.image}" alt="${img.title}" class="gallery-main-image" data-gallery-index="${idx}">
              </div>
            `,
              )
              .join('')}
          </div>
        </div>

        <div class="product-gallery__thumbs-carousel-wrapper">
          <div class="swiper product-gallery__thumbs-carousel">
            <div class="swiper-wrapper">
              ${images
                .map(
                  (img, idx) => `
                <div class="carousel__item swiper-slide">
                  <img src="${img.thumbnail}" alt="${img.title} Thumbnail" class="gallery-thumb-image" data-gallery-index="${idx}">
                </div>
              `,
                )
                .join('')}
            </div>
          </div>
          <div class="carousel__actions">
            <button class="carousel__action carousel__action--previous" aria-label="Previous image"><span class="icon icon--arrow-left"></span></button>
            <button class="carousel__action carousel__action--next" aria-label="Next image"><span class="icon icon--arrow-right"></span></button>
          </div>
        </div>
      </div>
    `;
  }

  _renderFPS(data) {
    const has1080p = data.fpsData?.some((g) => g.fps1080);
    const has1440p = data.fpsData?.some((g) => g.fps1440);
    const hasTimeSpyScore = data.timeSpyScore;

    // If no data is available, show empty state
    if (!has1080p && !has1440p && !hasTimeSpyScore) {
      return `<div class="fps-section" id="game-fps">
        <div class="fps-header-row">
          <span class="fps-title">Game Performance</span>
        </div>
        <div class="fps-tabs-wrapper">
          <div class="fps-scores-empty">
            Game FPS and Time Spy Score are currently unavailable
          </div>
        </div>
      </div>`;
    }

    // If no data is available for a specific resolution, show empty state
    const emptyFps = `<div class="fps-scores-empty">
        Game FPS for this setup and resolution isn’t available right now.<br/>
        We’re constantly uploading our data, so please check back soon!
      </div>`;

    return `
      <div class="fps-section" id="game-fps">
        <div class="fps-header-row">
          <span class="fps-title">Game Performance</span>
          <div class="fps-info-group">
            <button class="fps-info" data-a11y-dialog-show="fps-dialog" aria-label="View FPS Details">
              What is FPS? <span class="icon icon--plus"></span>
            </button>
          </div>
        </div>
        <div class="fps-tabs-wrapper" data-cmp-is="custom-tabs">
          <div class="cmp-tabs" data-style="solid">
            <ol role="tablist" class="cmp-tabs__tablist">
              <li role="tab" class="cmp-tabs__tab cmp-tabs__tab--active" aria-controls="preview-fps-1080p-tabpanel" aria-selected="true">1080p</li>
              <li role="tab" class="cmp-tabs__tab" aria-controls="preview-fps-1440p-tabpanel" aria-selected="false">1440p</li>
            </ol>

            <div id="preview-fps-1080p-tabpanel" class="cmp-tabs__tabpanel cmp-tabs__tabpanel--active" role="tabpanel" aria-hidden="false">
              ${
                has1080p
                  ? `<div class="fps-scores">
                    ${data.fpsData
                      .filter((g) => g.fps1080)
                      .map(
                        (g) => `
                      <div class="fps-item">
                        <img src="${g.image}" alt="${g.game}">
                        <span>${g.fps1080} FPS</span>
                      </div>
                    `,
                      )
                      .join('')}
                  </div>`
                  : emptyFps
              }
            </div>

            <div id="preview-fps-1440p-tabpanel" class="cmp-tabs__tabpanel" role="tabpanel" aria-hidden="true">
              ${
                has1440p
                  ? `<div class="fps-scores">
                    ${data.fpsData
                      .filter((g) => g.fps1440)
                      .map(
                        (g) => `
                      <div class="fps-item">
                        <img src="${g.image}" alt="${g.game}">
                        <span>${g.fps1440} FPS</span>
                      </div>
                    `,
                      )
                      .join('')}
                  </div>`
                  : emptyFps
              }
            </div>
          </div>
        </div>
        ${this._renderTimeSpyScore(data)}
      </div>
    `;
  }

  _renderTimeSpyScore(product) {
    if (!product.timeSpyScore) return '';

    const { score, level, source } = product.timeSpyScore;

    return `
      <div class="time-spy-score">
        <div class="time-spy-score-left">
          <div class="time-spy-score-label">
            <span class="label" aria-hidden="true">Time Spy Score</span>
            <button 
              type="button"
              class="time-spy-score-btn"
              data-a11y-dialog-show="time-spy-score-dialog"
              aria-label="View Time Spy Score Details"
              data-score="${score}"
              data-level="${level}"
            >
              <span class="icon icon--plus text-info"></span>
            </button>
          </div>
          <span class="score">${score}</span>
        </div>
        <div class="time-spy-score-right">
          <span class="data-from">Data from</span>
          <div class="data-source">
            <img src="${source.image}" alt="${source.name}">
            <button data-tooltip-trigger aria-describedby="preview-time-spy-tooltip" data-tooltip-position="bottom" class="btn btn-link" aria-label="3D Mark information">
              <span class="icon icon--info"></span>
            </button>
            <div id="preview-time-spy-tooltip" class="tooltip__content tooltip__content--theme-dark tooltip__content--size-small" role="tooltip">
              All FPS performance data presented are theoretical and may vary in real-world usage. The FPS data is based on third-party testing conducted by UL and is provided for reference purposes only. Actual performance may differ.
            </div>
          </div>
        </div>
      </div>`;
  }

  _renderFeatures(data) {
    if (!data.features) return '';
    return `
      <div class="divider"></div>
      <ul class="features">
        ${data.features
          .map(
            (f) => `
          <li><strong>${f.title}</strong><br><span>${f.description}</span></li>
        `,
          )
          .join('')}
      </ul>
    `;
  }

  _renderSpecs(data) {
    if (!data.specs) return '';
    return `
      <div class="divider"></div>
      <div class="spec-summary">
        <h3 class="spec-summary__heading">Spec Summary</h3>
        <ul class="spec-summary__list list-style-square">
          ${data.specs.map((s) => `<li>${s}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  _renderOverviewSection(data) {
    return `
      <div class="product-preview__overview-section">
        <div class="availability-tags">
          ${
            data.status
              ? data.status
                  .map(
                    (s, i) => `
            <span class="tag ${s.toLowerCase().replace(/\s+/g, '-')}">${s}</span>
            ${i < data.status.length - 1 ? '<span class="vertical-divider"></span>' : ''}
          `,
                  )
                  .join('')
              : ''
          }
        </div>

        <div id="preview-product-title">
          <h2 class="product-title">${data.name}</h2>
          <p class="product-model">Model: ${data.model}</p>
        </div>

        <div class="star-rating-wrapper">
          <div
            data-bv-show="inline_rating"
            data-bv-product-id="${data.bazaarvoiceProductId}"
            data-bv-redirect-url="pdp.html#product-reviews"
            data-bv-theme="light"
          ></div>
        </div>

        ${
          data.benchmarkGame && data.fps
            ? `
        <div class="game-title">
          <span>${data.benchmarkGame}</span>
          <a class="badge" href="#game-fps">FPS: ${data.fps}</a>
        </div>`
            : ''
        }

        <div class="compare-product">
          <input type="checkbox" class="compare-checkbox" id="compare-${data.id}" data-add-to-compare
            data-id="${data.id}" data-name="${data.name}" data-model="${data.model}"
            data-image="${data.image}" data-price="${data.price}" data-stars="${data.stars}"
            data-fps="${data.fps}" data-pdp-url="${data.customizeLink}" data-sku="${data.model}">
          <label for="compare-${data.id}">Compare</label>
        </div>

        ${this._renderFeatures(data)}
        ${this._renderSpecs(data)}
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const dialogEl = document.getElementById('product-preview-dialog');

  document.addEventListener('click', async (event) => {
    const previewBtn = event.target.closest('[data-a11y-dialog-show="product-preview-dialog"]');
    if (!previewBtn) return;

    const productId = previewBtn.dataset.productId;
    const productType = previewBtn.dataset.productType;

    if (!productId || !productType) return;

    // Check if the product render type is allowed
    if (!allowedProductRenderTypes.includes(productType)) return;

    const product = window.allProducts?.get(productType)?.get(productId);

    if (product) {
      const productPreview = new ProductPreview(dialogEl, product);
      productPreview.init();
    }
  });

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
