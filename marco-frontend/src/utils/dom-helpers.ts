// DOM utility functions

export function showStatus(element: HTMLElement, message: string, type: 'success' | 'error') {
  element.textContent = message;
  element.className = type === 'success' ? 'mt-2 text-sm text-green-400' : 'mt-2 text-sm text-red-400';
  setTimeout(() => {
    element.textContent = '';
  }, 3000);
}

export function accessibilityTogglesUI() {
  return `<div class='fixed bottom-4 left-4 z-50 flex space-x-2'>
    <button id='toggle-contrast' class='px-2 py-1 bg-black text-white rounded border border-white focus:outline-none focus:ring-2 focus:ring-white' aria-label='Toggle high contrast' tabindex='0'>🌓</button>
    <button id='toggle-textsize' class='px-2 py-1 bg-black text-white rounded border border-white focus:outline-none focus:ring-2 focus:ring-white' aria-label='Toggle large text' tabindex='0'>A+</button>
  </div>`;
}