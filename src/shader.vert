#version 300 es

layout (location = 0) in vec2 a_texcoord;
layout (location = 1) in vec3 a_position;
out vec2 v_texcoord;
out vec4 v_world;

uniform mat4 u_viewProjection, u_transform;
uniform int u_vertMode;
uniform vec2 u_uvMultiplier;
uniform float u_uvShift;

void main()
{
    gl_Position =
        u_vertMode == 0 || u_vertMode == 2 ? vec4(a_position, 1) :
        u_viewProjection * u_transform * vec4(a_position, 1);

    v_texcoord =
        u_vertMode == 2 ? a_texcoord * u_uvMultiplier + vec2(u_uvShift) :
        a_texcoord * u_uvMultiplier;

    v_world = u_transform * vec4(a_position, 1);
}
