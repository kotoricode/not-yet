import {
    ARRAY_BUFFER, BLEND, CLAMP_TO_EDGE, COLOR_ATTACHMENT0, COLOR_BUFFER_BIT, DEPTH_ATTACHMENT, DEPTH_BUFFER_BIT,
    DEPTH_COMPONENT16, DRAW_FRAMEBUFFER, FLOAT, FRAGMENT_SHADER, FRAMEBUFFER, MAX_SAMPLES, MAX_TEXTURE_MAX_ANISOTROPY_EXT,
    NEAREST, ONE, ONE_MINUS_SRC_ALPHA, READ_FRAMEBUFFER, RENDERBUFFER, RGBA, RGBA8, SCISSOR_TEST, STATIC_DRAW, TEXTURE_2D,
    TEXTURE_MAX_ANISOTROPY_EXT, TEXTURE_WRAP_S, TEXTURE_WRAP_T, TRIANGLE_STRIP, UNSIGNED_BYTE, VERTEX_SHADER
} from "./gl-enum"

import vsSrc from "./shader.vert"
import fsSrc from "./shader.frag"
import { canvas, createImage, viewProjection, mouseClientPos } from "./common"
import { backgroundEntities, units } from "./scene"

const createTexture = (clamp, src) =>
{
    const texture = gl.createTexture()
    const image = createImage(src)
    image.onload = () =>
    {
        createImageBitmap(image).then(bitmap =>
        {
            gl.bindTexture(TEXTURE_2D, texture),
            gl.texImage2D(TEXTURE_2D, 0, RGBA, RGBA, UNSIGNED_BYTE, bitmap),
            gl.texParameterf(TEXTURE_2D, TEXTURE_MAX_ANISOTROPY_EXT, gl.getParameter(MAX_TEXTURE_MAX_ANISOTROPY_EXT))

            if (clamp)
            {
                gl.texParameteri(TEXTURE_2D, TEXTURE_WRAP_S, CLAMP_TO_EDGE)
                gl.texParameteri(TEXTURE_2D, TEXTURE_WRAP_T, CLAMP_TO_EDGE)
            }

            gl.generateMipmap(TEXTURE_2D)
        })
    }

    return texture
}

const createFramebufferTexture = () =>
{
    const texture = gl.createTexture()
    gl.bindTexture(TEXTURE_2D, texture)
    gl.texStorage2D(TEXTURE_2D, 1, RGBA8, 1024, 576)
    return texture
}

