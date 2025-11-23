import {
  transferInstrumentation,
  isAuthorEnvironment,
} from "../../scripts/utils.js";
import { loadSwiper } from '../../scripts/scripts.js';
const itemsStartIndex = 5;
export default async function decorate(block) {
  const divs = block.children;
  const itemCount = Number(divs[4].textContent.trim()) || 7;
  const mockupContainer = document.createRange().createContextualFragment(`
        <div class="cmp-container container">
          <div class="carousel panelcontainer">
            <div class="section-heading">
              <div class="section-heading__text-group">
                <h2 class="section-heading__title">${
                  divs[0].textContent.trim() || "Featured News Articles"
                }</h2>
              </div>
              <div class="section-heading__action-buttons cmp-carousel__actions">
                <button class="cmp-carousel__action cmp-carousel__action--previous">
                  <span class="sr-only">Previous Button</span>
                </button>
                <button class="cmp-carousel__action cmp-carousel__action--next">
                  <span class="sr-only">Previous Button</span>
                </button>
              </div>
            </div>

            <div class="cmp-carousel" role="group" aria-live="polite" aria-roledescription="carousel" data-cmp-is="carousel" data-cmp-delay="false" data-slides-per-view="auto" data-slides-per-view-tablet="3" data-slides-per-view-desktop="3" data-loop-slides="false">
              <div class="cmp-carousel__content cmp-carousel__content--overflow"></div>
            </div>
          </div>
        </div>
        <div class="section-actions-container">
          <a class="section-actions-btn btn btn-link" href="${divs[2].textContent.trim()}" target="${
    divs[3].textContent?.trim().toLowerCase() === "true" ? "_blank" : "_self"
  }">
            ${
              divs[1]?.textContent?.trim() || "See all News Articles"
            }<img src="${`${window.hlx.codeBasePath}/icons/icon-arrow.svg`}" alt="Arrow Right">
            </a>
        </div>`);

  const cardNodes = [];
  for (let i = itemsStartIndex; i < divs.length; i++) {
    if (i-itemsStartIndex > itemCount - 1) break;
    const subDivs = divs[i].children;
    const title = subDivs[0] ? subDivs[0].textContent?.trim() : "";
    const summary = subDivs[1] ? subDivs[1].textContent?.trim() : "";
    const image = subDivs[2]
      ? subDivs[2].querySelector("img")?.getAttribute("src")
      : "";
    const imageAlt = subDivs[3] ? subDivs[3].textContent?.trim() : "";
    const postedDate = subDivs[4] ? subDivs[4].textContent?.trim() : "";
    const articleLink = subDivs[5] ? subDivs[5].textContent?.trim() : "";
    const articleOpenInNewTab = subDivs[6]
      ? subDivs[6].textContent?.trim().toLowerCase() === "true"
      : false;

    const mockup = document.createRange().createContextualFragment(`
      <div class="cmp-carousel__item">
        <a class="cmp-article-card" href="${articleLink}" aria-label="Read article: ${title}" target="${
      articleOpenInNewTab ? "_blank" : "_self"
    }">
          <div class="cmp-article-card__image cmp-image">
            <img class="cmp-image__image" src="${image}" alt="${imageAlt}" loading="lazy">
          </div>

          <div class="cmp-article-card__content">
            <p class="cmp-article-card__date">
              <time datetime="${
                postedDate ? postedDate.replaceAll("/", "-") : ""
              }" aria-label="Date">
                <span aria-hidden="true">
                  ${postedDate ? transferDate(postedDate) : ""}
                </span>
              </time>
            </p>
            <h3 class="cmp-article-card__title">${title}</h3>
            <div class="cmp-article-card__desc">${summary}</div>
          </div>
        </a>
      </div>
    `);

    //move card box attr
    if (isAuthorEnvironment()) {
      transferInstrumentation(divs[i], mockup);
    }

    cardNodes.push(mockup);
  }

  mockupContainer.querySelector(".cmp-carousel__content").append(...cardNodes);

  //move attr
  if (isAuthorEnvironment()) {
    //move title
    if (divs[0]) {
      transferInstrumentation(
        divs[0],
        mockupContainer.querySelector(".section-heading__title")
      );
    }
    //move description
    if (divs[1]) {
      transferInstrumentation(
        divs[1],
        mockupContainer.querySelector(".section-actions-container")
      );
    }
  }

  block.innerHTML = "";
  block.append(mockupContainer);

  await loadSwiper();
  await import("../../scripts/carousel.js");

  if (window.initializeSwiperOnAEMCarousel) {
    window.initializeSwiperOnAEMCarousel(block.querySelector(".cmp-container"));
  }
}

//transfer date format
function transferDate(dateStr) {
  const date = new Date(dateStr);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return formattedDate;
}
