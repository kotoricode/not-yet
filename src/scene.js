import { playAudio } from "./audio"
import { $, createImage, events, getClicked, getOnCanvas, mouseClientPos, viewProjectionMatrix } from "./common"
import { getEnemies } from "./enemy"
import {
    EVENT_ATTACK, EVENT_ROOM_START, EVENT_FADE_IN, EVENT_FADE_OUT, EVENT_NEXT_TURN,
    EVENT_UPDATE_ITEMS, EVENT_UPDATE_LIVES, EVENT_UPDATE_SOULS, EVENT_UPGRADE, EVENT_WAIT_1000,
    EVENT_WAIT_500, EVENT_BACK_TO_START, EVENT_UPDATE_BACKGROUND
} from "./event-enum"
import { pickEntity } from "./gl"
import { showMap, getLayer, getRoomColor, hideMap, getFinish, setPlayerToBeginning, isReincarnated } from "./map"

let highlightedUnit
let highlightTimer = 0
let lives = 8
let wait = 0
let activeItemIndex = -1
let currentTurnUnitIndex
let playerCanAct = 0
let dyingUnit

let attackActor
let attackTarget
let attackItemIndex

let damageFloaters = []

let fadeOpacity
let fadeDirection

export const units = []

const upgradeLevels = [0, 0, 0, 0]
const upgradeCosts = [5, 10, 25, 45, 65, 85, 115, 135, 170]

