// Deterministic stand-in only; real SDK smoke is a separate, opt-in script.
export const stripeStub = `(() => {
  window.__stripeCalls = [];
  window.__stripeElements = [];
  window.Stripe = key => ({
    elements: options => {
      window.__stripeCalls.push({key, options});
      return { create: (type, config) => {
        const handlers = {};
        let frame;
        const element = {
          on: (name, callback) => { handlers[name] = callback; },
          mount: selector => {
            frame = document.createElement('iframe');
            frame.title = type + ' test field';
            frame.style.cssText = 'width:100%;height:24px;border:0;display:block';
            frame.srcdoc = '<html><body style="margin:0"><input aria-label="' + type + '" style="border:0;width:100%;font-size:16px;height:22px;box-sizing:border-box" /></body></html>';
            frame.onload = () => {
              const input = frame.contentDocument.querySelector('input');
              input.addEventListener('input', () => {
                const value = input.value.replace(/\\s/g, '');
                const complete = type === 'cardNumber' ? value === '4242424242424242' : type === 'cardExpiry' ? /^12\\/?39$/.test(value) : /^\\d{3}$/.test(value);
                handlers.change?.({ complete, error: value === 'bad' ? {message:'Invalid test field.'} : undefined });
              });
              if (!window.__stripeNoReady) handlers.ready?.();
            };
            document.querySelector(selector).append(frame);
          },
          destroy: () => frame?.remove(),
          fire: (name, payload) => handlers[name]?.(payload),
        };
        window.__stripeElements.push({element, type, config});
        return element;
      }};
    },
    createToken: () => { throw new Error('FORBIDDEN createToken'); },
    createPaymentMethod: () => { throw new Error('FORBIDDEN createPaymentMethod'); },
    confirmPayment: () => { throw new Error('FORBIDDEN confirmPayment'); },
  });
})();`;

export async function stubStripe(page, mode = 'ready') {
  const requests = [];
  await page.route('https://**/*', async route => {
    requests.push(route.request().url());
    if (route.request().url() === 'https://js.stripe.com/v3/' && mode !== 'blocked') {
      await route.fulfill({ contentType: 'text/javascript', body: stripeStub });
    } else await route.abort();
  });
  return requests;
}
