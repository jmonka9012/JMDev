<script setup>
import { onMounted, ref, onUnmounted, inject } from "vue";
import { motionPaused } from "../utils/motionPreference.js";
import { createLines } from "../scripts/DivineOrb/lines.js";
import { createOrb } from "../scripts/DivineOrb/orb.js";
import rawAscii from "./DivineOrb.txt?raw";
import bgVertShader from "./bgAscii.vert?raw";
import bgFragShader from "./bgAscii.frag?raw";

const lenis = inject("lenis");
const isTouch = inject("isTouch");
const touchPos = inject("touchPos");

import { ASCII_STRING_NO_JP } from "../utils/asciiConstants.js";

let p5Instance = null;
const container = ref(null);
let documentResizeObserver = null;
let documentResizeTimer = null;
let refreshDocumentGrid = null;

const DOCUMENT_RESIZE_DEBOUNCE = 250;
const MOBILE_LAYOUT_QUERY = "(max-width: 991.98px)";

let pageDelta = 0;
let pageVelocity = 0;

const uniqueChars = [...new Set(ASCII_STRING_NO_JP.split(""))].join("");

const lineEffect = createLines();
const uniqueLineColors = lineEffect.colors;

// Shared grid cell dimensions, also used when positioning the orb.
const pastedCharH = 12;
const pastedCharW = 7;
const orbEffect = createOrb({
  rawAscii,
  uniqueChars,
  pastedCharW,
  pastedCharH,
});
const mergedColors = [...new Set([...uniqueLineColors, ...orbEffect.colors])];

const fSize = 22;
const charW = 13;
const charH = fSize;

let atlas;

let gridPixelWidth, gridPixelHeight;

let hasMoved = false;

const onFirstInteraction = () => {
  hasMoved = true;
  window.removeEventListener("mousemove", onFirstInteraction);
  window.removeEventListener("touchstart", onFirstInteraction);
};

let bgCols, bgRows;

