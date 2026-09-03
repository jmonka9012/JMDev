precision mediump float;

varying vec2 vTexCoord;
uniform sampler2D uTex;

void main() {
    vec4 texColor = texture2D(uTex, vTexCoord);
    gl_FragColor = texColor;
}