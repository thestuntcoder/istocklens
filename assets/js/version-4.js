(() => {
  const body = document.body;
  const toggle = document.querySelector('.v4-menu-button');
  const navigation = document.querySelector('#v4-navigation');
  if (toggle && navigation) {
    body.classList.add('v4-enhanced');
    toggle.hidden = false;
    const setMenu = (open, restoreFocus = false) => {
      toggle.setAttribute('aria-expanded', String(open));
      navigation.classList.toggle('is-open', open);
      if (restoreFocus) toggle.focus();
    };
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.v4-header')) setMenu(false);
    });
    matchMedia('(min-width: 960px)').addEventListener('change', () => setMenu(false));
  }

  document.querySelectorAll('[data-v4-notebook]').forEach((notebook) => {
    const tablist = notebook.querySelector('[data-v4-tablist]');
    const tabs = [...notebook.querySelectorAll('[data-v4-tab]')];
    const panels = [...notebook.querySelectorAll('[data-v4-panel]')];
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-orientation', 'horizontal');
    tabs.forEach((tab) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', `v4-panel-${tab.dataset.v4Tab}`);
    });
    panels.forEach((panel) => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `v4-tab-${panel.dataset.v4Panel}`);
      panel.tabIndex = 0;
    });
    const select = (index, focus = false) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (focus) tabs[index].focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        select(next, true);
      });
    });
    // Begin with the substantive model readout; the claim and checks remain explorable.
    select(1);
  });

  const checklist = document.querySelector('[data-v4-checklist]');
  const progress = document.querySelector('[data-v4-progress]');
  if (checklist && progress) {
    const inputs = [...checklist.querySelectorAll('input[type="checkbox"]')];
    const update = () => {
      const count = inputs.filter(input => input.checked).length;
      progress.textContent = `${count} of ${inputs.length} questions considered.${count === inputs.length ? ' Keep verifying.' : ''}`;
    };
    progress.hidden = false;
    checklist.addEventListener('change', update);
    update();
  }
})();
