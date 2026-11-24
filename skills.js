const categories = [
  ['Programming & Scientific Software', [
    'Python', 'C++', 'JAX', 'PyTorch', 'TensorFlow', 'NumPy', 'SciPy', 'Automatic differentiation',
    'Graph algorithms', 'SQL (coursework)',
  ]],
  ['Machine Learning & Statistical Modeling', [
    'Predictive modeling', 'Surrogate modeling', 'Neural network architecture design',
    'Gaussian processes', 'Supervised learning', 'Regression', 'Physics-informed neural networks',
    'Neural operators', 'Mixture-of-experts models',
  ]],
  ['Numerical Methods & Simulation', [
    'Numerical simulation', 'PDE approximation', 'Spectral methods', 'Hybrid neural–numerical methods',
    'Fourier approximation', 'Polynomial approximation', 'Radial basis functions',
    'Partition-of-unity methods', 'Semiconductor device simulation (Synopsys)',
  ]],
  ['Data Preparation & Analysis', [
    'Synthetic data generation', 'Data cleaning & preprocessing', 'Feature engineering',
    'Spatiotemporal data processing', 'Dataset construction', 'Train/validation/test splits',
    'Analysis of experimental measurements', 'Data visualization',
  ]],
  ['Experiment Design & Model Evaluation', [
    'Model evaluation', 'Computational experiment design', 'Model validation', 'Benchmarking & baseline comparisons',
    'Ablation studies', 'Evaluation metric design', 'Hyperparameter studies', 'Error analysis',
    'Computational performance evaluation', 'Model interpretability',
  ]],
  ['Research Computing & ML Workflows', [
    'Reproducible training & evaluation pipelines', 'GPU computing', 'High-performance computing (HPC)',
    'Slurm', 'Linux', 'Experiment automation', 'Batch job scheduling',
  ]],
  ['Communication & Collaboration', [
    'Technical presentations', 'Scientific writing', 'Teaching & training',
    'Cross-disciplinary collaboration', 'Computing education',
  ]],
];

const skillIndex = document.querySelector('.skill-index');
const keyBlock = skillIndex.querySelector('#skill-key');
const keyTitle = skillIndex.querySelector('#skill-key-title');
const keyButtons = skillIndex.querySelector('#skill-key-buttons');
const lensMenu = skillIndex.querySelector('#skill-lens-menu');
const browseBlock = skillIndex.querySelector('#skill-browse');
const browseTitle = skillIndex.querySelector('#skill-browse-title');
const categoryButtons = skillIndex.querySelector('#skill-categories');
const subcategories = skillIndex.querySelector('#skill-subcategories');
const categoryTitle = skillIndex.querySelector('#skill-category-title');
const skillButtons = skillIndex.querySelector('#skill-buttons');
const output = skillIndex.querySelector('.skill-output');
const skillStatus = skillIndex.querySelector('.skill-status');
const skillResults = skillIndex.querySelector('.skill-results');

async function loadWork(path) {
  const url = new URL(path, document.baseURI);
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Unable to load ${url.pathname}`);
  const page = new DOMParser().parseFromString(await response.text(), 'text/html');

  return Array.from(page.querySelectorAll('[data-skill][data-contribution]'), (tag) => {
    const work = tag.closest('[data-work]');
    return {
      skill: tag.textContent.trim(),
      contribution: tag.dataset.contribution,
      description: tag.dataset.description,
      linkLabel: work.dataset.work,
      href: new URL(`#${tag.dataset.evidenceTarget ?? work.id}`, url),
    };
  });
}

function renderResults(skill, matches) {
  for (const button of skillIndex.querySelectorAll('button[data-skill]')) {
    button.setAttribute('aria-pressed', String(button.dataset.skill === skill));
  }
  skillStatus.textContent = '';
  if (skill) {
    skillStatus.textContent = matches.length
      ? `${matches.length} ${matches.length === 1 ? 'example' : 'examples'} for ${skill}`
      : `No examples linked for ${skill} yet.`;
  }
  skillResults.replaceChildren(...matches.map((work) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const destination = new URL(work.href);
    destination.searchParams.set('fromSkill', skill);
    link.href = destination;
    link.textContent = work.linkLabel;
    const contribution = document.createElement('strong');
    contribution.textContent = work.contribution;
    const description = document.createElement('p');
    description.textContent = work.description;
    item.append(contribution, description, link);
    return item;
  }));
}

