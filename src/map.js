import { $, events, roomColors } from "./common"
import { EVENT_ROOM_START, EVENT_FADE_OUT, EVENT_WAIT_500, EVENT_UPDATE_BACKGROUND } from "./event-enum"

let position = 0

const map =
    "11111111_______111111____________1" +
    "__222_2222222_22222_22__________2_" +
    "____33333_3_333333___333_______3__" +
    "______4______444444444444_____4___" +
    "______________5__555555_5555_5____" +
    "___________________66_______6_____"

export const getRoomColor = () => roomColors[position / 34 | 0]

export const getLayer = () => position / 34 | 0

export const getFinish = () => position == 33

export const setPlayerToBeginning = () => position = 0

export const isReincarnated = () => !position && ~clearedRooms.indexOf(0)

const clearedRooms = []

let panning = 0
let panStartX = 0
let translateX = 0
let deltaTranslateX = 0

const svgRooms = [...map].map(
    (a, i) => a == "_" ?
        "" :
        `<rect x=${(i % 34) * 72} y=${160 + (i / 34 | 0) * 44} width=64 height=36 fill=#${roomColors[i / 34 | 0].map(x => x.toString(16)).join("")} />`
).join("")

export const showMap = () =>
{
    const nextRooms = [-33, 1, 35]
        .map(x => x + position > 0 && x + position < 204 && map[x + position] != "_" ? x + position : 0)
        .filter(x => x)

    const svgNextRoom = [...map].map(
        (_, i) => nextRooms.includes(i) ?
            `<rect x=${(i % 34) * 72} y=${160 + (i / 34 | 0) * 44} ` +
                `width=64 height=36 stroke=#ff7520 stroke-linecap=round stroke-width=6 class=dom-next-room data-i=${i} />`
            : ""
    ).join("")

    const svgCleared = [...map].map(
        (_, i) => clearedRooms.includes(i) ?
            `<path d="m${41 + (i % 34) * 72} ${166 + (i / 34 | 0) * 44}s5 11 6 19m-14-21s6 13 8 25m-17-24s7 14 10 26m-16-20s6 11 8 18"` +
                "stroke=#ff7520 stroke-linecap=round stroke-width=3 />"
            : ""
    ).join("")

    const player =
        `<g style="translate: ${16 + (position % 34) * 72}px ${162 + (position / 34 | 0) * 44}px" >` +
            "<g stroke=#ff7520 stroke-width=6 stroke-linejoin=round>" +
                "<ellipse cx=16 cy=19 rx=12 ry=10 />" +
                '<path d="m5 4 8 6-7 4z"/>' +
                '<path d="m27 4-8 6 7 4z"/>' +
            "</g>" +
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

    $("dom-map-g").innerHTML = svgNextRoom + svgRooms + svgCleared + player

    document.querySelectorAll(".dom-next-room").forEach(element =>
        element.onclick = () => changeRoom(+element.dataset.i)
    )

    translateX = ((position % 34) + 1) * -72 + 512
    $("dom-map-g").style.translate = translateX + "px"
    $("dom-map-ui").classList.remove("dom-hide")
}

export const hideMap = () =>
{
    $("dom-map-ui").classList.add("dom-hide")
}

const changeRoom = (i) =>
{
    if (!~clearedRooms.indexOf(position))
    {
        clearedRooms.push(position)
    }

    position = i

    if (~clearedRooms.indexOf(position))
    {
        events.push(EVENT_UPDATE_BACKGROUND)
        showMap()
    }
    else
    {
        hideMap()
        events.push(EVENT_FADE_OUT, EVENT_WAIT_500, EVENT_ROOM_START)
    }
}

$("dom-map-bg").onmousedown = event =>
{
    panning = 1
    panStartX = event.clientX
    deltaTranslateX = 0
}

$("dom-map").onmouseup = () =>
{
    if (panning)
    {
        panning = 0
        translateX += deltaTranslateX
    }
}

$("dom-map-g").style.translate = translateX + deltaTranslateX + "px"

$("dom-map").onmousemove = event =>
{
    if (panning)
    {
        deltaTranslateX = event.clientX - panStartX

        if (translateX + deltaTranslateX > 512)
        {
            deltaTranslateX = 512 - translateX
            panStartX = event.clientX - deltaTranslateX
        }
        if (translateX + deltaTranslateX < -1928)
        {
            deltaTranslateX = -1928 - translateX
            panStartX = event.clientX - deltaTranslateX
        }

        $("dom-map-g").style.translate = translateX + deltaTranslateX + "px"
    }
}
