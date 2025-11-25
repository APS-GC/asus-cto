import { isAuthorEnvironment, safeText } from "../../scripts/utils.js";
import { transferInstrumentation } from "../../scripts/utils.js";
const pubUrl = 'https://publish-p165753-e1767020.adobeaemcloud.com';
const itemsStartIndex = 4;
export default async function decorate(block) {
  const divs = block.children;
  const title = divs[0].textContent.trim() || "Our Advantages";
  const itemCount = Number(divs[1].textContent.trim()) || 3;
  const imageAutoplayDuration = Number(divs[2].textContent.trim()) || 5;
  const videoAutoplayDuration = Number(divs[3].textContent.trim()) || 1;
  const mockupContainer = document.createRange()
    .createContextualFragment(`<div class='container'>
    <div class="carousel panelcontainer">
      <div class="section-heading content-center">
        <div class="section-heading__text-group">
          <h2 class="section-heading__title">${title}</h2>
        </div>
      </div>
      <div
        class="cmp-carousel"
        role="group"
        aria-live="polite"
        aria-roledescription="carousel"
        data-cmp-is="our-advantages"
        data-cmp-delay="${imageAutoplayDuration * 1000}"
        data-carousel-effect="creative"
      >
        <div class="cmp-carousel__content">
        </div>

        <!-- Carousel actions - Previous/Next -->
        <div class="cmp-carousel__actions">
          <button class="cmp-carousel__action cmp-carousel__action--previous" type="button" aria-label="Previous">
            <span class="visually-hidden"></span>
          </button>
          <button class="cmp-carousel__action cmp-carousel__action--next" type="button" aria-label="Next">
            <span class="visually-hidden"></span>
          </button>
        </div>

        <!-- Pagination indicatoors -->
        <ol class="cmp-carousel__indicators" role="tablist" aria-label="Choose a slide to display"></ol>
      </div>
    </div>
  </div>`);
      
  const cardNodes = [];
  [...block.children].forEach((card, i) => {
    if (i > itemsStartIndex + itemCount - 1 || i < itemsStartIndex) return;
    const divs = card.querySelectorAll("div");
    const headline = safeText(divs.item(0));
    const details = safeText(divs.item(1));
    const video = safeText(divs.item(2));
    const imageAlt = safeText(divs.item(4));
    const buttonText = safeText(divs.item(5));
    const buttonTextLink = safeText(divs.item(6));
    const isTargetBlank = divs.item(7).textContent === "true" ? 1 : 0;
    const imageUrl = card.querySelector("img").src;
    const imageHtml = imageUrl?`<img src="${imageUrl}"  alt="${imageAlt}" class="cmp-advantage-card__image" loading="lazy" />`:'<div class="cmp-advantage-card__image" style="background: #efefef;color: #000;padding-top: 120px;font-size: 32px;">Please upload an image.</div>';
    const videoHtml = video ? `<video class="cmp-advantage-card__video" data-src="${pubUrl+video}" playsinline controls></video><button class="cmp-advantage-card__close-video" aria-label="Close video"></button>`:'';
    const mockup = document.createRange().createContextualFragment(`
          <div class="cmp-carousel__item"  data-url="${buttonTextLink}" data-video="${video}" data-blank="${isTargetBlank}" data-video-duration="${videoAutoplayDuration}">
            <div class="cmp-advantage-card">
              <div class="cmp-advantage-card__image-wrapper">
                ${imageHtml}
                ${videoHtml}
              </div>
              <div class="cmp-advantage-card__overlay">
                <div class="cmp-advantage-card__content">
                  <h3 class="cmp-advantage-card__title">${headline}</h3>
                  <p class="cmp-advantage-card__desc">
                    ${details}
                  </p>
                  <button class="cmp-advantage-card__btn btn">${buttonText}<img
                  alt="play-icon" src="${window.hlx.codeBasePath}/icons/icon-play-filled.svg" /></button>
                </div>
              </div>
            </div>
          </div>`);

    if (isAuthorEnvironment()) {
      transferInstrumentation(card, mockup);
    }
    cardNodes.push(mockup);
  });

  mockupContainer.querySelector(".cmp-carousel__content").append(...cardNodes);

  //move attr
  if (isAuthorEnvironment()) {
    //move title
    if (block.firstElementChild) {
      transferInstrumentation(
        block.firstElementChild,
        mockupContainer.querySelector(".section-heading")
      );
    }
  }

  block.innerHTML = "";
  block.append(mockupContainer);

  // trigger block
  await import("../../scripts/carousel.js");
  await import("./uifrontend_advantage-card.js");
 

  document.addEventListener(
    "eds-lazy-event",
    () => {
      const container = block.querySelector(".container");
      if (window.initializeSwiperOnAEMCarousel && container) {
        window.initializeSwiperOnAEMCarousel(container);
      }
    },
    { once: true }
  );
}
