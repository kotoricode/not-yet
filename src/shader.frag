#version 300 es
precision highp float;

in vec2 v_texcoord;
in vec4 v_world;
out vec4 out_color;

uniform sampler2D u_texture;
uniform float u_tint;
uniform vec4 u_tintColor;
uniform int u_fragMode, u_pickColor;
uniform bool u_pickMode;
uniform float u_opacity;

void main()
{
    vec4 l_texture = texture(u_texture, v_texcoord);

    out_color =
        u_pickMode ? vec4(vec3(float(u_pickColor) / 255.), 1) * ceil(l_texture.a) :
        u_fragMode == 0 ? l_texture * u_opacity : 
        u_fragMode == 1 ? vec4(((v_world.z - 2.) / 3. * .4 + .6) * mix(l_texture, l_texture.a * u_tintColor, u_tint).rgb, 1) :
        mix(l_texture, l_texture.a * u_tintColor, u_tint);
}
