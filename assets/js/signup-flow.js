/* Original demo-only integration. Public test key: Stripe's MIT Elements examples:
 * https://github.com/stripe/elements-examples/blob/master/js/index.js
 * No tokenization, PaymentIntent, payment, account or email API is used here.
 */
(() => {
  'use strict';
  const dialog = document.querySelector('[data-signup-dialog]');
  const page = document.querySelector('[data-signup-page]');
  const host = page || dialog;
  if (!host || (dialog && typeof dialog.showModal !== 'function')) return;
  const flow = host.querySelector('[data-signup-flow]');
  const find = selector => flow.querySelector(selector);
  const form = find('form');
  const email = find('#sf-email');
  const next = find('[data-sf-next]');
  const back = find('[data-sf-back]');
  const status = find('[data-sf-payment-status]');
  const retry = find('[data-sf-retry]');
  const presetButton = find('[data-sf-preset]');
  const fields = find('[data-sf-elements]');
  const labels = ['Email', 'Experience', 'Research interests', 'Payment demo', 'Preview'];
  let step = 1, completed = false, preset = false, busy = false;
  let launcher, scrollPosition, bodyStyle, inertState = [];
  let generation = 0, elements = [], complete = {}, ready = new Set(), cardErrors = {};
  let cancelLoad = () => {}, finishTimer;
  const active = () => Boolean(page || dialog.open);
  const selected = name => find(`input[name="${name}"]:checked`)?.value;
  const error = (name, message, target) => {
    const node = find(`#sf-${name}-error`);
    node.textContent = message;
    node.hidden = !message;
    if (target) {
      target.setAttribute('aria-invalid', String(Boolean(message)));
      if (message) target.focus();
    }
  };
  const clearErrors = () => {
    for (const name of ['email', 'experience', 'region', 'payment']) error(name, '');
    flow.querySelectorAll('[aria-invalid]').forEach(node => node.removeAttribute('aria-invalid'));
  };
  const stopPayment = () => {
    generation++;
    cancelLoad();
    cancelLoad = () => {};
    clearTimeout(finishTimer);
    busy = false;
    next.disabled = false;
    elements.forEach(element => element.destroy());
    elements = [];
    complete = {};
    ready = new Set();
    cardErrors = {};
    fields.hidden = true;
  };
  const safeStep = requested => {
    if (requested > 1 && (!email.value.trim() || !email.validity.valid)) return 1;
    if (requested > 2 && !selected('experience')) return 2;
    if (requested > 3 && !selected('region')) return 3;
    if (requested > 4 && !completed) return 4;
    return requested;
  };
  const render = (requested, historyMode = 'push') => {
    const destination = safeStep(requested);
    if (step === 4 && destination !== 4) stopPayment();
    step = destination;
    clearErrors();
    flow.querySelectorAll('[data-sf-step]').forEach(section => { section.hidden = Number(section.dataset.sfStep) !== step; });
    find('.sf-progress').textContent = `Step ${step} of 5 · ${labels[step - 1]}`;
    find('[data-sf-track]').style.width = `${step * 20}%`;
    find('[data-sf-actions]').hidden = step === 5;
    back.hidden = step === 1;
    next.textContent = step === 4 ? 'Complete demo · No charge' : 'Continue';
    if (dialog) dialog.setAttribute('aria-labelledby', `sf-title-${step}`);
    if (page && historyMode !== 'none') {
      const url = `${location.pathname}?step=${step}`;
      history[historyMode === 'replace' ? 'replaceState' : 'pushState']({ signupStep: step }, '', url);
    }
    if (step === 5) {
      const values = { email: email.value.trim(), experience: selected('experience'), region: selected('region') };
      for (const [key, value] of Object.entries(values)) find(`[data-sf-summary="${key}"]`).textContent = value;
    }
    if (page) window.scrollTo({ top: 0, behavior: 'instant' });
    else dialog.scrollTop = 0;
    find(`#sf-title-${step}`).focus({ preventScroll: true });
    if (step === 4) startPayment();
  };

  // Cancellable loader: a late SDK/font/Element callback cannot mount a closed flow.
  const loadSDK = () => new Promise((resolve, reject) => {
    if (window.Stripe) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    let settled = false;
    const finish = failure => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.onload = script.onerror = null;
      if (failure) { script.remove(); reject(failure); } else resolve();
    };
    const timer = setTimeout(() => finish(new Error('Stripe timed out.')), 12000);
    cancelLoad = () => finish(new Error('Cancelled'));
    script.onload = () => finish(window.Stripe ? null : new Error('Stripe unavailable.'));
    script.onerror = () => finish(new Error('Stripe could not load.'));
    document.head.append(script);
  });
  // Elements cannot use parent @font-face declarations. Embed the existing local
  // licensed WOFF2 as a data URL; fall back to Arial if fetching it is unavailable.
  let fontPromise;
  const elementFont = () => {
    if (!fontPromise) {
      const plex = host.classList.contains('sf-theme-4') || document.body.classList.contains('sf-theme-4');
      const filename = plex ? 'ibm-plex-sans-latin.woff2' : 'manrope-latin.woff2';
      const cssURL = document.querySelector('link[rel="stylesheet"]').href;
      fontPromise = fetch(new URL(`../fonts/${filename}`, cssURL), { signal: AbortSignal.timeout(4000) })
        .then(response => { if (!response.ok) throw new Error('Font unavailable'); return response.arrayBuffer(); })
        .then(buffer => ({ family: plex ? 'IBM Plex Sans' : 'Manrope', src: `url(data:font/woff2;base64,${btoa(String.fromCharCode(...new Uint8Array(buffer)))})`, weight: '400' }))
        .catch(() => null);
    }
    return fontPromise;
  };
  async function startPayment() {
    stopPayment();
    const ticket = generation;
    const current = () => ticket === generation && active() && step === 4 && !preset;
    retry.hidden = true;
    find('[data-sf-preset-details]').hidden = !preset;
    presetButton.textContent = preset ? 'Use Stripe test fields instead' : 'Use a demo card';
    if (preset) { status.textContent = 'Demo card selected explicitly. No Stripe input needed.'; return; }
    status.textContent = 'Loading test card fields…';
    let mountTimer;
    const fail = () => {
      if (!current()) return;
      stopPayment();
      status.textContent = 'Stripe is unavailable. Retry, or explicitly choose the fictitious demo card. Nothing was processed.';
      retry.hidden = false;
    };
    try {
      await loadSDK();
      if (!current()) return;
      const font = await elementFont();
      if (!current()) return;
      const css = getComputedStyle(host);
      const stripe = window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');
      const group = stripe.elements(font ? { fonts: [font] } : {});
      const style = {
        base: { fontFamily: font ? `"${font.family}", Arial, sans-serif` : 'Arial, sans-serif', fontSize: '16px', lineHeight: '22px', color: css.getPropertyValue('--sf-ink').trim(), '::placeholder': { color: css.getPropertyValue('--sf-muted').trim() } },
        invalid: { color: '#a62323' },
      };
      fields.hidden = false;
      mountTimer = setTimeout(fail, 12000);
      cancelLoad = () => clearTimeout(mountTimer);
      for (const [type, id] of [['cardNumber', 'sf-card-number'], ['cardExpiry', 'sf-card-expiry'], ['cardCvc', 'sf-card-cvc']]) {
        const element = group.create(type, { style, classes: { focus: 'sf-element-focus', invalid: 'sf-element-invalid' } });
        elements.push(element);
        element.on('ready', () => {
          if (!current()) return;
          ready.add(type);
          if (ready.size === 3) { clearTimeout(mountTimer); status.textContent = 'Stripe test fields ready. This demo never submits card details for payment.'; }
        });
        element.on('loaderror', fail);
        element.on('change', event => {
          if (!current()) return;
          complete[type] = event.complete === true;
          cardErrors[type] = event.error?.message || '';
          error('payment', Object.values(cardErrors).find(Boolean) || '');
        });
        element.mount(`#${id}`);
      }
    } catch { clearTimeout(mountTimer); fail(); }
  }
  retry.addEventListener('click', startPayment);
  presetButton.addEventListener('click', () => {
    preset = !preset;
    error('payment', '');
    startPayment();
  });
  const advance = () => {
    if (busy || !active()) return;
    if (step === 1) {
      email.value = email.value.trim();
      if (!email.value || !email.validity.valid) { error('email', 'Enter a valid email address to continue.', email); return; }
    }
    if (step === 2 || step === 3) {
      const name = step === 2 ? 'experience' : 'region';
      if (!selected(name)) { error(name, 'Choose one option to continue.', find(`input[name="${name}"]`)); return; }
    }
    if (step === 4) {
      if (!preset && (ready.size !== 3 || Object.keys(complete).length !== 3 || !Object.values(complete).every(Boolean) || Object.values(cardErrors).some(Boolean))) {
        error('payment', 'Complete all three test card fields, or choose “Use a demo card”.', find('#sf-payment-error'));
        return;
      }
      busy = true;
      next.disabled = true;
      status.textContent = 'Preparing the preview locally. No payment is being processed.';
      const ticket = generation;
      finishTimer = setTimeout(() => {
        if (ticket !== generation || !active() || step !== 4) return;
        completed = true;
        render(5);
      }, 350);
      return;
    }
    if (step < 4) render(step + 1);
  };
  form.addEventListener('submit', event => { event.preventDefault(); advance(); });
  email.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); advance(); } });
  next.addEventListener('click', advance);
  back.addEventListener('click', () => {
    if (page && history.state?.signupStep === step && step > 1) history.back();
    else render(Math.max(1, step - 1));
  });
  form.addEventListener('input', () => { clearErrors(); completed = false; });
  find('[data-sf-reset]').addEventListener('click', () => {
    stopPayment();
    form.reset();
    completed = false;
    preset = false;
    flow.querySelectorAll('[data-sf-summary]').forEach(node => { node.textContent = ''; });
    render(1, 'replace');
  });

  if (dialog) {
    const close = () => { if (dialog.open) dialog.close(); };
    host.querySelector('[data-sf-close]').addEventListener('click', close);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    let backdropDown = false;
    const outside = event => {
      const rect = dialog.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog && outside(event); });
    dialog.addEventListener('click', event => { if (backdropDown && event.target === dialog && outside(event)) close(); backdropDown = false; });
    dialog.addEventListener('close', () => {
      stopPayment();
      for (const [node, inert] of inertState) node.inert = inert;
      inertState = [];
      document.body.style.cssText = bodyStyle;
      window.scrollTo({ top: scrollPosition, behavior: 'instant' });
      const visible = node => node && node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';
      const target = visible(launcher) ? launcher : document.querySelector('.menu-toggle, .v2-menu-toggle, .v4-menu-button');
      if (visible(target)) target.focus({ preventScroll: true });
    });
    // Native showModal supplies top-layer focus isolation (including cross-origin
    // Stripe iframes) and Escape semantics; do not replace it with a JS tab loop.
    document.addEventListener('click', event => {
      const link = event.target.closest('a[data-signup]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
      event.preventDefault();
      if (matchMedia('(max-width: 767px)').matches) { location.assign(dialog.dataset.start); return; }
      if (dialog.open) return;
      launcher = link;
      scrollPosition = window.scrollY;
      bodyStyle = document.body.style.cssText;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      inertState = [...document.body.children].filter(node => node !== dialog).map(node => [node, node.inert]);
      inertState.forEach(([node]) => { node.inert = true; });
      dialog.showModal();
      render(step, 'none');
    });
  } else {
    window.addEventListener('popstate', () => {
      const requested = Number(new URL(location.href).searchParams.get('step'));
      render(Number.isInteger(requested) && requested >= 1 && requested <= 5 ? requested : 1, 'replace');
    });
  }
  // Reveal only after all handlers are installed. No-JS landings keep real links;
  // standalone pages retain their explicit fallback if initialization fails.
  flow.hidden = false;
  if (page) {
    page.querySelector('[data-sf-fallback]').hidden = true;
    render(1, 'replace');
  }
})();
