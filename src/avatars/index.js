import { Elements, Events, EUI, Nodes } from '../constants'

export function Avatars() {

  const avatar = document.createElement(Elements.Canvas)
  avatar.id = EUI.Avatar
  avatar.style.maxWidth = '30px'
  avatar.style.position = 'absolute'
  avatar.style.left = '7px'

  Nodes.PrName.before(avatar)

  function CreateAvatar(inputString, canvasId) {
    const bgColor = '#0000'
    const drawGrid = (ctx, binary, gridSize, cellSize) => {
      // const colors = ['#B00', '#0B0', '#08F']
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize / 2; j++) { // iterate over half the grid
          const index = i * gridSize + j
          if (index >= binary.length) break

          let color = binary[index] === '1' 
            ? window.getComputedStyle(Nodes.PrName).color /*colors[i % colors.length]*/ 
            : bgColor

          ctx.fillStyle = color
          ctx.fillRect(j * cellSize + 10, i * cellSize + 10, cellSize, cellSize)

          // vertical symmetry
          ctx.fillRect((gridSize - j - 1) * cellSize + 10, i * cellSize + 10, cellSize, cellSize)
        }
      }
    }

    // TODO: ?
    const simpleHash = (str) => {
      let hash = 0
      for (let i = 0, len = str.length; i < len; i++) {
          let chr = str.charCodeAt(i)
          hash = (hash << 5) - hash + chr
          hash |= 0 // to 32bit integer
      }
      return `${Math.abs(hash)}`
    }

    const canvas = document.getElementById(canvasId)
    const ctx = canvas.getContext('2d')
    const binary = Array.from(inputString.toUpperCase())
                    .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
                    .join('')

    // grid dimensions
    const gridSize = Math.ceil(Math.sqrt(binary.length))
    const cellSize = 10

    canvas.width = gridSize * cellSize + 20
    canvas.height = gridSize * cellSize + 20

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    drawGrid(ctx, binary, gridSize, cellSize)

    // border
    ctx.strokeStyle = bgColor
    ctx.lineWidth = 10
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10)
  }

  Nodes.ProfilePopup?.addEventListener(Events.onProfileStatsChanged, () => {
    CreateAvatar(Nodes.PrName.innerText, avatar.id)
  })
}