export const update = (dt) =>
{
    wait = wait > dt ? wait - dt : 0
    backgroundEntities[0][2][6] += dt / 15

    while (events.length && !wait)
    {
        const event = events.shift()

        if (event == EVENT_WAIT_500)
        {
            wait = .5
        }

        if (event == EVENT_WAIT_1000)
        {
            wait = 1
        }

        if (event == EVENT_ROOM_START)
        {
            $("dom-damage").innerHTML = ""
            damageFloaters = []
            activeItemIndex = -1
            $("dom-inventory-active").classList.add("dom-hide")

            itemDefinitions[0][2] = 1 + upgradeLevels[0] * 2
            itemDefinitions[1][2] = 5 + upgradeLevels[3] * 3
            itemDefinitions[2][2] = 15 + upgradeLevels[3] * 3
            itemDefinitions[3][2] = 25 + upgradeLevels[3] * 3

            if (isReincarnated())
            {
                units.length = 0
                units.push(player)
                events.push(EVENT_FADE_IN)

                player[2][1] = 2 // u_fragMode after death
                player[2][7] = 1 // u_opacity after death

                player[4][0] = player[4][1] = 35 + upgradeLevels[1] * 5

                events.push(EVENT_UPDATE_BACKGROUND)
                showMap()
            }
            else
            {
                if (!~units.indexOf(player))
                {
                    units.push(player)
                }

                hideMap()
                const layer = getLayer()
                units.push(...getEnemies(layer))
                units.sort((a, b) => a[2][3].m43 - b[2][3].m43)
                currentTurnUnitIndex = units.indexOf(player)
                playerCanAct = 1

                events.push(EVENT_UPDATE_ITEMS, EVENT_UPDATE_LIVES, EVENT_UPDATE_SOULS, EVENT_UPDATE_BACKGROUND, EVENT_FADE_IN, EVENT_WAIT_1000, EVENT_NEXT_TURN)
            }
        }

        if (event == EVENT_ATTACK)
        {
            $("dom-turn").classList.add("dom-hide")

            const damage = itemDefinitions[attackActor[5][attackItemIndex][0]][2]

            attackTarget[4][0] = attackTarget[4][0] > damage ? attackTarget[4][0] - damage : 0

            if (attackActor == player)
            {
                attackActor[5][attackItemIndex][1]--
                events.push(EVENT_UPDATE_ITEMS)
            }

            events.push(EVENT_WAIT_1000)

            if (attackTarget[4][0] == 0)
            {
                dyingUnit = attackTarget

                if (dyingUnit != player)
                {
                    player[6] += dyingUnit[6] + upgradeLevels[2]
                    events.push(EVENT_UPDATE_SOULS)
                }
            }
            else
            {
                currentTurnUnitIndex = (currentTurnUnitIndex + 1) % units.length
                events.push(EVENT_NEXT_TURN)
            }

            const ndc = viewProjectionMatrix.multiply(attackTarget[2][3])
            const screenX = (1 + ndc.m41 / ndc.m44) * 512
            const screenY = (1 - ndc.m42 / ndc.m44) * 288

            const floater = document.createElement("div")
            floater.style.left = screenX + "px"
            floater.innerHTML = -damage

            damageFloaters.push([
                floater, // element
                0, // life timer
                screenY - 250 // position
            ])
            $("dom-damage").appendChild(floater)
        }

        if (event == EVENT_NEXT_TURN)
        {
            if (currentTurnUnitIndex == units.indexOf(player))
            {
                $("dom-turn-text").innerHTML = "Your turn"
                playerCanAct = 1
            }
            else
            {
                $("dom-turn-text").innerHTML = units[currentTurnUnitIndex][3] + "'s turn"
                attackActor = units[currentTurnUnitIndex]
                attackTarget = player
                attackItemIndex = Math.random() * units[currentTurnUnitIndex][5].length | 0
                events.push(EVENT_WAIT_1000, EVENT_ATTACK)
            }

            $("dom-turn").classList.remove("dom-hide")
        }

        if (event == EVENT_UPDATE_ITEMS)
        {
            if (~activeItemIndex && !player[5][activeItemIndex][1])
            {
                activeItemIndex = -1
                $("dom-inventory-active").classList.add("dom-hide")
            }

            player[5] = player[5].filter(x => x[1])

            for (let i = 0; i < 4; i++)
            {
                if (player[5][i])
                {
                    const [itemIndex, itemEndurance] = player[5][i]
                    const definition = itemDefinitions[itemIndex]
                    const itemEnduranceMax = definition[3]
                    $("i" + i).innerHTML = definition[1].outerHTML + `<div>${~itemEnduranceMax ? (itemEndurance + "/" + itemEnduranceMax) : "∞"}</div>`
                }
                else
                {
                    $("i" + i).innerHTML = ""
                }
            }
        }

        if (event == EVENT_UPDATE_LIVES)
        {
            let livesHtml = '<div><svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 288 32" width=288 height=32>'

            for (let i = 0; i < 9;)
            {
                livesHtml +=
                `<g style=translate:${i * 32}px opacity=${i < lives ? 1 : .5}>` +
                    (++i == lives ?
                        "<g stroke=#ff7520 stroke-width=6 stroke-linejoin=round>" +
                            "<ellipse cx=16 cy=19 rx=12 ry=10 />" +
                            '<path d="m5 4 8 6-7 4z"/>' +
                            '<path d="m27 4-8 6 7 4z"/>' +
                        "</g>"
                        : ""
                    ) +
                    "<g fill=#ccccd3>" +
                        "<ellipse cx=16 cy=19 rx=12 ry=10 />" +
                        '<path d="m5 4 8 6-7 4z"/>' +
                        '<path d="m27 4-8 6 7 4z"/>' +
                    "</g>" +
                    "<g fill=#097e81>" +
                        "<ellipse cx=12 cy=17 rx=2 ry=3 />" +
                        "<ellipse cx=20 cy=17 rx=2 ry=3 />" +
                    "</g>" +
                "</g>"
            }

            $("dom-lives").innerHTML = livesHtml + "</svg></div>"
        }

        if (event == EVENT_UPDATE_SOULS)
        {
            $("dom-souls").innerHTML =
                '<svg viewBox="0 0 200 100" xmlns=http://www.w3.org/2000/svg>' +
                    `<text x=15 y=70 font-size=24px stroke=#000 stroke-width=3px>Souls: ${player[6]}</text>` +
                    `<text x=15 y=70 fill=#fff font-size=24px>Souls: ${player[6]}</text>` +
                "</svg>"
        }

        if (event == EVENT_FADE_OUT)
        {
            fadeOpacity = 0
            fadeDirection = 1
        }

        if (event == EVENT_FADE_IN)
        {
            fadeOpacity = 1
            fadeDirection = -1
        }

        if (event == EVENT_UPGRADE)
        {
            for (let i = 0; i < 4; i++)
            {
                if (player[6] < upgradeCosts[upgradeLevels[i]] || upgradeLevels[i] == 9)
                {
                    $("u" + i).classList.add("dom-upgrade-unavailable")
                }
                else
                {
                    $("u" + i).classList.remove("dom-upgrade-unavailable")
                }
            }

            $("dom-upgrade").classList.remove("dom-hide")
        }

        if (event == EVENT_BACK_TO_START)
        {
            setPlayerToBeginning()
            events.push(EVENT_UPDATE_LIVES, EVENT_FADE_OUT, EVENT_WAIT_1000, EVENT_ROOM_START)
        }

        if (event == EVENT_UPDATE_BACKGROUND)
        {
            const layer = getLayer()
            playAudio(layer + 1)
            backgroundEntities.map(entity => entity[2][5] = [...getRoomColor().map(x => x / 255), 1])
        }
    }

    damageFloaters = damageFloaters.filter(floater =>
    {
        floater[1] += dt
        floater[2] -= dt * 40
        floater[0].style.top = floater[2] + "px"

        if (floater[1] > 1)
        {
            if (2 < floater[1])
            {
                return !$("dom-damage").removeChild(floater[0])
            }

            floater[0].style.opacity =  2 - floater[1]
        }

        return true
    })

    if (dyingUnit)
    {
        dyingUnit[2][1] = 0 // u_fragMode
        dyingUnit[2][7] = dyingUnit[2][7] > dt ? dyingUnit[2][7] - dt : 0 // u_opacity

        if (!dyingUnit[2][7])
        {
            const dyingUnitIndex = units.indexOf(dyingUnit)

            units.splice(dyingUnitIndex, 1)

            if (dyingUnit == player)
            {
                lives--
                playerCanAct = 0

                if (!lives)
                {
                    $("dom-game-over").classList.remove("dom-hide")
                }
                else
                {
                    events.push(EVENT_UPGRADE)
                }
            }
            else
            {
                if (units.length == 1)
                {
                    if (getFinish())
                    {
                        $("dom-outro").classList.remove("dom-hide")
                    }
                    else
                    {
                        showMap()
                    }
                }
                else
                {
                    if (currentTurnUnitIndex < dyingUnitIndex)
                    {
                        currentTurnUnitIndex = (currentTurnUnitIndex + 1) % units.length
                    }

                    events.push(EVENT_NEXT_TURN)
                }
            }

            dyingUnit = 0
        }
    }

    if (fadeDirection)
    {
        if (fadeDirection == -1)
        {
            fadeOpacity = fadeOpacity - dt * 2 > 0 ? fadeOpacity - dt * 2: 0
        }
        else
        {
            fadeOpacity = fadeOpacity + dt * 2 < 1 ? fadeOpacity + dt * 2: 1
        }

        $("dom-fade").style.opacity = fadeOpacity

        if (fadeOpacity | 0 == fadeOpacity)
        {
            fadeDirection = 0
        }
    }

    if (getOnCanvas())
    {
        const pickedEntityIndex = pickEntity()

        if (~pickedEntityIndex)
        {
            const entity = units[pickedEntityIndex]

            if (highlightedUnit && highlightedUnit != entity)
            {
                highlightedUnit[2][4] = 0
                highlightedUnit = 0
                highlightTimer = 0
            }
            else
            {
                highlightTimer += dt
            }

            highlightedUnit = entity
            entity[2][4] = Math.sin(highlightTimer * 4) / 4 + .4

            $("dom-tooltip").classList.remove("dom-hide")
            $("dom-tooltip-header").textContent = entity[3]
            $("dom-tooltip-body").textContent = "Health: " + entity[4].join("/")
            $("dom-tooltip").style.left = mouseClientPos[0] + 16 + "px"
            $("dom-tooltip").style.top = 576 - mouseClientPos[1] + 16 + "px"

            if (playerCanAct)
            {
                if (~activeItemIndex)
                {
                    $("dom-canvas").classList.add("dom-pointer")
                }

                if (getClicked() && !events.length && !wait && ~activeItemIndex && entity != player)
                {
                    attackActor = player
                    attackTarget = entity
                    attackItemIndex = activeItemIndex
                    playerCanAct = 0
                    events.push(EVENT_ATTACK)
                }
            }
            else
            {
                $("dom-canvas").classList.remove("dom-pointer")
            }
        }
        else if (highlightedUnit)
        {
            highlightedUnit[2][4] = 0
            highlightedUnit = 0
            highlightTimer = 0
            $("dom-tooltip").classList.add("dom-hide")
            $("dom-canvas").classList.remove("dom-pointer")
        }
    }
    else if (highlightedUnit)
    {
        highlightedUnit[2][4] = 0
        highlightedUnit = 0
        highlightTimer = 0
        $("dom-canvas").classList.remove("dom-pointer")
    }
}

