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
