import { fetchData } from '../../../site/scripts/_api';
import { SortDropdownManager } from '../../product-sidebar/js/_product-sidebar';

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
  const hiddenArticleContainer = document.querySelector('#cmp-articles-list-hidden');
  const articleCount = document.querySelector('#article-count');
  if (!articleContainer) return;
  articleContainer.innerHTML = '';
  newsListings = await fetchListings();
  newsListings.forEach((listing, index) => {
    if (index < 8) {
      articleContainer.insertAdjacentHTML('beforeend', renderListing(listing, index));
    } else {
      hiddenArticleContainer.insertAdjacentHTML('beforeend', renderListing(listing, index));
    }
  });
  articleCount.innerHTML = `${newsListings.length} News & Articles`;
}

function formatDate(dateString) {
  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function renderListing(listing, index) {
  const { image, alt, date, title, link, description } = listing;
  let classNames = '';

  if (index < 2) {
    classNames = 'layout-grid__col layout-grid__col--span-6 layout-grid__col--md-span-12';
  } else {
    classNames =
      'cmp-news-articles__additional-articles layout-grid__col--span-4 layout-grid__col--xl-span-6 layout-grid__col--md-span-12';
  }

  return `<div class="${classNames}">
        <a class="cmp-article-card" href="${link}" aria-label="Read article: Published on ${date}, Title: ${title}, Description: ${description}">
          <div class="cmp-article-card__image cmp-image">
            <img class="cmp-image__image" src="${image}" alt="${alt}" fetchPriority="high" />
          </div>
          <div class="cmp-article-card__content">
            <p class="cmp-article-card__date">
              <time datetime="${formatDate(date)}">
                <span aria-hidden="true">${date}</span>
              </time>
            </p>
            <h3 class="cmp-article-card__title">${title}</h3>
            <div class="cmp-article-card__desc">${description}</div>
          </div>
        </a>
      </div>`;
}

function toggleContent(button) {
  // get all additional articles
  const srAnnouncement = document.getElementById('sr-expand-announcement');
  const contentItems = document.querySelectorAll('.cmp-news-articles__additional-articles');
  if (!contentItems.length) return;

  const hiddenArticleContainer = document.querySelector('#cmp-articles-list-hidden');
  const icon = button.querySelector('.icon');
  const isExpanded = hiddenArticleContainer.getAttribute('aria-hidden') === 'true';
  const buttonText = button.querySelector('.button-text');

  hiddenArticleContainer.setAttribute('aria-hidden', !isExpanded);

  // update button text and icon
  if (!isExpanded) {
    buttonText.textContent = 'See More';
    icon.classList.remove('icon--arrow-top');
    icon.classList.add('icon--arrow-bottom');
    srAnnouncement.textContent = 'Content collapsed';
    button.focus();
  } else {
    buttonText.textContent = 'See Less';
    icon.classList.remove('icon--arrow-bottom');
    icon.classList.add('icon--arrow-top');
    const firstVisibleArticle = hiddenArticleContainer.querySelector('.cmp-article-card');
    srAnnouncement.textContent = 'Content expanded';
    setTimeout(() => {
      firstVisibleArticle.focus();
    }, 200);
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
