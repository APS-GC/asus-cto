import { isAuthorEnvironment, safeText } from '../../scripts/utils.js';
import {moveInstrumentation} from "../../scripts/scripts.js";

export default async function decorate(block) {

  await renderBlock(block);

  await import('./uifrontend_carousel.js');
  await import('./uifrontend_advantage-card.js');

  document.dispatchEvent(new Event('asus-cto-our-advantages'));
}

async function renderBlock(block) {

  const mockupContainer = document.createRange().createContextualFragment(`<div class='container'>
    <div class="carousel panelcontainer">
      <div class="section-heading content-center">
        <h2>${block.firstElementChild.textContent.trim()}</h2>
      </div>
      <div
          id="carousel-4e80c7e13a"
          class="cmp-carousel"
          role="group"
          aria-live="polite"
          aria-roledescription="carousel"
          data-cmp-is="carousel"
          data-cmp-delay="5000"
          data-carousel-effect="creative"
          data-prev-slide-message="Previous advantage"
          data-next-slide-message="Next advantage"
        >
        <div class="cmp-carousel__content">
        </div>

        <!-- Carousel actions - Previous/Next -->
          <div class="cmp-carousel__actions">
            <button class="cmp-carousel__action cmp-carousel__action--previous">
              <span class="visually-hidden"></span>
            </button>
            <button class="cmp-carousel__action cmp-carousel__action--next">
              <span class="visually-hidden"></span>
            </button>
          </div>

          <!-- Pagination indicatoors -->
          <ol class="cmp-carousel__indicators" role="tablist" aria-label="Choose a slide to display"></ol>
      </div>
    </div>
  </div>`);

  const cardNodes = [];
  [...block.children].forEach((card) => {
    const divs = card.querySelectorAll('div');
    const headline = safeText(divs.item(1));
    const details = safeText(divs.item(2));
    const navigate = safeText(divs.item(3));
    const mediaHTML = card.querySelector('picture')?.innerHTML ?? '';

    if (headline === '') {
      console.log('advantage card must have a headline');
      return;
    }

    const mockup = document.createRange().createContextualFragment(`
          <div class="cmp-carousel__item">
            <div class="cmp-advantage-card">
              <div class="cmp-advantage-card__image-wrapper">
                ${mediaHTML}
                <video class="cmp-advantage-card__video" playsinline controls>
                  <source
                    type="video/mp4">
                  Your browser does not support the video tag.
                </video>
              </div>
              <div class="cmp-advantage-card__overlay">
                <div class="cmp-advantage-card__content">
                  <h3 class="cmp-advantage-card__title">${headline}</h3>
                  <p class="cmp-advantage-card__desc">
                    ${details}
                  </p>
                  <button class="cmp-advantage-card__btn btn">${navigate}<img
                  alt="play-icon" /></button>
                </div>
              </div>
            </div>
          </div>`);

    if (isAuthorEnvironment()) {
      moveInstrumentation(card, mockup.firstElementChild);
    }
    cardNodes.push(mockup);
  });

  mockupContainer.querySelector('.cmp-carousel__content').append(...cardNodes);
  if (isAuthorEnvironment()) {
    moveInstrumentation(block, mockupContainer.firstElementChild);
  }
  block.replaceWith(mockupContainer);
}
