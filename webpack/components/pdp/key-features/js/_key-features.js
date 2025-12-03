document.addEventListener('DOMContentLoaded', function () {
  const showMoreCtas = document.getElementsByClassName('cmp-show-more-button');

  [...showMoreCtas].forEach((button) => {
    button.addEventListener('click', () => {
      toggleContent(button);
    });
  });
});

function toggleContent(button) {
  const contentWrapper = document.getElementById(button.getAttribute('aria-controls'));

  if (!contentWrapper) {
    return;
  }

  const buttonText = button.querySelector('.button-text');
  const icon = button.querySelector('.icon');
  const isExpanded = button.getAttribute('aria-expanded') === 'true';

  // Toggle ARIA state
  button.setAttribute('aria-expanded', !isExpanded);

  // Toggle content visibility using hidden attribute (better for accessibility)
  if (isExpanded) {
    contentWrapper.setAttribute('aria-hidden', 'true');
    buttonText.textContent = 'Show more';
    icon.classList.remove('icon--arrow-top');
    icon.classList.add('icon--arrow-bottom');
  } else {
    contentWrapper.setAttribute('aria-hidden', 'false');
    buttonText.textContent = 'Show less';
    icon.classList.remove('icon--arrow-bottom');
    icon.classList.add('icon--arrow-top');
  }
}
