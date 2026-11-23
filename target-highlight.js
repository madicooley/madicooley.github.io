const dismissClass = 'target-highlight-dismissed';

window.addEventListener('hashchange', () => {
  document.documentElement.classList.remove(dismissClass);
});

document.addEventListener('click', (event) => {
  const target = document.querySelector('.paper:target, #presentations li:target, .publication-evidence li:target');
  if (!target || target.contains(event.target)) return;

  const link = event.target.closest('a[href]');
  if (link?.href === window.location.href) {
    document.documentElement.classList.remove(dismissClass);
    return;
  }

  document.documentElement.classList.add(dismissClass);
});