export const initRenderer = () =>
{
    const buffer = new Float32Array([
        // Scene texture coordinates 0
        0, 1,
        1, 1,
        0, 0,
        1, 0,

        // Screen texture coordinates 8
        0, 0,
        1, 0,
        0, 1,
        1, 1,

        // Screen model 16
        -1, -1, 0,
        1, -1, 0,
        -1, 1, 0,
        1, 1, 0,

        // Character model 28
        -.375, 0, 0,
        .375, 0, 0,
        -.375, 1.5, 0,
        .375, 1.5, 0,

        // Ground model 40
        -2.4, 0, 2,
        2.4, 0, 2,
        -2.4, 0, 5,
        2.4, 0, 5,

        // Wall back model 52
        -2.4, 0, 2,
        2.4, 0, 2,
        -2.4, 2, 2,
        2.4, 2, 2,

        // Wall left model 64
        -2.4, 0, 2,
        -2.4, 0, 5,
        -2.4, 2, 2,
        -2.4, 2, 5,

        // Wall right model 76
        2.4, 0, 2,
        2.4, 0, 5,
        2.4, 2, 2,
        2.4, 2, 5,

        // Shadow model 88
        -.4, 0, -.4,
        .4, 0, -.4,
        -.4, 0, .4,
        .4, 0, .4,

        // Character model big 100
        -.75, 0, 0,
        .75, 0, 0,
        -.75, 1.5, 0,
        .75, 1.5, 0,
    ])

    gl.bindBuffer(ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(ARRAY_BUFFER, buffer, STATIC_DRAW)

    program = gl.createProgram()
    const vs = gl.createShader(VERTEX_SHADER)
    const fs = gl.createShader(FRAGMENT_SHADER)
    gl.shaderSource(vs, vsSrc)
    gl.shaderSource(fs, fsSrc)
    gl.compileShader(vs)
    gl.compileShader(fs)
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    gl.useProgram(program)
    gl.enableVertexAttribArray(0)
    gl.enableVertexAttribArray(1)

    gl.getExtension("EXT_texture_filter_anisotropic")
    textures = [
        // player
        createTexture(1, '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 256" width="128" height="256"><path d="m104 35s7-16 4-30c-5 0-21 15-21 15" fill="#ccccd3"/><path d="m100 75s1 23 5 36c-5-5-8-16-8-16-2 3-1 8-1 8-4-2-6-7-6-7l1 7-46-7-1 5c-1-2-2-6-2-6l-1 9s-3-5-5-10l-1 5c-3-4-7-22-7-22" fill="#304873"/><path d="m99 59 12 3c0 29-7 32-6 49-5-4-6-52-6-52z" fill="#3f5f97"/><path d="m7 110c38 15-6 52 50 65" fill="none" stroke="#ccccd3" stroke-linecap="round" stroke-width="10"/><path d="m45 171c-4 12 2 37 2 37l-1 4-2-1 1 5-2-1c1 4 3 10 3 27-1 3-2 15 4 13 1 1 3 1 4 0 1 1 3 1 4 0 5 1 2-9 0-12-2-10 5-30 5-34 4-8 4-22 4-22s0 15 2 21l-1 4-2-1 1 5-2-1c1 4 3 10 3 27-1 3-2 15 4 13 1 1 3 1 4 0 1 1 3 1 4 0 5 1 2-9 0-12-2-10 5-30 5-34 2-7 7-16 7-34" fill="#ccccd3"/><path d="m89 167c-1 8 1 13 4 11 1 1 3 1 4 0 1 1 4 0 4-1 4 1 3-8-1-11" fill="#ccccd3"/><path d="m90 160s-1 4 0 8c2 1 9 0 10-2 0-4-1-6-1-6" fill="#ff7520"/><path d="m84 101s6 1 9 5c5 7 4 32 4 32 0 2 4 20 3 22-2 4-11 3-11 3" fill="#549a95"/><path d="m86 103h-36l2-11 33 1z" fill="#c23900"/><path d="m90 114c0 5 6 12 3 18-2 4-3 7-3 7s-4 13 1 26" fill="none" stroke="#437c78" stroke-width="2"/><path d="m78 99 9 3-13 14-19-17 2-1" fill="#ccccd3"/><path d="m43 177s-1 6 0 8c14 8 47 7 49 1 1-3 0-9 0-9" fill="#ff7520"/><path d="m91 113c0 10 5 13 2 19 0 0-9 17-2 30 2 5 4 14 2 19-2 4-26 5-42 1l1-75 23 5 10-10z" fill="#549a95"/><path d="m52 114-1 17" stroke="#437c78" stroke-width="2"/><path d="m49 126c-1 15 2 19 1 22-4 11-7 31-7 31s4 2 8 3c0 0 1-24 8-31 13-13 30-1 30-1 0-10 4-18 4-18s-7 3-17-1c-2 3-16 5-27-5z" fill="#437c78"/><path d="m36 170c-1 8 1 13 4 11 1 1 3 1 4 0 1 1 4 0 4-1 4 1 3-8-1-11" fill="#ccccd3"/><path d="m36 163s-1 3 0 7c2 1 10 1 11-1 0-5-1-6-1-6" fill="#ff7520"/><path d="m54 107c2-1-6 34-6 34s1 20-1 23c-1 2-10 2-12 0-3-3-2-25-2-25s1-25 8-33c4-4 7-4 7-4" fill="#549a95"/><path d="m53 96c3 7 19 12 21 15 1-2 9-7 11-12s-9-7-16-7c-20 0-16 4-16 4zm36 3c2 2 1 5 1 5-1 2-10 11-16 8-6 3-16-2-27-9-2-1-3-4 0-7 0 0-5-7 22-7 20 0 20 10 20 10z" fill="#ff7520"/><path d="m74 94s0 3 1 4l3 1c2 4-12 7-21-1l2-1c1-2 2-10 2-10" fill="#9e9eab"/><path d="m103 74s-1-1-3-2c-1-8 1-34 1-34s-53-34-54 41c0 8 28 18 32 17 9-3 18-10 21-17 1-1 2-1 3-1 0 0-1-2-3-3 1-1 3-1 3-1z" fill="#ccccd3"/><path d="m101 31 5-6h-4l4-6-7 3 1-7-4 5-2-4-3 6" fill="#fff"/><path d="m100 64c0-13-9-20-9-20-1 17-9 24-9 24v-4c-3 5-10 5-10 5 4-15-1-26-1-26s-4 11-15 16c-8 8-4 38 1 52-7-4-15-17-17-25l1 18s-7-10-9-25l-1 17c-7-20-9-41-3-56 0 0-3 2-9 1 8-2 13-9 14-10 3-5 6-8 11-11 8-6 20-7 20-7 2-6-6-11 6-1 16-9 10-8 7 1 35 4 35 34 44 38-6 0-9-6-9-6s5 11 4 37c0 0-2-6-3-7 1 7 0 16 0 16-2-13-13-27-13-27z" fill="#3f5f97"/><path d="m83 78c-2 0-5-2-4-3s5-1 6 0-1 3-2 3z" fill="#004"/><path d="m87 85s-5 3-6 0c-1 3-10 0-10 0s7 4 10 2c3 2 6-2 6-2z" fill="#004"/><path d="m87 64c-1 0-2 9 3 8 3 0 5-1 5-1 7-3 5-11 5-11-7 0-13 4-13 4zm-16 0c1 6-1 8-4 8s-6-1-6-1c-8-2-6-9-5-11 8-2 15 4 15 4z" fill="#fff"/><path d="m91 61c-2 1-3 8-1 11 3 0 5-1 5-1 2-2 3-9 2-11m-29 1c1 2 1 9-1 11-3 0-6-1-6-1-2-1-2-11 1-12" fill="#097e81"/><g fill="#20304d"><path d="m57 60s-2 3-1 8c-2-2-2-5-2-7m1 1-4-2c18-8 22 7 22 7-9-12-18-5-18-5zm9-8c1 2 7 3 8 2 0-3-9-4-8-2zm30 0c-1 2-6 3-7 2 0-3 8-4 7-2zm10 7c-5-4-16-4-20 6 6-7 14-7 17-5zm-5 0s1 3 0 7c2-2 2-7 2-7"/></g><g fill="#ccccd3"><path d="m35 36s-7-16-4-30c5 0 21 15 21 15l-4 2c-6 4-10 9-10 9z"/><path d="m54 71c-3 0-6 2-6 2l3 1s-3 1-4 4c0 0 4-1 5 0"/></g><path d="m64 70c1 0 3-8 1-8s-2 8-1 8zm29 0c1 0 3-8 1-8s-2 8-1 8z" fill="#004"/><path d="m38 32-5-6h4l-4-6 6 2v-6l4 5 2-4 3 6c-6 4-10 9-10 9z" fill="#fff"/><g stroke="#fff" stroke-linecap="round" stroke-width="2"><path d="m68 110c0 7 2 9 2 16"/><path d="m79 110c0 5 4 9 5 15"/></g></svg>'),

        // tile
        createTexture(0, '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><defs><filter id="a" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feTurbulence stitchTiles="stitch" baseFrequency=".3" type="fractalNoise"/><feColorMatrix type="saturate"/><feComposite in="SourceGraphic" k1="1.25" k2=".5" k3=".5" operator="arithmetic"/></filter></defs><rect width="64" height="64" fill="#c9c9c9" filter="url(#a)" style="paint-order:stroke fill markers"/><g fill="none" stroke="#000" stroke-width="2"><path d="m0 32h64"/><path d="m32 64v-32"/><path d="m0 0h64"/><path d="m0 0v32"/><path d="m64 0v32"/><path d="m0 64h64"/></g></svg>'),

        // shadow
        createTexture(1, '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><defs><radialGradient id="a" cx="32" cy="32" r="32" gradientUnits="userSpaceOnUse"><stop stop-color="#0004" offset="0"/><stop stop-color="#0000" offset="1"/></radialGradient></defs><circle cx="32" cy="32" r="32" fill="url(#a)"/></svg>'),

        // miasma
        createTexture(0, '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><defs><filter id="a" x="0" y="0" width="1" height="1"><feTurbulence stitchTiles="stitch" baseFrequency=".13" type="fractalNoise"/><feColorMatrix type="saturate"/></filter></defs><rect width="128" height="128" fill="#fff" filter="url(#a)"/></svg>'),

        // skeleton
        createTexture(1, '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 256" width="128" height="256"><path d="m62 160-4 45 3 35c2 2 6 9-7 15-2 1-9-1-9-5 0-5 10-10 10-10l-5-35 3-46m35 1-4 45 3 35c2 2 6 9-7 15-2 1-9-1-9-5 0-5 10-10 10-10l-5-35 3-46" fill="#c0c0c0"/><path d="m47 155c4-9 25-1 25-1s18-5 23 1c15 20-60 30-48 0z" fill="#d0d0d0"/><path d="m65 90 12 65c1 3-10 6-10 0z" fill="#c0c0c0"/><path d="m42 93-10 32-15 22c-17 3 3 21 3 3l16-22 9-26.75" fill="#c0c0c0"/><path d="m85 141c-12 2-21-8-23-16 0 5-6 20-15 15-6-4-9-46-4-51 10-9 35-10 45 0s6 48-3 52z" fill="#d0d0d0"/><path d="m88 93 21 33 4 31c15 12-14 20-5 1l-3-29-21-28" fill="#c0c0c0"/><path d="m66 40 4 43c1 3-12 6-12 0z" fill="#c0c0c0"/><path d="m30 48s-3-18 0-25c10-25 88-20 50 40-2 3-12-0-14 1-8 4-6 13-11 15s-10 2-15 0c-8-4 0-14-7-19-5-3-6-8-3-12z" fill="#d0d0d0"/><path d="m61 53c-4 1-8 0-8-5 0-4 0-8 6-7s8 1 8 4c0 5-1 7-6 8zm-25-1c4 1 8 0 8-5 0-4 0-8-6-7-5 1-7 1-7 4 0 4 0 7 5 8zm11 7c-3 3-2-6 0-6s4 9 0 6z" fill="#10216a"/><path d="m44 67v6m4-5v6m4-7v6m4-7v6m-16-6v6m-2-5s9 8 20 0" fill="none" stroke="#10216a" stroke-linecap="round" stroke-linejoin="round"/></svg>'),

        // skeleton club
        createTexture(1, '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 256" width="128" height="256"><path d="m62 160-4 45 3 35c2 2 6 9-7 15-2 1-9-1-9-5 0-5 10-10 10-10l-5-35 3-46m35 1-4 45 3 35c2 2 6 9-7 15-2 1-9-1-9-5 0-5 10-10 10-10l-5-35 3-46" fill="#c0c0c0"/><path d="m47 155c4-9 25-1 25-1s18-5 23 1c15 20-60 30-48 0z" fill="#d0d0d0"/><path d="m65 90 12 65c1 3-10 6-10 0z" fill="#c0c0c0"/><path d="m42 93-7 35-8 24c-17 3 3 21 3 3l9-24 6-29.75" fill="#c0c0c0"/><path d="m85 141c-12 2-21-8-23-16 0 5-6 20-15 15-6-4-9-46-4-51 10-9 35-10 45 0s6 48-3 52z" fill="#d0d0d0"/><path d="m88 93 21 33 4 31c15 12-14 20-5 1l-3-29-21-28" fill="#c0c0c0"/><path d="m66 40 4 43c1 3-12 6-12 0z" fill="#c0c0c0"/><path d="m30 48s-3-18 0-25c10-25 88-20 50 40-2 3-12-0-14 1-8 4-6 13-11 15s-10 2-15 0c-8-4 0-14-7-19-5-3-6-8-3-12z" fill="#d0d0d0"/><path d="m61 53c-4 1-8 0-8-5 0-4 0-8 6-7s8 1 8 4c0 5-1 7-6 8zm-25-1c4 1 8 0 8-5 0-4 0-8-6-7-5 1-7 1-7 4 0 4 0 7 5 8zm11 7c-3 3-2-6 0-6s4 9 0 6z" fill="#10216a"/><path d="m44 67v6m4-5v6m4-7v6m4-7v6m-16-6v6m-2-5s9 8 20 0" fill="none" stroke="#10216a" stroke-linecap="round" stroke-linejoin="round"/><path d="m18 111c3 10 1 30 12 52 2 3-1 6-3 3-10-22-22-34-25-49s13-16 16-6z" fill="#8c6853"/></svg>'),

        // mummy
        createTexture(1, '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 256" width="128" height="256"><defs><filter id="b" x="-.2" y="-.2" width="1.4" height="1.4" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".5"/></filter><filter id="a" x="-.2" y="-.2" width="1.4" height="1.4" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="m76 72-1 5c2 2 26 0 31 35 0 0 15 41 1 41-10 0-12-39-12-39-2-9-6-14-6-14 2 18 6 57 6 57l-7 92c-3 5-27 9-26 1 0-2 10-7 10-7l-2-74-5 1-10 80c-8 6-31 6-24-1l10-9c0-29 1-107 3-139 0-4 1-7 1-10 0-1 1 17-3 28s-1 37-10 35c-10-2-5-24 1-38 3-35 27-38 28-39s0-4 0-4c-20-4-26-57 8-57 46 0 23 58 7 56z" fill="#000028"/><path d="m95 29-40-1 41 5c1 6-1 18-1 18l-30 2 29 1c-1 6-7 12-7 12l-21 2 15 3-5 2v4s11 3 12 4l-14 6 19-3s6 6 8 10l-4 9 7-3 2 11-6 7 7-5 2 8 3 9-7 4 7-2 2 11-11-3 10 5c0 3-2 7-2 7l-6-4s3 24-2 37l-4-4c5-16 2-32 2-32l-4-14 7-12-8 4-1-11 6-3h-7l-3-9 6-10-22 1 14 5 2 9-21-1 21 5 1 14-27 1 28 2 2 25-25 5h25v9l-15 6h14l-1 15-13 5 13-2-2 24-16 8 16-3s-2 25-3 28l-4 2-11-5 5 7-6 1-10-6 10-8 13-2-14-4-1-24 15-6-15-5v-12l15-3-15-4s-1-11-3-11-4 22-4 22l-10 3 9 1-3 28-15 1 15 2-4 24-9 3c-3 1-17-3-17-3l4-5 10 4-6-7 4-4 11 1-11-5-1-24 14-2-14-2 1-16 14-1-14-6v-8l14-1-14-5 1-10 23-5h-24l1-10 33-2-34-6 2-18h34l-34-3 1-13 16-3h-15l-1 8-5-1 5 3-1 8-4 1 3 2-2 15h-6l6 6-3 10c0 14-7 24-5 41h-4c-3-18 4-33 5-43l-6-1-1-3 8-3-8-2 3-16 9-1-7-4 2-4 6-2h-6l3-16 7 1-4-6s3-5 7-8l14 3-10-6c4-3 10-5 10-5l13-1-12-2s-8-4-12-10l30-4-31 1s-3-8-4-15l15 1 18-2 5-5-22-4-15 2c0-5 5-14 5-14h32l-27-4c13-12 39-1 40 9z" fill="#fffcd7"/><circle cx="70" cy="41" r="3" fill="#f00" filter="url(#b)"/><circle cx="52" cy="41" r="3" fill="#f00" filter="url(#a)"/></svg>'),

        // ghost
        createTexture(1, '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 256" width="128" height="256"><defs><linearGradient id="a" x1="65" x2="65" y1="95" y2="210" gradientUnits="userSpaceOnUse"><stop stop-color="#eef" offset="0"/><stop stop-color="#eef0" offset="1"/></linearGradient></defs><path d="m60 15c28 0 37 23 34 53 0 0 6 11 27 10-13 13-32 11-32 11-12 6 5 35-11 73-9 17-25 30-18 43-14-16 6-26 4-51-6-39-26-32-31-69 0 0-13-2-25-16 16 4 23-2 23-2 1-49 29-52 29-52z" fill="url(#a)"/><circle cx="70" cy="41" r="3" fill="#000029"/><circle cx="52" cy="41" r="3" fill="#000029"/><path d="m45 55s5 15 15 15c8 0 19-15 19-15-3 0-4 2-7 0-4-2-6 3-8 3-4 0-3-5-7-3-9 5-7 0-12 0z" fill="#7c0000"/></svg>'),

        // reaper
        createTexture(1, '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256"><path d="m93 89c10-9 35-10 45 0s-50 5-45 0z" fill="#d0d0d0"/><path d="m125 55s0 35-40 35l-5-35zm53 62c18 5 13 47-8 48 0 0-1-42 8-48z" fill="#1f1f3f"/><path d="m172 128c-1-6 6-15 16-8 9 6-3 23-16 8zm-103 35c-1-14 16-8 16-8 9 6-12 24-16 8z" fill="#c0c0c0"/><path d="m80 48s-3-18 0-25c10-25 88-20 50 40-2 3-12 0-14 1-8 4-6 13-11 15s-10 2-15 0c-8-4 0-14-7-19-5-3-6-8-3-12z" fill="#d0d0d0"/><path d="m111 53c-4 1-8 0-8-5 0-4 0-8 6-7s8 1 8 4c0 5-1 7-6 8zm-25-1c4 1 8 0 8-5 0-4 0-8-6-7-5 1-7 1-7 4 0 4 0 7 5 8zm11 7c-3 3-2-6 0-6s4 9 0 6z" fill="#af0000"/><path d="m94 67v6m4-5v6m4-7v6m4-7v6m-16-6v6m-2-5s9 8 20 0" fill="none" stroke="#af0000" stroke-linecap="round" stroke-linejoin="round"/><path d="m96 34c-22 3-15 41-9 46 5 4 19 5 23 0 5-10 9-47-14-46zm-26 216c0-32 6-90 6-90l-8-1c2-39 14-59 14-59s-22-60 3-85c15-15 75-20 85 40-10 0-25-15-25-15 4 23-9e-5 35-5 65 0 0 10-0 38 12 0 0-8 23-8 48-10-25-35-41-35-40-5 34 2 85 10 105 5 15 27 17 25 20 0 0-65 5-100 0z" fill="#2f2f2f"/><path d="m190 45c-7 67-13 133-20 200" fill="none" stroke="#673834" stroke-linecap="round" stroke-width="6"/><path d="m190 45s50 25 50 85c0 0-8-43-53-58" fill="#d0d0d0"/></svg>')
    ]

    fboScene = gl.createFramebuffer()
    gl.bindFramebuffer(FRAMEBUFFER, fboScene)

    rboColor = gl.createRenderbuffer()
    gl.bindRenderbuffer(RENDERBUFFER, rboColor)
    gl.renderbufferStorageMultisample(RENDERBUFFER, gl.getParameter(MAX_SAMPLES), RGBA8, 1024, 576)
    gl.framebufferRenderbuffer(FRAMEBUFFER, COLOR_ATTACHMENT0, RENDERBUFFER, rboColor)

    rboDepth = gl.createRenderbuffer()
    gl.bindRenderbuffer(RENDERBUFFER, rboDepth)
    gl.renderbufferStorageMultisample(RENDERBUFFER, gl.getParameter(MAX_SAMPLES), DEPTH_COMPONENT16, 1024, 576)
    gl.framebufferRenderbuffer(FRAMEBUFFER, DEPTH_ATTACHMENT, RENDERBUFFER, rboDepth)

    fboImage = gl.createFramebuffer()
    gl.bindFramebuffer(FRAMEBUFFER, fboImage)
    fboImageTexture = createFramebufferTexture()
    gl.framebufferTexture2D(FRAMEBUFFER, COLOR_ATTACHMENT0, TEXTURE_2D, fboImageTexture, 0)
}

export const pickEntity = () =>
{
    gl.enable(SCISSOR_TEST)
    gl.scissor(mouseClientPos[0] - 16, mouseClientPos[1] - 16, 32, 32)

    gl.bindFramebuffer(FRAMEBUFFER, fboImage)
    gl.clear(COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT)

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_viewProjection"), 0, viewProjection)
    gl.uniform1i(gl.getUniformLocation(program, "u_pickMode"), 1)

    units.map((entity, i) =>
    {
        gl.uniform1i(gl.getUniformLocation(program, "u_pickColor"), i + 1)
        draw(entity)
    })

    gl.uniform1i(gl.getUniformLocation(program, "u_pickMode"), 0)
    gl.readPixels(mouseClientPos[0], mouseClientPos[1], 1, 1, RGBA, UNSIGNED_BYTE, pickDataArray)
    gl.disable(SCISSOR_TEST)

    return pickDataArray[0] - 1
}

export const render = () =>
{
    gl.bindFramebuffer(FRAMEBUFFER, fboScene)
    gl.clear(COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT)

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_viewProjection"), 0, viewProjection)

    backgroundEntities.map(draw)
    units.map(entity =>
    {
        draw([
            2, // texture index
            88, // model attribute offset
            [
                1, // u_vertMode
                2, // u_fragMode
                [1, 1], // u_uvMultiplier
                entity[2][3],
                0, // u_tint
                [0, 0, 0, 1], // u_tintColor
                0, // u_uvShift
                1 // u_opacity
            ]
        ])
    })
    units.map(draw)

    gl.bindTexture(TEXTURE_2D, fboImageTexture)
    gl.uniform1i(gl.getUniformLocation(program, "u_vertMode"), 0)
    gl.uniform1i(gl.getUniformLocation(program, "u_fragMode"), 0)
    gl.uniform2f(gl.getUniformLocation(program, "u_uvMultiplier"), 1, 1)
    gl.uniform1f(gl.getUniformLocation(program, "u_opacity"), 1)
    gl.vertexAttribPointer(0, 2, FLOAT, 0, 0, 32)
    gl.vertexAttribPointer(1, 3, FLOAT, 0, 0, 64)

    gl.bindFramebuffer(DRAW_FRAMEBUFFER, fboImage)
    gl.blitFramebuffer(
        0, 0, 1024, 576,
        0, 0, 1024, 576,
        COLOR_BUFFER_BIT,
        NEAREST
    )

    gl.bindFramebuffer(READ_FRAMEBUFFER, fboImage)
    gl.bindFramebuffer(DRAW_FRAMEBUFFER, null)

    gl.drawArrays(TRIANGLE_STRIP, 0, 4)
}

const draw = ([textureIndex, modelAttributeOffset, uniformValues]) =>
{
    gl.bindTexture(TEXTURE_2D, textures[textureIndex])
    gl.vertexAttribPointer(0, 2, FLOAT, 0, 0, 0)
    gl.vertexAttribPointer(1, 3, FLOAT, 0, 0, modelAttributeOffset*4)

    uniformValues.map((value, i) =>
    {
        if (uniformTypes[i] == "uniformMatrix4fv")
        {
            gl[uniformTypes[i]](gl.getUniformLocation(program, uniforms[i]), 0, value.toFloat32Array())
        }
        else
        {
            gl[uniformTypes[i]](gl.getUniformLocation(program, uniforms[i]), value)
        }
    })

    gl.drawArrays(TRIANGLE_STRIP, 0, 4)
}

const pickDataArray = new Uint8Array(4)

const uniformTypes = [
    "uniform1i",
    "uniform1i",
    "uniform2fv",
    "uniformMatrix4fv",
    "uniform1f",
    "uniform4fv",
    "uniform1f",
    "uniform1f"
]

const uniforms = [
    "u_vertMode",
    "u_fragMode",
    "u_uvMultiplier",
    "u_transform",
    "u_tint",
    "u_tintColor",
    "u_uvShift",
    "u_opacity"
]

let fboScene
let fboImage
let fboImageTexture
let rboColor
let rboDepth
let program
let textures

const gl = canvas.getContext("webgl2")
gl.enable(BLEND)
gl.blendFunc(ONE, ONE_MINUS_SRC_ALPHA)
gl.clearColor(0, 0, 0, 1)
