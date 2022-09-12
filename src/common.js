export const events = []

export const $ = (id) => document.getElementById(id)

export const createImage = (src) =>
{
    const image = new Image()
    image.src = URL.createObjectURL(new Blob([src], { type: "image/svg+xml" }))
    return image
}

let clickPending
let clicked
let onCanvas

export const mouseClientPos = [0, 0]

export const viewProjectionMatrix = new DOMMatrix([
    9 / Math.tan(Math.PI / 12) / 16, 0, 0, 0,
    0, 1 / Math.tan(Math.PI / 12), 0, 0,
    0, 0, -50 / 49, -1,
    0, 0, -99 / 49, 0
]).multiply(
    new DOMMatrix()
        .translate(0, 1.8, 10)
        .rotate(-10, 0, 0)
        .inverse()
)

export const viewProjection = viewProjectionMatrix.toFloat32Array()

export const getClicked = () => clicked

export const getOnCanvas = () => onCanvas

export const updateMouse = () =>
{
    clicked = clickPending
    clickPending = 0
}

export const canvas = $("dom-canvas")

canvas.onmouseenter = () => onCanvas = 1

canvas.onmouseleave = () => onCanvas = 0

canvas.onmousemove = event =>
{
    mouseClientPos[0] = event.clientX | 0
    mouseClientPos[1] = 576 - event.clientY | 0
}

canvas.onclick = event => clickPending = +!event.button

export const roomColors = [
    [197, 230, 247],
    [170, 238, 217],
    [147, 225, 152],
    [174, 210, 127],
    [191, 175, 110],
    [169, 108, 96]
]
