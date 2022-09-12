import { $, events, updateMouse } from "./common"
import { EVENT_ROOM_START } from "./event-enum"
import { initRenderer, render } from "./gl"
import { update } from "./scene"

let running
let previousTimestamp = 0

const loop = (timestamp) =>
{
    const dt = (timestamp - previousTimestamp) / 1000
    previousTimestamp = timestamp

    if (running)
    {
        updateMouse()
        update(dt)
        render()
    }

    requestAnimationFrame(loop)
}

$("dom-start").onclick = () =>
{
    initRenderer()
    events.push(EVENT_ROOM_START)
    $("dom-intro").classList.add("dom-hide")
    running = true
}

requestAnimationFrame(loop)
