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
const categoryButtons = skillIndex.querySelector('#skill-categories');
const subcategories = skillIndex.querySelector('#skill-subcategories');
const categoryTitle = skillIndex.querySelector('#skill-category-title');
const skillButtons = skillIndex.querySelector('#skill-buttons');
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
  for (const button of skillButtons.querySelectorAll('button')) {
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
    link.href = work.href;
    link.textContent = work.linkLabel;
    const contribution = document.createElement('strong');
    contribution.textContent = work.contribution;
    const description = document.createElement('p');
    description.textContent = work.description;
    item.append(contribution, description, link);
    return item;
  }));
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

  for (const [category, skills] of categories) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = category;
    button.setAttribute('aria-controls', 'skill-subcategories');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
      const opening = button.getAttribute('aria-expanded') === 'false';
      for (const categoryButton of categoryButtons.querySelectorAll('button')) {
        categoryButton.setAttribute('aria-expanded', String(opening && categoryButton === button));
      }
      renderResults(null, []);
      skillButtons.replaceChildren();
      subcategories.hidden = !opening;
      if (!opening) return;

      categoryTitle.textContent = category;
      // Only list skills that link to at least one example.
      for (const skill of skills.filter((name) => examples.has(name))) {
        const matches = examples.get(skill);
        const skillButton = document.createElement('button');
        skillButton.type = 'button';
        skillButton.dataset.skill = skill;
        skillButton.textContent = skill;
        const count = document.createElement('span');
        count.className = 'skill-count';
        count.textContent = matches.length;
        count.setAttribute('aria-label', `${matches.length} ${matches.length === 1 ? 'example' : 'examples'}`);
        skillButton.append(count);
        skillButton.setAttribute('aria-pressed', 'false');
        skillButton.setAttribute('aria-controls', 'skill-results');
        skillButton.addEventListener('click', () => {
          if (skillButton.getAttribute('aria-pressed') === 'true') {
            renderResults(null, []);
          } else {
            renderResults(skill, matches);
          }
        });
        skillButtons.append(skillButton);
      }
      const firstSkill = skills.find((skill) => examples.has(skill));
      if (firstSkill) renderResults(firstSkill, examples.get(firstSkill));
    });
    categoryButtons.append(button);
  }
  skillIndex.hidden = false;
  // Start with the first category open so visitors see examples right away.
  categoryButtons.querySelector('button')?.click();
}

showSkillIndex();