// A skill toggle with its example count. `place` moves the results under the block it belongs to.
function makeSkillButton(skill, matches, place) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.skill = skill;
  button.textContent = skill;
  const count = document.createElement('span');
  count.className = 'skill-count';
  count.textContent = matches.length;
  count.setAttribute('aria-label', `${matches.length} ${matches.length === 1 ? 'example' : 'examples'}`);
  button.append(count);
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-controls', 'skill-results');
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') {
      renderResults(null, []);
    } else {
      place();
      renderResults(skill, matches);
    }
  });
  return button;
}

function collapseCategories() {
  for (const button of categoryButtons.querySelectorAll('button')) button.setAttribute('aria-expanded', 'false');
  skillButtons.replaceChildren();
  subcategories.hidden = true;
}

const showKeyResults = () => { collapseCategories(); keyBlock.append(output); };
const showBrowseResults = () => browseBlock.append(output);

function openCategory(button, category, skills, examples) {
  collapseCategories();
  button.setAttribute('aria-expanded', 'true');
  subcategories.hidden = false;
  categoryTitle.textContent = category;
  // Only list skills that link to at least one example.
  const available = skills.filter((name) => examples.has(name));
  skillButtons.replaceChildren(...available.map((skill) => makeSkillButton(skill, examples.get(skill), showBrowseResults)));
  showBrowseResults();
  renderResults(available[0] ?? null, available.length ? examples.get(available[0]) : []);
}

async function showSkillIndex() {
  const pages = await Promise.allSettled([
    loadWork('research/'),
    loadWork('cv/'),
  ]);
  const examples = new Map();
  for (const page of pages) {
    if (page.status !== 'fulfilled') continue;
    for (const entry of page.value) {
      if (!examples.has(entry.skill)) examples.set(entry.skill, []);
      examples.get(entry.skill).push(entry);
    }
  }

  buildCategories(examples, new URLSearchParams(window.location.search).get('skill'));
  document.addEventListener('lenschange', () => buildCategories(examples, null));
}

function buildCategories(examples, requestedSkill) {
  // With a lens active, its key skills get their own block above the category browser.
  const lens = window.siteLens?.current;
  const keySkills = lens ? lens.skills.filter((skill) => examples.has(skill)) : [];
  keyBlock.hidden = !keySkills.length;
  browseTitle.hidden = !keySkills.length;
  keyTitle.textContent = lens ? `Key skills for ${lens.label}` : '';
  keyButtons.replaceChildren(...keySkills.map((skill) => makeSkillButton(skill, examples.get(skill), showKeyResults)));

  categoryButtons.replaceChildren();
  collapseCategories();
  let restoredButton;
  for (const [category, skills] of categories) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = category;
    button.setAttribute('aria-controls', 'skill-subcategories');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-expanded') === 'true') {
        collapseCategories();
        renderResults(null, []);
      } else {
        openCategory(button, category, skills, examples);
      }
    });
    if (!restoredButton && skills.includes(requestedSkill)) restoredButton = button;
    categoryButtons.append(button);
  }
  skillIndex.hidden = false;

  const restoring = examples.has(requestedSkill);
  if (restoring && keySkills.includes(requestedSkill)) {
    showKeyResults();
    renderResults(requestedSkill, examples.get(requestedSkill));
  } else if (restoring && restoredButton) {
    restoredButton.click();
    renderResults(requestedSkill, examples.get(requestedSkill));
  } else if (keySkills.length) {
    showKeyResults();
    renderResults(keySkills[0], examples.get(keySkills[0]));
  } else {
    categoryButtons.querySelector('button')?.click();
  }
  if (restoring && window.location.hash === '#skills') document.getElementById('skills').scrollIntoView();
}

// "change view" opens a small menu of lenses right here, instead of sending visitors back up the page.
window.siteLens?.attachMenu(lensMenu);

showSkillIndex();
