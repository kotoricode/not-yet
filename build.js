import esbuild from "esbuild"
import fs from "fs"
import process from "process"

const minify = process.argv.includes("minify")
const watch = process.argv.includes("watch")

const minifyGlsl = input => input
    .replace(/\r/g,         "") // carriage return
    .replace(/\/\/[^\n]*/g, "") // comments
    .replace(/(?<!es)\n/g,  "") // newlines except after directive
    .replace(/ {2,}/g,     " ") // multiple spaces
    .replace(/;\s+/g,      ";") // whitespace after ;
    .replace(/\s*{\s*/g,   "{") // whitespace around {
    .replace(/\s*}\s*/g,   "}") // whitespace around }
    .replace(/\s*\(\s*/g,  "(") // whitespace around (
    .replace(/\s*\)\s*/g,  ")") // whitespace around )
    .replace(/\s*=\s*/g,   "=") // whitespace around =
    .replace(/\s*,\s*/g,   ",") // whitespace around ,
    .replace(/\s*\+\s*/g,  "+") // whitespace around +
    .replace(/\s*-\s*/g,   "-") // whitespace around -
    .replace(/\s*\*\s*/g,  "*") // whitespace around *
    .replace(/\s*\/\s*/g,  "/") // whitespace around /
    .replace(/\s*>\s*/g,   ">") // whitespace around >
    .replace(/\s*<\s*/g,   "<") // whitespace around <
    .replace(/\s*\^\s*/g,  "^") // whitespace around ^
    .replace(/\s*\?\s*/g,  "?") // whitespace around ?
    .replace(/\s*:\s*/g,   ":") // whitespace around :

const minifyGlslVariables = input =>
{
    let result = input

    const variables = [
        "l_texture",
        "u_texture",
        "u_transform",
        "u_viewProjection",
        "v_texcoord",
        "v_world",
        "a_position",
        "a_texcoord",
        "out_color",
        "u_tintColor",
        "u_tint",
        "u_vertMode",
        "u_fragMode",
        "u_uvMultiplier",
        "u_pickMode",
        "u_uvShift",
        "u_pickColor",
        "u_opacity"
    ].sort().reverse()

    for (let i = 0; i < variables.length; i++)
    {
        result = result.replaceAll(variables[i], "abcdefghijklmnopqrstuvxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"[i])
    }

    return result
}

const minifyIdsClasses = input =>
{
    let result = input

    const idsClasses = [
        "dom-hide",
        "dom-intro",
        "dom-start",
        "dom-container",
        "dom-canvas",
        "dom-map",
        "dom-map-ui",
        "dom-pointer",
        "dom-ui",
        "dom-lives",
        "dom-inventory",
        "dom-inventory-slots",
        "dom-inventory-active",
        "dom-tooltip",
        "dom-tooltip-header",
        "dom-tooltip-body",
        "dom-map-bg",
        "dom-map",
        "dom-map-title",
        "dom-next-room",
        "dom-damage",
        "dom-turn",
        "dom-souls",
        "dom-outro",
        "dom-game-over",
        "dom-upgrade",
        "dom-upgrade-selections",
        "dom-upgrade-unavailable",
        "dom-reincarnate",
        "dom-fade"
    ].sort().reverse()

    for (let i = 0; i < idsClasses.length; i++)
    {
        result = result.replaceAll(idsClasses[i], "abcdefghijklmnopqrstuvxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"[i])
    }

    return result
}

const glslPlugin = {
    name: "glsl",
    setup(build)
    {
        build.onLoad({ filter: /\.(?:vert|frag)$/u }, args => ({
            loader: "text",
            contents: minifyGlslVariables(minifyGlsl(fs.readFileSync(args.path, "utf-8")))
        }))
    }
}

const jsGlslPlugin = {
    name: "jsglsl",
    setup(build)
    {
        build.onLoad({ filter: /\.js$/u }, args => ({
            loader: "js",
            contents: minifyGlslVariables(fs.readFileSync(args.path, "utf-8"))
        }))
    }
}

const result = await esbuild.build({
    bundle: true,
    color: true,
    entryPoints: ["src/main.js"],
    minify,
    plugins: [glslPlugin, jsGlslPlugin],
    watch,
    write: false,
})

const js = result.outputFiles[0].text

const html = fs.readFileSync("./dist/index.html", {encoding: "utf8"})
const htmlWithScript = html.replace("SCRIPT_GOES_HERE", js)
fs.writeFileSync("./dist/index.html", minifyIdsClasses(htmlWithScript))
