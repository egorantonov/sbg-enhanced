export function createToast(text = '', layout = 'bottom center', duration = 3000, className = 'interaction-toast') {
  if (!window.Toastify) return
  const [gravity, position] = layout.split(/\s+/)
  const toast = Toastify({
    text,
    duration,
    gravity,
    position,
    escapeMarkup: false,
    className
  })
  toast.options.onClick = () => toast.hideToast()
  return toast
}

function getNativeFetch() {
  if (!window._nativeFetch) {
    const iframe = document.createElement('iframe');

    iframe.style.display = 'none';
    document.body.appendChild(iframe); // add element

    window._nativeFetch = iframe.contentWindow.fetch;
  }

  return window._nativeFetch;
}

export const nativeFetch = getNativeFetch()