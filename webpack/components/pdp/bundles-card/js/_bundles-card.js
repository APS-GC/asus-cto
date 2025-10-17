document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.select-cta').forEach((button) => {
    button.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  });
});