const sketch = (p) => {
  const atlasMap = {};
  let substituteTexture;
  let bgDataTexture;
  let bgGeometry;
  let bgShader;
  let textureDirty = false;
  let isGridReady = false;
  const colorIndexMap = new Map();

  ////////////////////////////////
  //////           INIT
  ////////////////////////////////
  const syncCanvasPixelDensity = () => {
    const targetDensity = window.matchMedia(MOBILE_LAYOUT_QUERY).matches
      ? 1
      : p.displayDensity();

    if (p.pixelDensity() !== targetDensity) {
      p.pixelDensity(targetDensity);
    }
  };

  const getDocumentHeight = () => {
    return Math.max(
      p.height,
      document.documentElement?.scrollHeight || 0,
      document.body?.scrollHeight || 0,
    );
  };

  const initGridAndTexture = () => {
    bgCols = Math.ceil(p.width / pastedCharW);
    // One extra row prevents a rounding gap at the bottom of the document.
    bgRows = Math.ceil(getDocumentHeight() / pastedCharH) + 1;

    gridPixelWidth = bgCols * pastedCharW;
    gridPixelHeight = bgRows * pastedCharH;

    bgDataTexture = p.createImage(bgCols, bgRows);
    bgDataTexture.loadPixels();

    for (let i = 0; i < bgCols * bgRows * 4; i += 4) {
      bgDataTexture.pixels[i + 0] = 0;
      bgDataTexture.pixels[i + 1] = 0;
      bgDataTexture.pixels[i + 2] = 0;
      bgDataTexture.pixels[i + 3] = 0;
    }

    orbEffect.burn({
      p,
      bgDataTexture,
      bgCols,
      bgRows,
      atlasMap,
      colorIndexMap,
    });

    bgDataTexture.updatePixels();
    textureDirty = false;
    bgDataTexture.drawingContext.imageSmoothingEnabled = false;

    // Build main container
    bgGeometry = p.buildGeometry(() => {
      p.beginShape(p.QUADS);
      const startX = -p.width / 2;
      const startY = -p.height / 2;

      p.vertex(startX, startY, 0, 0, 0);
      p.vertex(startX + gridPixelWidth, startY, 0, 1, 0);
      p.vertex(startX + gridPixelWidth, startY + gridPixelHeight, 0, 1, 1);
      p.vertex(startX, startY + gridPixelHeight, 0, 0, 1);
      p.endShape();
    });

    lineEffect.reset();
  };

  const refreshGridAndTexture = () => {
    if (!isGridReady) return;

    initGridAndTexture();
  };

  refreshDocumentGrid = refreshGridAndTexture;

  ////////////////
  // SETUP
  ////////////////

  p.setup = () => {
    p.pixelDensity(1);
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    syncCanvasPixelDensity();

    atlas = p.createGraphics(
      uniqueChars.length * charW,
      mergedColors.length * charH,
    );
    atlas.pixelDensity(1);
    atlas.canvas.remove();
    atlas.textFont("monospace");
    atlas.textSize(fSize);
    atlas.textAlign(p.LEFT, p.TOP);
    atlas.fill(255);
    atlas.noSmooth();
    atlas.background(0);

    for (let i = 0; i < mergedColors.length; i++) {
      const color = mergedColors[i];
      let [r, g, b] = color.split(",").map(Number);

      atlasMap[color] = {};
      atlasMap[color].color = { r, g, b };

      for (let j = 0; j < uniqueChars.length; j++) {
        const char = uniqueChars[j];
        const x = j * charW;
        const y = i * charH;

        atlas.noStroke();
        atlas.fill(r, g, b);
        atlas.text(char, x, y);
        atlasMap[color][char] = { x, y };
      }
    }

    for (let i = 0; i < mergedColors.length; i++) {
      colorIndexMap.set(mergedColors[i], i);
    }

    substituteTexture = orbEffect.createSubstituteTexture(p);

    initGridAndTexture();

    bgShader = p.createShader(bgVertShader, bgFragShader);
    isGridReady = true;
  };

  ////////////////////////////////
  //////           DRAW
  ////////////////////////////////

  p.draw = () => {
    const linesChanged = lineEffect.update({
      p,
      motionPaused: motionPaused.value,
      bgDataTexture,
      colorIndexMap,
      bgCols,
      bgRows,
      pageDelta,
      pastedCharH,
    });
    textureDirty = textureDirty || linesChanged;

    if (textureDirty) {
      bgDataTexture.updatePixels();
      textureDirty = false;
    }

    p.background(0);

    p.shader(bgShader);

    let mouseCol, mouseRow, mousePixelX, mousePixelY;

    if (!hasMoved) {
      mouseCol = -300;
      mouseRow = -300;
      mousePixelX = -30000;
      mousePixelY = -30000;
    } else {
      let currentDelta = pageDelta;

      const mx = isTouch.value
        ? touchPos.x.value - p.width / 2
        : p.mouseX - p.width / 2;
      const my = isTouch.value
        ? touchPos.y.value - p.height / 2
        : p.mouseY - p.height / 2 - currentDelta;

      const startX = -p.width / 2;
      const startY = -p.height / 2;

      mouseCol = (mx - startX) / pastedCharW;
      mouseRow = (my - startY) / pastedCharH;

      mousePixelX = mx - startX;
      mousePixelY = my - startY;
    }

    bgShader.setUniform("uLineColorsNum", uniqueLineColors.length - 1);
    bgShader.setUniform("uScreenSize", [gridPixelWidth, gridPixelHeight]);
    bgShader.setUniform("uMouseGrid", [mouseCol, mouseRow]);
    bgShader.setUniform("uMousePixel", [mousePixelX, mousePixelY]);
    bgShader.setUniform("uPastedCharSize", [pastedCharW, pastedCharH]);
    bgShader.setUniform("uTime", p.frameCount * 0.05);
    bgShader.setUniform("uVelocity", pageVelocity);
    bgShader.setUniform("uCharCount", uniqueChars.length);
    bgShader.setUniform("uSubArray", substituteTexture);
    bgShader.setUniform("uSubSize", [
      substituteTexture.width,
      substituteTexture.height,
    ]);
    bgShader.setUniform("uBgData", bgDataTexture);
    bgShader.setUniform("uBgSize", [bgCols, bgRows]);
    bgShader.setUniform("uTex", atlas);
    bgShader.setUniform("uCharUVSize", [
      charW / atlas.width,
      charH / atlas.height,
    ]);

    p.noStroke();

    p.push();
    p.translate(0, pageDelta, 0);
    p.model(bgGeometry);
    p.pop();

    // --- DEBUG: ATLAS ---
    // p.resetShader();
    // p.push();
    // p.translate(-p.width / 2, -p.height / 2, 1);
    // p.image(atlas, 0, 0);
    // p.pop();
  };

  let resizeTimer;

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    syncCanvasPixelDensity();

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      refreshGridAndTexture();
    }, 250);
  };
};

const scheduleDocumentGridRefresh = () => {
  clearTimeout(documentResizeTimer);
  documentResizeTimer = setTimeout(() => {
    refreshDocumentGrid?.();
  }, DOCUMENT_RESIZE_DEBOUNCE);
};

const startDocumentResizeObserver = () => {
  if (typeof ResizeObserver === "undefined" || !document.body) return;

  documentResizeObserver = new ResizeObserver(scheduleDocumentGridRefresh);
  documentResizeObserver.observe(document.body);

  document.fonts?.ready.then(() => {
    if (documentResizeObserver) scheduleDocumentGridRefresh();
  });
};

const handleScroll = (e) => {
  if (!p5Instance) return;

  pageDelta = -e.actualScroll;
  pageVelocity = Math.abs(-e.lastVelocity);
};

onMounted(async () => {
  if (typeof window !== "undefined") {
    const p5 = (await import("../utils/p5DivineOrb.js")).default;

    window.addEventListener("mousemove", onFirstInteraction, { passive: true });
    window.addEventListener("touchstart", onFirstInteraction, {
      passive: true,
    });

    if (container.value) {
      p5Instance = new p5(sketch, container.value);
      lenis.on("scroll", handleScroll);
      startDocumentResizeObserver();
    }
  }
});

onUnmounted(() => {
  clearTimeout(documentResizeTimer);
  documentResizeObserver?.disconnect();
  documentResizeObserver = null;
  refreshDocumentGrid = null;

  window.removeEventListener("mousemove", onFirstInteraction);
  window.removeEventListener("touchstart", onFirstInteraction);

  if (p5Instance) {
    p5Instance.remove();
  }
  if (lenis) {
    lenis.off("scroll", handleScroll);
  }
});
</script>
<template>
  <div ref="container" aria-hidden="true"></div>
</template>
<style scoped lang="scss">
:deep(canvas) {
  touch-action: auto !important;
}
</style>
