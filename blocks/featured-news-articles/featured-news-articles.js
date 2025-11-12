import { createOptimizedPicture } from "../../scripts/aem.js";
import { moveInstrumentation } from "../../scripts/scripts.js";

export default function decorate(block) {
  // 获取block中的所有div元素
  const divs = block.querySelectorAll(":scope > div");

  // 提取配置参数
  const $title = divs[0]?.querySelector("div").querySelector("p");
  const title = $title ? $title.textContent?.trim() : "Featured News & Articles";

  const $seeAllText = divs[1]?.querySelector("div").querySelector("p");
  const seeAllText = $seeAllText
    ? $seeAllText.textContent?.trim()
    : "See all News & Articles";

  // 提取文章项数据（从第5个div开始是文章项）
  const articles = [];
  for (let i = 5; i < divs.length; i++) {
    const articleDiv = divs[i];
    const articleData = extractArticleData(articleDiv);
    if (articleData.title) {
      articles.push({
        ...articleData,
        originalElement: articleDiv,
      });
    }
  }

  // 创建外层section
  const section = document.createElement("section");
  section.className = "section-with-bottom-spacing";

  // 创建容器
  const container = document.createElement("div");
  container.className = "cmp-container container";
  section.appendChild(container);

  // 创建carousel容器
  const carouselContainer = document.createElement("div");
  carouselContainer.className = "carousel panelcontainer";
  container.appendChild(carouselContainer);

  // 创建section heading
  const sectionHeading = document.createElement("div");
  sectionHeading.className = "section-heading";
  sectionHeading.innerHTML = `
    <div class="section-heading__text-group">
      <h2 class="section-heading__title">${title}</h2>
    </div>
    <div class="section-heading__action-buttons cmp-carousel__actions">
      <button class="cmp-carousel__action cmp-carousel__action--previous">
        <span class="sr-only">Previous Button</span>
      </button>
      <button class="cmp-carousel__action cmp-carousel__action--next">
        <span class="sr-only">Next Button</span>
      </button>
    </div>
  `;
  carouselContainer.appendChild(sectionHeading);

  // 迁移title AEM属性
  if ($title) {
    const titleElement = sectionHeading.querySelector(
      ".section-heading__title"
    );
    moveInstrumentation($title, titleElement);
  }

  // 创建carousel主体
  const carousel = document.createElement("div");
  carousel.className = "cmp-carousel";
  carouselContainer.appendChild(carousel);

  // 创建carousel内容区域
  const carouselContent = document.createElement("div");
  carouselContent.className =
    "cmp-carousel__content cmp-carousel__content--overflow";
  carousel.appendChild(carouselContent);

  // 创建文章项
  articles.forEach((article, index) => {
    const carouselItem = document.createElement("div");
    carouselItem.className = "cmp-carousel__item";
    if (index === 0) {
      carouselItem.classList.add("cmp-carousel__item--active");
    }

    const articleCard = document.createElement("a");
    articleCard.className = "cmp-article-card";
    articleCard.href = article.articleLink;
    articleCard.setAttribute("aria-label", `Read article: ${article.title}`);

    if (article.articleOpenInNewTab) {
      articleCard.target = "_blank";
    }

    articleCard.innerHTML = `
      <div class="cmp-article-card__image cmp-image">
        <img class="cmp-image__image" src="${article.image}" alt="${
      article.imageAlt
    }" loading="lazy">
      </div>
      <div class="cmp-article-card__content">
        <p class="cmp-article-card__date">
          <time datetime="${article.postedDate.split("T")[0]}">${
      article.postedDate
    }</time>
        </p>
        <h3 class="cmp-article-card__title">${article.title}</h3>
        <div class="cmp-article-card__desc">${article.summary}</div>
      </div>
    `;

    carouselItem.appendChild(articleCard);
    carouselContent.appendChild(carouselItem);

    // 迁移文章项的AEM属性
    // if (article.originalElement) {
    //   moveInstrumentation(article.originalElement, carouselItem);
    // }
  });

  // 创建底部操作区域
  const sectionActions = document.createElement("div");
  sectionActions.className = "section-actions-container";

  const seeAllLink = document.createElement("a");
  seeAllLink.className = "section-actions-btn btn btn-link";
  seeAllLink.href = "/news-articles.html";
  seeAllLink.target = "_blank";
  const seeAllLinkText = document.createElement("span");
  seeAllLinkText.innerHTML = seeAllText;
  moveInstrumentation($seeAllText, seeAllLinkText);
  seeAllLink.innerHTML = `<img src="/icons/icon-arrow.svg" alt="Arrow Right">`;
  seeAllLink.insertBefore(seeAllLinkText,seeAllLink.firstChild);

  sectionActions.appendChild(seeAllLink);
  section.appendChild(sectionActions);

  // 清空block并添加新内容
  block.innerHTML = "";
  block.appendChild(section);

  // 迁移整个block的AEM属性到section
  // moveInstrumentation(block, section);
}

// 从文章div中提取数据
function extractArticleData(articleDiv) {
  const title = articleDiv.children[0].textContent?.trim() || "";
  const summary = articleDiv.children[1].textContent?.trim() || "";
  const image =
    articleDiv.children[2].querySelector("img")?.getAttribute("src") || "";
  const imageAlt = articleDiv.children[3].textContent?.trim() || "";
  const postedDate = articleDiv.children[4].textContent?.trim();
  const articleLink = articleDiv.children[5]
    .querySelector("div:has(a) a")
    ?.getAttribute("href");
  const articleOpenInNewTab =
    articleDiv.children[6].textContent?.trim().toLowerCase() === "true";

  return {
    title,
    summary,
    image,
    imageAlt,
    postedDate,
    articleLink,
    articleOpenInNewTab,
  };
}
