const skillIndex = document.querySelector('.skill-index');
const skillFilter = skillIndex.querySelector('.skill-filter');
const skillStatus = skillIndex.querySelector('.skill-status');
const skillResults = skillIndex.querySelector('.skill-results');

async function loadWork(path, source) {
  const url = new URL(path, document.baseURI);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${url.pathname}`);
  const page = new DOMParser().parseFromString(await response.text(), 'text/html');

  return Array.from(page.querySelectorAll('[data-evidence]'), (entry) => {
    const title = entry.querySelector('[data-work-title], h2, h3');
    return {
      title: title.textContent.trim(),
      source,
      href: new URL(`#${entry.id}`, url),
      evidence: entry.dataset.evidence,
      skills: new Set(Array.from(entry.querySelectorAll('[data-skill]'), (tag) => tag.textContent.trim())),
    };
  });
}

function renderResults(skill, matches) {
  for (const button of skillFilter.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.skill === skill));
  }
  skillStatus.textContent = `${matches.length} ${matches.length === 1 ? 'example' : 'examples'} for ${skill}`;
  skillResults.replaceChildren(...matches.map((work) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = work.href;
    link.textContent = work.title;
    const description = document.createElement('p');
    description.textContent = work.evidence;
    const source = document.createElement('span');
    source.className = 'eyebrow';
    source.textContent = work.source;
    item.append(source, link, description);
    return item;
  }));
}

async function showSkillIndex() {
  const pages = await Promise.allSettled([
    loadWork('research/', 'Research'),
    loadWork('cv/', 'Experience'),
  ]);
  const examples = new Map();
  for (const page of pages) {
    if (page.status !== 'fulfilled') continue;
    for (const entry of page.value) {
      for (const skill of entry.skills) {
        if (!examples.has(skill)) examples.set(skill, []);
        examples.get(skill).push(entry);
      }
    }
  }

  const featured = ['Scientific ML', 'Python', 'C++', 'Model evaluation', 'Numerical methods', 'GPU computing'];
  const skills = [...new Set([...featured, ...[...examples.keys()].sort((a, b) => a.localeCompare(b))])]
    .filter((skill) => examples.has(skill));
  if (!skills.length) return;

  for (const skill of skills) {
    const matches = examples.get(skill);
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.skill = skill;
    button.textContent = `${skill} · ${matches.length}`;
    button.addEventListener('click', () => renderResults(skill, matches));
    skillFilter.append(button);
  }
  renderResults(skills[0], examples.get(skills[0]));
  skillIndex.hidden = false;
}

showSkillIndex();
