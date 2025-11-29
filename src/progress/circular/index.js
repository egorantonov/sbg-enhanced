export class CircularProgress {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container

    this.options = {
      size: options.size || 120,
      fontSize: options.fontSize || '12px',
      strokeWidth: options.strokeWidth || 12,
      color: options.color || 'var(--progress)',
      backgroundColor: options.backgroundColor || 'var(--text)',
      ...options
    }

    this.init()
  }

  init() {
    const { size, strokeWidth } = this.options
    const radius = (size - strokeWidth) / 2
    this.circumference = 2 * Math.PI * radius

    this.container.innerHTML = `
      <svg class="progress-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle class="progress-bg" cx="${size / 2}" cy="${size / 2}" r="${radius}" 
                stroke-width="${strokeWidth}"/>
        <circle class="progress-value" cx="${size / 2}" cy="${size / 2}" r="${radius}" 
                stroke-width="${strokeWidth}" stroke-dasharray="${this.circumference}" 
                stroke-dashoffset="${this.circumference}"/>
        <text class="progress-text" x="${size / 2}" y="${size / 2 + 5}" 
              text-anchor="middle">0%</text>
      </svg>
    `

    this.progressValue = this.container.querySelector('.progress-value')
    this.progressText = this.container.querySelector('.progress-text')

    // Применяем стили
    this.applyStyles()
  }

  applyStyles() {
    const style = document.createElement('style')
    style.textContent = `
      .progress-svg {
        backdrop-filter: blur(10px);
        border-radius: 500px;
      }
      .progress-bg {
        fill: none;
        stroke: ${this.options.backgroundColor};
      }
      .progress-value {
        fill: none;
        stroke: ${this.options.color};
        stroke-linecap: round;
        transition: stroke-dashoffset 0.3s;
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
      }
      .progress-text {
        font-size: ${this.options.fontSize};
        font-weight: bold;
        fill: var(--text, #ccc);
      }
    `
    document.head.appendChild(style)
  }

  /**
   * Set progress state
   * @param {Number} a Percentage or current (if total passed)
   * @param {Number} b Total if passed
   */
  setProgress(a, b) {
    if (!b) this.setProgressPercentage(a)
    else this.setProgressNumbers(a, b)
  }

  setProgressPercentage(percent) {
    const offset = this.circumference - (percent / 100) * this.circumference
    this.progressValue.style.strokeDashoffset = offset
    this.progressText.textContent = `${Math.round(percent)}%`
  }

  setProgressNumbers(current, total) {
    const offset = this.circumference - (current / total) * this.circumference
    this.progressValue.style.strokeDashoffset = offset
    this.progressText.textContent = `${current}/${total}`
  }
}