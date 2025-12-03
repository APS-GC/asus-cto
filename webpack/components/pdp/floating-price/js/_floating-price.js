document.addEventListener('DOMContentLoaded', () => {
  const accSingleTriggers = document.querySelectorAll('.hide-more-accordion-trigger');

  accSingleTriggers.forEach((trigger) => trigger.addEventListener('click', toggleAccordion));

  function toggleAccordion() {
    const items = document.querySelectorAll('.hide-more-item');
    const thisItem = this.parentNode;

    items.forEach((item) => {
      if (thisItem == item) {
        thisItem.classList.toggle('is-open');
        return;
      }
      item.classList.remove('is-open');
    });
  }
});

function handleStickyForFloatingAddtoCartWindow() {
  const div = document.querySelector('.cmp-floating-price');
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const atBottom = scrollTop + windowHeight >= documentHeight - 10;

  if (atBottom) {
    div.classList.add('relative');
  } else {
    div.classList.remove('relative');
  }
}

let timeout;
window.addEventListener('scroll', () => {
  clearTimeout(timeout);
  timeout = setTimeout(handleStickyForFloatingAddtoCartWindow, 50);
});

handleStickyForFloatingAddtoCartWindow();
