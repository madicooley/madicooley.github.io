// "Viewing as" lenses. A lens changes the order and emphasis of the site for one kind of role.
// It never hides anything. The active lens lives in the address as ?focus=<id>, and links
// between pages keep it, so a link like madicooley.github.io/?focus=sciml stays focused.
//
// Each lens lists:
//   label  – button text on the home page
//   skills – shown first, in this order, in the skills explorer's "Most relevant" row.
//            Names must match the skill names in skills.js and the evidence tags.
//   work   – IDs of articles on the Research and Projects pages, moved to the top in this order.
const LENSES = [
  {
    id: 'sciml',
    label: 'Scientific ML',
    skills: [
      'Physics-informed neural networks', 'Neural operators', 'Surrogate modeling', 'Gaussian processes',
      'PDE approximation', 'Hybrid neural–numerical methods', 'Spectral methods', 'Numerical simulation',
      'Semiconductor device simulation (Synopsys)', 'Analysis of experimental measurements',
    ],
    work: [
      'hirefpou', 'panns', 'hyrespinns', 'fourier', 'gaussian-processes',
      'materials-modeling', 'semiconductor-device-simulation', 'dissertation-talk',
    ],
  },
  {
    id: 'applied',
    label: 'Applied data science',
    skills: [
      'Predictive modeling', 'Data cleaning & preprocessing', 'Error analysis', 'Analysis of experimental measurements',
      'Supervised learning', 'Regression', 'Model evaluation', 'Dataset construction',
      'Train/validation/test splits', 'Data visualization', 'Python',
    ],
    work: ['self-labeled-data', 'materials-modeling'],
  },
  {
    id: 'research',
    label: 'ML research',
    skills: [
      'Neural network architecture design', 'Mixture-of-experts models', 'Benchmarking & baseline comparisons',
      'Ablation studies', 'Model interpretability', 'Hyperparameter studies', 'Computational experiment design',
      'Model evaluation', 'Scientific writing', 'Technical presentations',
    ],
    work: [
      'hirefpou', 'hyrespinns', 'panns', 'fourier', 'gaussian-processes', 'self-labeled-data', 'gene-modules',
      'dissertation-talk', 'gene-module-talk', 'structural-rounding',
    ],
  },
  {
    id: 'systems',
    label: 'ML systems',
    skills: [
      'C++', 'Automatic differentiation', 'PyTorch', 'GPU computing', 'High-performance computing (HPC)',
      'Slurm', 'Batch job scheduling', 'Linux', 'Reproducible training & evaluation pipelines',
      'Computational performance evaluation',
    ],
    work: ['fourier', 'panns', 'structural-rounding'],
  },
];