// Name, image, power, endurance
const itemDefinitions = [
    [
        "Claw",
        createImage('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="a" x1="45" x2="85" y1="20" y2="50" gradientUnits="userSpaceOnUse"><stop stop-color="#ccccd9" offset="0"/><stop stop-color="#ccccd9" stop-opacity="0" offset="1"/></linearGradient></defs><g><path d="m53 21-6.2 27s14-9.2 31 6.8c-3-4-7-8-11-11 5 2 16 7 23 14-7-10-16-16-24-20 6 1 15 5 23 12-6-8-14-14-20-17 6 2 11 5 17 11-14-19-33-23-33-23z" fill="url(#a)"/><path d="m73 88c-23-28-18-40-18-40 4.5-20 0-30-5-33-4-2-6.4 1-6 5-2-8-10-8-10-2 0 2 0.98 3.2 0.98 3.2-6.4-4.5-9.8 2-7 5.8-3-1-9 5 0 10 0 0 2 11 7 16 0 0-1 19 13 38" fill="#ccccd9"/><path d="m48 15s-1-5-4-5c2 2 2 6 2 6m-8-1s-1-5-4-5c2 2 2 6 2 6m-5 5s-3-4-7-3c3 1 5 4 5 4m-3 7s-3-3-7 0c3-1 6 2 6 2" fill="#fff"/></g></svg>'),
        1,
        -1
    ],
    [
        "Rusty sword",
        createImage('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="m73 67-46-51-12-1 1 12 51 46" fill="#dad3c7"/><path d="m72 66-6 6c-11 11 5 4 5 4 3 1 9 7 13 12 3 4 8-1 4-4-5-4-11-10-12-13 0 0 7-16-4-5z" fill="#7b6b51"/></svg>'),
        5,
        5
    ],
    [
        "Iron sword",
        createImage('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="m73 67-46-51-12-1 1 12 51 46" fill="#cbd5d6"/><path d="m72 66-6 6c-11 11 5 4 5 4 3 1 9 7 13 12 3 4 8-1 4-4-5-4-11-10-12-13 0 0 7-16-4-5z" fill="#4d6974"/></svg>'),
        15,
        5
    ],
    [
        "Silver sword",
        createImage('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="m73 67-46-51-12-1 1 12 51 46" fill="#f3f4f4"/><path d="m72 66-6 6c-11 11 5 4 5 4 3 1 9 7 13 12 3 4 8-1 4-4-5-4-11-10-12-13 0 0 7-16-4-5z" fill="#b6afcb"/></svg>'),
        25,
        5
    ],

    // Skelly attack
    [0, 0, 1, -1],

    // Bashy attack
    [0, 0, 2, -1],

    // Haunty & Mummy attack
    [0, 0, 3, -1],

    // Reaper attack
    [0, 0, 10, -1],
]

