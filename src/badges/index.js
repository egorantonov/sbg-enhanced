import { EUI, Elements, Events, Nodes, t } from '../constants'

const asset64Prefix = 'https://raw.githubusercontent.com/egorantonov/sbg-enhanced/master/assets/64/'
const badgeMap = new Map()

const createImages = (tiers, badge) => {
    let images = []
    for (let i = tiers.length; i > 0; i--) {
        images.push({tier: tiers[tiers.length-i], value: `${asset64Prefix}${badge}${i}.png` })
    }
    return images
}

badgeMap.set(t('hacker'), { images: createImages([200000,100000,30000,10000,2000], 'hacker') })
badgeMap.set(t('liberator'), { images: createImages([40000,15000,5000,1000,100], 'liberator') })
badgeMap.set(t('pioneer'), { images: createImages([20000,5000,1000,200,20], 'pioneer') })
badgeMap.set(t('explorer'), { images: createImages([30000,10000,2000,1000,100], 'explorer') })
badgeMap.set(t('connector'), { images: createImages([100000,25000,5000,1000,50], 'connector') })
badgeMap.set(t('builder'), { images: createImages([150000,75000,22500,7500,1500], 'builder') })
badgeMap.set(t('purifier'), { images: createImages([225000,75000,22500,7500,1500], 'purifier') })
badgeMap.set(t('guardian'), { images: createImages([150,90,20,10,3], 'guardian') })

const badgeImageClass = 'badge-image'
const badgesContainerClass = 'eui-badge-container'

const RemoveBadgesContainer = () => {
    const badgesContainer = Nodes.ProfilePopup.querySelector(`.${badgesContainerClass}`)
    badgesContainer && (badgesContainer.remove())
}

// removes badges on close button click
export const RemoveBadges = () => {
    const closeButton = Nodes.ProfilePopup?.querySelector('button.popup-close')
    closeButton?.addEventListener(Events.onClick, RemoveBadgesContainer)
}

// adds badges
export const AddBadges = () => {

    RemoveBadgesContainer()

    const badgesContainer = document.createElement(Elements.Div)
    badgesContainer.className = badgesContainerClass
    badgesContainer.style.justifyContent = 'center'
    badgesContainer.style.borderBottom = '1px var(--border-transp) solid'

    Nodes.ProfileStatsContainer?.prepend(badgesContainer)

    for (let i = 0; i < Nodes.ProfileStats.length; i++) {
        const stat = Nodes.ProfileStats[i]
        const title = stat.firstChild.innerText

        if (badgeMap.has(title)) {
            const tier = +stat.lastChild.innerText.replace(/,|\s|days|day|дней|день|дня/g, '')

            const currentTier = badgeMap.get(title).images.find(x => x.tier <= tier)
            const nextTier = Array.from(badgeMap.get(title).images).reverse().find(x => x.tier > tier)

            if (!currentTier) {
                continue
            }

            const badgeImage = document.createElement(Elements.Image)
            badgeImage.className = badgeImageClass
            badgeImage.src = currentTier.value
            badgeImage.title = title
            badgeImage.width = 40
            badgeImage.height = 40
            badgeImage.classList.add(EUI.CustomTheme)

            const badgeProgress = document.createElement(Elements.Paragraph)
            badgeProgress.innerText = tier

            const badge = document.createElement(Elements.Div)
            badge.className = 'eui-badge'
            badge.style.fontSize = '0.5em'
            badge.style.textAlign = 'center'
            badge.appendChild(badgeProgress)
            badge.appendChild(badgeImage)

            if (nextTier) {
                const badgeNextTier = document.createElement(Elements.Paragraph)
                badgeNextTier.className = 'eui-badge-next-tier'
                badgeNextTier.innerText = nextTier.tier
                badge.appendChild(badgeNextTier)
            }

            badgesContainer.appendChild(badge)
        }
    }
}

export const ProfileStatsChanged = () => ({
    target: Nodes.ProfileStatsContainer,
    config: { childList: true },
    callback: (mutationsList) => {
        if (mutationsList.find(x => x.addedNodes.length && x.addedNodes[0].classList.contains('pr-stats__section'))) {
            const event = new Event(Events.onProfileStatsChanged, { bubbles: true })
            mutationsList[0].target.dispatchEvent(event)
        }
    }
})

export const RenderBadges = () => {
    Nodes.ProfilePopup?.addEventListener(Events.onProfileStatsChanged, () => {
        AddBadges()
    })
}