window.siteLens = (() => {
  const param = 'focus';
  const byId = new Map(LENSES.map((lens) => [lens.id, lens]));
  let current = byId.get(new URLSearchParams(window.location.search).get(param)) ?? null;

  // Keep the lens on links to the site's own pages (not images, files, or other sites).
  function tagLink(link) {
    const raw = link.getAttribute('href');
    if (!raw || raw.startsWith('#')) return; // Same-page links already keep the current address.
    const url = new URL(link.href);
    if (url.origin !== window.location.origin || !/(\/|\.html)$/.test(url.pathname)) return;
    if (current) url.searchParams.set(param, current.id);
    else url.searchParams.delete(param);
    if (url.href !== link.href) link.href = url.href;
  }
  const tagLinks = (root) => root.querySelectorAll?.('a[href]').forEach(tagLink);

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches('a[href]')) tagLink(node);
        tagLinks(node);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Research and Projects: move matching work to the top of each list and outline it.
  const originalOrder = new Map();
  function orderWork() {
    let moved = false;
    for (const list of document.querySelectorAll('.paper-list')) {
      if (!originalOrder.has(list)) originalOrder.set(list, [...list.querySelectorAll(':scope > article.paper[id]')]);
      const items = originalOrder.get(list);
      if (!items.length) continue;
      const rank = (item) => current?.work.indexOf(item.id) ?? -1;
      const matched = items.filter((item) => rank(item) >= 0).sort((a, b) => rank(a) - rank(b));
      const sorted = [...matched, ...items.filter((item) => rank(item) < 0)];
      for (const item of items) item.classList.toggle('lens-match', rank(item) >= 0);
      const now = [...list.querySelectorAll(':scope > article.paper[id]')];
      if (sorted.some((item, index) => item !== now[index])) {
        list.append(...sorted);
        moved = true;
      }
    }
    return moved;
  }

  // Home: the "Viewing as" buttons.
  const bar = document.getElementById('lens-bar');
  const announcer = document.createElement('span');
  announcer.className = 'visually-hidden';
  announcer.setAttribute('role', 'status');

  if (bar) {
    const label = document.createElement('span');
    label.className = 'lens-label';
    label.id = 'lens-label';
    label.textContent = 'Show my most relevant work for:';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-labelledby', label.id);
    bar.append(label);
    for (const lens of [null, ...LENSES]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.lens = lens?.id ?? '';
      button.textContent = lens?.label ?? 'All roles';
      button.addEventListener('click', () => setLens(lens?.id ?? null));
      bar.append(button);
    }
    const hint = document.createElement('p');
    hint.className = 'lens-hint';
    hint.id = 'lens-hint';
    hint.textContent = 'Reorders the site and pulls the matching projects and skills to the top.';
    bar.setAttribute('aria-describedby', hint.id);
    bar.append(hint, announcer);
    bar.hidden = false;
  }

  // A "change view" dropdown: <details class="lens-menu"><summary>…</summary><div class="lens-menu-panel"></div></details>.
  // Used beside the key skills on the home page and in the notice on Research and Projects.
  function attachMenu(menu) {
    const panel = menu.querySelector('.lens-menu-panel');
    for (const lens of [null, ...LENSES]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.lens = lens?.id ?? '';
      button.textContent = lens?.label ?? 'All roles';
      button.addEventListener('click', () => {
        menu.open = false;
        setLens(lens?.id ?? null);
      });
      panel.append(button);
    }
    const markCurrent = () => {
      for (const button of panel.querySelectorAll('button')) {
        button.setAttribute('aria-pressed', String(button.dataset.lens === (current?.id ?? '')));
      }
    };
    markCurrent();
    document.addEventListener('lenschange', markCurrent);
    // Close when clicking elsewhere or pressing Escape.
    document.addEventListener('click', (event) => {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
    menu.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !menu.open) return;
      menu.open = false;
      menu.querySelector('summary').focus();
    });
  }

  // Research and Projects: say how the work is ordered, with a menu to change it.
  const hasWorkLists = document.querySelector('.paper-list article.paper[id]');
  const notice = document.createElement('div');
  notice.className = 'lens-notice';
  const noticeText = document.createElement('p');
  const noticeMenu = document.createElement('details');
  noticeMenu.className = 'lens-menu';
  noticeMenu.innerHTML = '<summary>change view</summary><div class="lens-menu-panel" role="group" aria-label="Choose a view"></div>';
  notice.append(noticeText, noticeMenu);
  if (hasWorkLists) {
    if (!bar) notice.append(announcer);
    document.querySelector('.page-intro')?.after(notice);
  }

  function render() {
    if (bar) {
      for (const button of bar.querySelectorAll('button')) {
        button.setAttribute('aria-pressed', String(button.dataset.lens === (current?.id ?? '')));
      }
    }
    if (hasWorkLists) {
      noticeText.replaceChildren(...(current
        ? ['Viewing as ', Object.assign(document.createElement('strong'), { textContent: current.label }),
          '. Related work is listed first and outlined. Nothing is hidden.']
        : ['Viewing ', Object.assign(document.createElement('strong'), { textContent: 'All' }), ' work in the default order.']));
    }
    tagLinks(document);
    return orderWork();
  }

  function setLens(id) {
    current = byId.get(id) ?? null;
    const url = new URL(window.location.href);
    if (current) url.searchParams.set(param, current.id);
    else url.searchParams.delete(param);
    history.replaceState(history.state, '', url);
    render();
    announcer.textContent = current ? `Viewing as ${current.label}` : 'Viewing all work';
    document.dispatchEvent(new CustomEvent('lenschange', { detail: current }));
  }

  if (hasWorkLists) attachMenu(noticeMenu);

  // On first load, keep a linked item (#hash) in view after moving things around.
  if (render() && window.location.hash) {
    document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
  }

  return { lenses: LENSES, get current() { return current; }, set: setLens, attachMenu };
})();