export const backgroundEntities = [
    // Miasma
    [
        3, // texture index
        16, // model attribute offset
        [
            2, // u_vertMode
            2, // u_fragMode
            [16/9, 1], // u_uvMultiplier
            new DOMMatrix(), // u_transform,
            1, // u_tint
            [1, 1, 1, 1], // u_tintColor
            0, // u_uvShift
            1 // u_opacity
        ]
    ],

    // Ground
    [
        1,
        40,
        [
            1,
            1,
            [24, 15],
            new DOMMatrix(),
            .2,
            [1, 1, 1, 1],
            0,
            1
        ]
    ],

    // Wall back
    [
        1,
        52,
        [
            1,
            1,
            [24, 10],
            new DOMMatrix(),
            .5,
            [1, 1, 1, 1],
            0,
            1
        ]
    ],

    // Wall left
    [
        1,
        64,
        [
            1,
            1,
            [15, 10],
            new DOMMatrix(),
            .5,
            [1, 1, 1, 1],
            0,
            1
        ]
    ],

    // Wall right
    [
        1,
        76,
        [
            1,
            1,
            [15, 10],
            new DOMMatrix(),
            .5,
            [1, 1, 1, 1],
            0,
            1
        ]
    ]
]

const player = [
    0, // texture index
    28, // model attribute offset
    [
        1, // u_vertMode
        2, // u_fragMode
        [1, 1], // u_uvMultiplier
        new DOMMatrix().translate(-1.5, 0, 3.5), // u_transform
        0, // u_tint
        [0, 1, 0, 1], // u_tintColor
        0, // u_uvShift
        1 // u_opacity
    ],
    "You", // name
    [35, 35], // hp
    [ // Items
        [0, -1], // itemIndex, durability left
        [1, 5],
        [2, 5],
        [3, 5],
    ],
    0 // souls
]

