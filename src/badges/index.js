import { EUI, Events, Nodes } from '../constants'

const asset64Prefix = 'https://raw.githubusercontent.com/egorantonov/sbg-enhanced/master/assets/64/'
const badgeMap = new Map()

const createImages = (tiers, badge) => {
    let images = []
    for (let i = tiers.length; i > 0; i--) {
        images.push({tier: tiers[tiers.length-i], value: `${asset64Prefix}${badge}${i}.png` })
    }
    return images
}

badgeMap.set('Points Captured', { images: createImages([40000,15000,5000,1000,100], 'liberator') })
badgeMap.set('Lines Drawn', { images: createImages([100000,25000,5000,1000,50], 'connector') })
badgeMap.set('Unique Points Visited', { images: createImages([30000,10000,2000,1000,100], 'explorer') })
badgeMap.set('Discoveries Done', { images: createImages([200000,100000,30000,10000,2000], 'hacker') })
badgeMap.set('Points Captured', { images: createImages([20000,5000,1000,200,20], 'pioneer') })
badgeMap.set('Cores Destroyed', { images: createImages([225000,75000,22500,7500,1500], 'purifier') })
badgeMap.set('Cores Deployed', { images: createImages([150000,75000,22500,7500,1500], 'builder') })
badgeMap.set('Longest Point Ownership', { images: createImages([150,90,20,10,3], 'guardian') })

const badgeImageClass = 'badge-image'
// removes badges on close button click
export const RemoveBadges = () => {
    const closeButton = Nodes.ProfilePopup?.querySelector('button.popup-close')
    closeButton?.addEventListener(Events.onClick, () => {
        let previousBadges = Nodes.ProfilePopup.querySelectorAll(`.${badgeImageClass}`)
        for (let i = 0; i < previousBadges.length; i++) {
            previousBadges[i].remove()
        }
    })
}

// adds badges
export const AddBadges = () => {

    const previousBadges = document.querySelectorAll(`.${badgeImageClass}`)
    for (let i = 0; i < previousBadges.length; i++) {
        previousBadges[i].remove()
    }

    const stats = Array.from(document.querySelectorAll('.pr-stat'))
    for (let i = 0; i < stats.length; i++) {
        const stat = stats[i]
        const title = stat.firstChild.innerText

        if (badgeMap.has(title)) {
            const tier = +stat.lastChild.innerText.replace(/,| days| km|/g, '')

            const currentTier = badgeMap.get(title).images.find(x => x.tier <= tier)

            if (!currentTier) {
                continue
            }

            const badgeImage = document.createElement('img')
            badgeImage.className = badgeImageClass
            badgeImage.src = currentTier.value
            badgeImage.title = tier
            badgeImage.width = 40
            badgeImage.height = 40
            badgeImage.classList.add(EUI.IngressTheme)

            Nodes.ProfileStats?.prepend(badgeImage)
        }
    }
}

const onProfileStatsChanged = 'profileStatsChanged'
export const ProfileStatsChanged = {
    target: Nodes.ProfileStats,
    config: { childList: true },
    callback: (mutationsList) => {
        if (mutationsList.find(x => x.addedNodes.length && x.addedNodes[0].classList.contains('pr-stats__section'))) {
            const event = new Event(onProfileStatsChanged, { bubbles: true })
            mutationsList[0].target.dispatchEvent(event)
        }
    }
}

export const RenderBadges = () => {
    Nodes.ProfilePopup?.addEventListener(onProfileStatsChanged, () => {
        AddBadges()
    })
}