import { SortDropdownManager } from '../../product-sidebar/js/_product-sidebar';
import { fetchData } from '../../../site/scripts/_api';

let newsListings = [];

async function fetchListings() {
  try {
    const data = await fetchData(`news-listings.json`);
    return data;
  } catch (err) {
    console.error('Error loading news:', err);
    return [];
  }
}

async function loadListings() {
  const articleContainer = document.querySelector('#cmp-articles-list');
  const articleCount = document.querySelector('#article-count');
  if (!articleContainer) return;
  articleContainer.innerHTML = '';
  newsListings = await fetchListings();
  newsListings.forEach((listing, index) => {
    articleContainer.insertAdjacentHTML('beforeend', renderListing(listing, index));
  });
  articleCount.innerHTML = `${newsListings.length} News & Articles`;
}

function renderListing(listing, index) {
  const { id, image, link, alt, date, title, description } = listing;
  if (index < 2) {
    console.log(index);
    return `
      <div class="layout-grid__col layout-grid__col--span-6 layout-grid__col--tab-span-12">
        <a class="cmp-article-card" href=${link} aria-label="Read article: ${title}">
          <div class="cmp-article-card__image cmp-image">
            <img class="cmp-image__image" src="${image}" alt="${alt}" loading="lazy" />
          </div>
          <div class="cmp-article-card__content">
            <p class="cmp-article-card__date">
              <time datetime="2025-02-10">${date}</time>
            </p>
            <h3 class="cmp-article-card__title">${title}</h3>
            <div class="cmp-article-card__desc">${description}</div>
          </div>
        </a>
      </div>
    `;
  } else if (index >= 2 && index < 8) {
    console.log(index);
    return `
      <div class="layout-grid__col layout-grid__col--span-4 layout-grid__col--xl-span-6 layout-grid__col--tab-span-12">
        <a class="cmp-article-card" href=${link} aria-label="Read article: ${title}">
          <div class="cmp-article-card__image cmp-image">
            <img class="cmp-image__image" src="${image}" alt="${alt}" loading="lazy" />
          </div>
          <div class="cmp-article-card__content">
            <p class="cmp-article-card__date">
              <time datetime="2025-02-10">${date}</time>
            </p>
            <h3 class="cmp-article-card__title">${title}</h3>
            <div class="cmp-article-card__desc">${description}</div>
          </div>
        </a>
      </div>
    `;
  } else {
    console.log(index);
    return `
      <div class="cmp-news-articles__additional-articles layout-grid__col--span-4 layout-grid__col--xl-span-6 layout-grid__col--tab-span-12" aria-hidden="true">
        <a class="cmp-article-card" href=${link} aria-label="Read article: ${title}">
          <div class="cmp-article-card__image cmp-image">
            <img class="cmp-image__image" src="${image}" alt="${alt}" loading="lazy" />
          </div>
          <div class="cmp-article-card__content">
            <p class="cmp-article-card__date">
              <time datetime="2025-02-10">${date}</time>
            </p>
            <h3 class="cmp-article-card__title">${title}</h3>
            <div class="cmp-article-card__desc">${description}</div>
          </div>
        </a>
      </div>
    `;
  }
}

function toggleContent(button) {
  // get all additional articles
  const contentItems = document.querySelectorAll('.cmp-news-articles__additional-articles');
  if (!contentItems.length) return;

  const buttonText = button.querySelector('.button-text');
  const icon = button.querySelector('.icon');
  const isExpanded = button.getAttribute('aria-expanded') === 'true';

  button.setAttribute('aria-expanded', !isExpanded);

  // show/hide articles
  contentItems.forEach((item) => {
    item.style.display = isExpanded ? 'none' : ''; // hide or show
    item.setAttribute('aria-hidden', isExpanded ? 'true' : 'false');
  });

  // update button text and icon
  if (isExpanded) {
    buttonText.textContent = 'See More';
    icon.classList.remove('icon--arrow-top');
    icon.classList.add('icon--arrow-bottom');
  } else {
    buttonText.textContent = 'See Less';
    icon.classList.remove('icon--arrow-bottom');
    icon.classList.add('icon--arrow-top');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  loadListings();
  const sortElement = document.querySelector('#articles-sort-by');
  if (sortElement) {
    const sortManager = new SortDropdownManager(sortElement);
    sortManager.init();
    sortElement.value = 'newest';

    sortElement.addEventListener('change', (e) => {
      loadListings();
    });
  }
  const showMoreArticles = document.getElementsByClassName('cmp-show-more-articles-button');

  [...showMoreArticles].forEach((button) => {
    button.addEventListener('click', () => {
      toggleContent(button);
    });
  });
});