for (let i = 0; i < 4; i++)
{
    $("u" + i).onclick = () =>
    {
        if (player[6] >= upgradeCosts[upgradeLevels[i]] && upgradeLevels[i] < 9)
        {
            player[6] -= upgradeCosts[upgradeLevels[i]]
            events.push(EVENT_UPDATE_SOULS)
            upgradeLevels[i]++
            if (upgradeLevels[i] == 9)
            {
                $("c" + i).innerHTML = "Max level"
                $("u" + i).classList.add("dom-upgrade-unavailable")
            }
            else
            {
                $("c" + i).innerHTML = `${upgradeCosts[upgradeLevels[i]]} souls`
            }

            for (let j = 0; j < 4; j++)
            {
                if (player[6] < upgradeCosts[upgradeLevels[j]])
                {
                    $("u" + j).classList.add("dom-upgrade-unavailable")
                }
            }
        }
    }

    $("c" + i).innerHTML = "5 souls"

    $("i" + i).onmouseenter = () =>
    {
        if (player[5][i])
        {
            $("i" + i).style.background = "#777a"
            $("dom-tooltip").classList.remove("dom-hide")
            $("dom-tooltip-header").textContent = itemDefinitions[player[5][i][0]][0]
            $("dom-tooltip-body").textContent = "Power: " + itemDefinitions[player[5][i][0]][2]
        }
    }

    $("i" + i).onmouseleave = () =>
    {
        $("i" + i).style.background = "#000a"
        $("i" + i).classList.remove("dom-pointer")
        $("dom-tooltip").classList.add("dom-hide")
    }

    $("i" + i).onmousemove = (event) =>
    {
        $("dom-tooltip").style.left = event.clientX + 16 + "px"
        $("dom-tooltip").style.top = event.clientY + 16 + "px"

        if (playerCanAct)
        {
            $("i" + i).classList.add("dom-pointer")
        }
    }

    $("i" + i).onclick = () =>
    {
        if (player[5][i] && playerCanAct)
        {
            if (~activeItemIndex)
            {
                if (activeItemIndex == i)
                {
                    activeItemIndex = -1
                    $("dom-inventory-active").classList.add("dom-hide")
                }
                else
                {
                    activeItemIndex = i
                    $("dom-inventory-active").style.left = i * 110 + "px"
                }
            }
            else
            {
                activeItemIndex = i
                $("dom-inventory-active").style.left = i * 110 + "px"
                $("dom-inventory-active").classList.remove("dom-hide")
            }
        }
    }
}

$("dom-reincarnate").onclick = () =>
{
    $("dom-upgrade").classList.add("dom-hide")
    events.push(EVENT_UPDATE_LIVES, EVENT_BACK_TO_START)
}
