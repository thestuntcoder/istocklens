(() => {
  const toggle = document.querySelector('.menu-toggle, .v2-menu-toggle');
  const navigation = document.querySelector('#site-navigation');
  if (toggle && navigation) {
    document.documentElement.classList.add('nav-enhanced');
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
      if (!event.target.closest('.site-header, .v2-header')) setMenu(false);
    });
    matchMedia('(min-width: 1100px)').addEventListener('change', () => setMenu(false));
  }

  document.querySelectorAll('[data-tabs]').forEach((workbench) => {
    const tablist = workbench.querySelector('.tabs, [data-tablist]');
    const tabs = [...workbench.querySelectorAll('[data-tab]')];
    const panels = [...workbench.querySelectorAll('[data-panel]')];
    tablist.setAttribute('role', 'tablist');
    // V2 uses a vertical rail on desktop and horizontal tabs on phones.
    if (workbench.hasAttribute('data-vertical-tabs')) {
      const desktop = matchMedia('(min-width: 768px)');
      const orient = () => tablist.setAttribute('aria-orientation', desktop.matches ? 'vertical' : 'horizontal');
      desktop.addEventListener('change', orient);
      orient();
    }
    tabs.forEach((tab) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', `panel-${tab.dataset.tab}`);
    });
    panels.forEach((panel) => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `tab-${panel.dataset.panel}`);
      panel.tabIndex = 0;
    });
    const select = (index, moveFocus = false) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (moveFocus) tabs[index].focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', (event) => {
        let next;
        const vertical = tablist.getAttribute('aria-orientation') === 'vertical';
        if (event.key === 'ArrowRight' || (vertical && event.key === 'ArrowDown')) next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft' || (vertical && event.key === 'ArrowUp')) next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        select(next, true);
      });
    });
    select(0);
  });
})();
