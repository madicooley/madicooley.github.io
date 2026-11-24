const dismissClass = 'target-highlight-dismissed';

window.addEventListener('hashchange', () => {
  document.documentElement.classList.remove(dismissClass);
});

document.addEventListener('click', (event) => {
  const target = document.querySelector('.paper:target, #presentations li:target, .publication-evidence li:target, .cv-page [data-work]:target');
  if (!target || target.contains(event.target)) return;

  const link = event.target.closest('a[href]');
  if (link?.href === window.location.href) {
    document.documentElement.classList.remove(dismissClass);
    return;
  }

  document.documentElement.classList.add(dismissClass);
});

const sourceSkill = new URLSearchParams(window.location.search).get('fromSkill');
if (sourceSkill) {
  const returnUrl = new URL('../#skills', document.baseURI);
  returnUrl.searchParams.set('skill', sourceSkill);
  const returnLink = document.createElement('a');
  returnLink.className = 'skill-return';
  returnLink.href = returnUrl;
  returnLink.textContent = 'Back to Skills in practice';

  function placeReturnLink() {
    returnLink.remove();
    const target = document.getElementById(window.location.hash.slice(1));
    if (!target) return;

    const destination = target.matches('.paper, .cv-role')
      ? target.querySelector(':scope > div:last-child') ?? target
      : target;
    destination.append(returnLink);
  }

  window.addEventListener('hashchange', placeReturnLink);
  placeReturnLink();
}
