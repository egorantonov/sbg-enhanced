export class CanvasSnowfall {
    constructor() {
        this.canvas = document.createElement('canvas')
        this.ctx = this.canvas.getContext('2d')
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            touch-action: none;
            z-index: 9999;
            mask: linear-gradient(#000f, #0000);
            display: none;
        `
        document.body.appendChild(this.canvas)
        
        this.snowflakes = []
        this.maxFlakes = 150
        this.resize()
        this.init()
        
        window.addEventListener('resize', () => this.resize())
    }

    show() {
      this.canvas.style.display = 'block'
    }
    clear() {
      this.canvas.style.display = 'none'
    }
    
    resize() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
    }
    
    init() {
        for (let i = 0; i < this.maxFlakes; i++) {
            this.snowflakes.push(this.createSnowflake())
        }
        this.animate()
    }
    
    createSnowflake() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            radius: Math.random() * 3 + 1,
            speed: Math.random() * 1 + 0.5,
            swing: Math.random() * 0.5 + 0.2,
            swingPhase: Math.random() * Math.PI * 2
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        
        this.ctx.fillStyle = '#adfc'
        this.ctx.beginPath()
        
        this.snowflakes.forEach(flake => {
            // Обновление позиции
            flake.y += flake.speed
            flake.x += Math.sin(flake.y * 0.01 + flake.swingPhase) * flake.swing
            
            // Если снежинка упала
            if (flake.y > this.canvas.height) {
                Object.assign(flake, this.createSnowflake())
                flake.y = -10
            }
            
            // Рисование снежинки
            this.ctx.moveTo(flake.x, flake.y)
            this.ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2)
        })
        
        this.ctx.fill()
        requestAnimationFrame(() => this.animate())
    }
}