const openPublicationPanel = new Map();

for (const card of document.querySelectorAll('#publicationdatabase .publication-content')) {
  const tabList = card.querySelector('.publication-tabs');
  const panels = [...card.querySelectorAll('.publication-panel')];
  const tabs = panels.map((panel) => {
    const heading = panel.querySelector('h3');
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `${panel.id}-tab`;
    tab.textContent = heading.textContent;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    heading.hidden = true;
    tabList.append(tab);
    return tab;
  });

  function selectTab(index) {
    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[position].hidden = !selected;
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(index));
    tab.addEventListener('keydown', (event) => {
      let next;
      switch (event.key) {
        case 'ArrowLeft': next = (index + tabs.length - 1) % tabs.length; break;
        case 'ArrowRight': next = (index + 1) % tabs.length; break;
        case 'Home': next = 0; break;
        case 'End': next = tabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      selectTab(next);
      tabs[next].focus();
    });
  });

  panels.forEach((panel, index) => openPublicationPanel.set(panel, () => selectTab(index)));
  selectTab(0);
  tabList.hidden = false;
}

function revealLinkedEvidence() {
  const target = document.getElementById(window.location.hash.slice(1));
  if (!target?.matches('.publication-evidence li')) return;

  const panel = target.closest('.publication-panel');
  const open = openPublicationPanel.get(panel);
  if (!open) return;

  open();
  const card = target.closest('.paper');
  const cardBounds = card.getBoundingClientRect();
  const cardMargin = parseFloat(getComputedStyle(card).scrollMarginBlockStart) || 0;
  const fits = cardBounds.height + cardMargin <= document.documentElement.clientHeight;
  // Give the browser's fragment scroll the same offset as our explicit scroll.
  target.style.scrollMarginBlockStart = fits
    ? `${target.getBoundingClientRect().top - cardBounds.top + cardMargin}px`
    : '';
  target.scrollIntoView({ block: fits ? 'start' : 'nearest' });
}

window.addEventListener('hashchange', revealLinkedEvidence);
window.addEventListener('load', revealLinkedEvidence, { once: true });
revealLinkedEvidence();
