precision mediump float;

varying vec2 vTexCoord; // [x,y] piksela

uniform sampler2D uBgData;
uniform vec2 uBgSize;
uniform sampler2D uTex;
uniform sampler2D uSubArray;
uniform vec2 uSubSize;
uniform vec2 uCharUVSize;
uniform float uTime;
uniform float uVelocity;
uniform float uCharCount;

uniform vec2 uMouseGrid;
uniform vec2 uMousePixel;
uniform vec2 uPastedCharSize;
uniform vec2 uScreenSize;
uniform float uLineColorsNum;

// --- FUNKCJE POMOCNICZE ---
float random(vec2 p) {
    vec3 p3  = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec4 permute(vec4 x) {return mod(((x * 34.0) + 1.0) * x, 289.0);}
vec4 taylorInvSqrt(vec4 r) {return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    vec3 ns = (1.0 / 7.0) * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// --- GŁÓWNY PROGRAM ---
void main() {
    vec2 gridUV = vTexCoord * uBgSize;
    vec2 cellCoords = floor(gridUV);
    vec2 localUV = fract(gridUV);
    vec2 pixelCoords = vTexCoord * uScreenSize;

    vec4 data = texture2D(uBgData, (cellCoords + 0.5) / uBgSize);
    float draw = floor(data.b * 255.0 + 0.5);
    float alpha = floor(data.a * 255.0 + 0.5);

    float normalNoise = clamp((snoise(vec3(cellCoords * 0.1, uTime * 0.5)) + 1.0) * 0.5, 0.0, 0.999);
    float fastNoise = clamp((snoise(vec3(cellCoords * 0.1, uTime * 2.5)) + 1.0) * 0.5, 0.0, 0.999);

    // Stan końcowy piksela
    float outChar = 0.0;
    float outColor = 255.0; // Domyślnie brak koloru
    bool isVisible = false;

    // --- 1. WARSTWA TŁA (HOVER) ---
    float dist = distance(pixelCoords, uMousePixel);
//    bool inHoverGlow = (dist < 120.0);
    bool inHoverGlow = (dist < 115.0 && dist >= 10.0);
    bool inHoverHole = (dist < 10.0);

    if (inHoverGlow) {
        outColor = floor(((dist - 10.0) / 105.0) * uLineColorsNum);
//        outColor = 127.0;
        outChar = floor(fastNoise * uCharCount);
        isVisible = true;
    }

    // --- 2. WARSTWA ELEMENTÓW ---
    if (draw == 255.0) {
        // ORB (Nadpisuje całkowicie kolor hovera)
        float baseChar = floor(data.r * 255.0 + 0.5);
        outColor = floor(data.g * 255.0 + 0.5);
        isVisible = true;

        vec2 rowUV = vec2((baseChar + 0.5) / uSubSize.x, 0.5 / uSubSize.y);
        float vars = floor(texture2D(uSubArray, rowUV).b * 255.0 + 0.5);

        float selector = inHoverGlow ? random(cellCoords + uTime) : normalNoise;
        float y = floor(selector * vars);

        vec2 subUV = vec2((baseChar + 0.5) / uSubSize.x, (y + 0.5) / uSubSize.y);
        outChar = floor(texture2D(uSubArray, subUV).r * 255.0 + 0.5);
    }
    else if (draw == 120.0) {
        // MATRIX (Przebija się jasnością przez hover)
        float lineColor = floor(data.g * 255.0 + 0.5);
        outChar = floor((inHoverGlow ? fastNoise : normalNoise) * uCharCount);
        outColor = min(lineColor, outColor); // Mniejszy index = jaśniejszy kolor
        isVisible = true;
    }
    else if (draw == 150.0) {
        // RAMKI UI (Nadpisuje całkowicie)
        float initColor = floor(data.g * 255.0 + 0.5);
        float velRatio = clamp(uVelocity / 15.0, 0.0, 1.0);

        outColor = floor(initColor - (velRatio * initColor));
        outChar = floor((inHoverGlow ? fastNoise : normalNoise) * uCharCount);
        isVisible = true;
    } else if (draw == 160.0 || draw == 0.0) {
        float starShowSeed = random(cellCoords);
        float threshold = (draw == 0.0) ? 0.958 : 0.75;

        if (starShowSeed > threshold) {
            float speed = 1.0 + random(cellCoords + 0.2) * 2.0;
            float phase = random(cellCoords + 0.1) * 6.2831;
            float brightness = (sin(uTime * speed + phase) + 1.0) * 0.5;

            if (brightness >= 0.1) {
                float starCharSeed = random(cellCoords * random(cellCoords));
                float starColor = floor((1.0 - brightness) * uLineColorsNum);
                if (starCharSeed > 0.99) {
                    outChar = 37.0;
                } else if (inHoverGlow != true) {
                    outChar = 65.0;
                }
                outColor = min(starColor, outColor);
                isVisible = true;
            }
        }
    }

/**    if (draw == 0.0) {
        outChar = 0.0;  // Znak o indeksie 1 w Twoim atlasie
        outColor = 0.0; // Indeks 0.0 to pierwszy kolor w tablicy (czyli {r:255, g:255, b:255})
        isVisible = true;
    }*/

    // --- 3. MASKOWANIE ---
    // Czarna dziura ukrywa wszystko pod kursorem.
    // Jeśli chcesz by gwiazdy były w niej widoczne, zamień na: if (inHoverHole && draw != 160.0)
    if (inHoverHole && draw != 160.0) {
        isVisible = false;
    }

    // --- 4. RENDER FINALNY ---
    if (!isVisible) {
        discard;
    }


    vec2 atlasOffset = vec2(outChar * uCharUVSize.x, outColor * uCharUVSize.y);
    vec2 finalUV = atlasOffset + (localUV * uCharUVSize);
    vec4 texColor = texture2D(uTex, finalUV);

    gl_FragColor = vec4(texColor.rgb, texColor.a * (alpha / 255.0));
}