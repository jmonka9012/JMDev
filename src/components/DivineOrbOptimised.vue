<script setup>
import {onMounted, ref, onUnmounted, inject} from "vue";
import rawAscii from './DivineOrb.txt?raw';
import bgVertShader from './bgAscii.vert?raw';
import bgFragShader from './bgAscii.frag?raw';

const lenis = inject('lenis');
const isTouch = inject('isTouch');
const touchPos = inject('touchPos');

let splitAscii = rawAscii.split('\n');

splitAscii.forEach((line, i) => {
  splitAscii[i] = line.split("");
})
const charImageWidth = splitAscii[0].length;
const charImageHeight = splitAscii.length;
let p5Instance = null;
const container = ref(null);

const charMap = {
  ".": {
    substituteChars: "`.,'-",
    color: { r: 0, g: 155, b: 0 }
  },
  ":": {
    substituteChars: ":xlj!=o",
    color: { r: 80, g: 90, b: 80 }
  },
  ";": {
    substituteChars: ":;!jJLlI=",
    color: { r: 190, g: 190, b: 190 }
  },
  "+": {
    substituteChars: "x>+<=^",
    color: { r: 120, g: 190, b: 120 }
  },
  "x": {
    substituteChars: "x+X34#ahgure",
    color: { r: 120, g: 190, b: 120 }
  },
  "X": {
    substituteChars: "Xx34fO/#",
    color: { r: 200, g: 200, b: 200 }
  },
  "$": {
    substituteChars: "#A8Hha",
    color: { r: 0, g: 255, b: 0 }
  },
  "&": {
    substituteChars: "#@8$%",
    color: { r: 255, g: 255, b: 255 }
  }
};

for (const key in charMap) {
  charMap[key].size = charMap[key].substituteChars.length - 1;
}

let pageDelta = 0;
let pageVelocity = 0;

// const chars = "#@8$%#A8HhaXx34fO/#x+X34#ahgurex>+<=^x>+<=^:;!jJLlI=:xlj!=o`.,'-";
const uniqueChars = [...new Set(asciiStringNoJp.split(""))].join("");

// console.log(`kropka: ${uniqueChars.indexOf('@')}`)

let substituteCharTextureData = [];
let longestSubstitute = 0;

Object.keys(charMap).forEach((key) => {
  const index = uniqueChars.indexOf(key);
  substituteCharTextureData[index] = [];
  const charArray = charMap[key].substituteChars.split('');
  charArray.forEach((char, i) => {
    substituteCharTextureData[index][i] = uniqueChars.indexOf(char);
  })
  if (charArray.length > longestSubstitute) longestSubstitute = charArray.length;
})



let lines = [];
const lineConfig = {
  rDecr: 7,
  gDecr: 2,
  bDecr: 7,
  startColor: {r: 255, g: 255, b: 255},
  distTolerance: 1800,
  widthRatioConst: 320
}
const availibleDirections = ['down', 'up', 'right', 'left'];

let uniqueLineColors = [];

let r = lineConfig.startColor.r;
let g = lineConfig.startColor.g;
let b = lineConfig.startColor.b;

while (r > 0 || g > 0 || b > 0) {
  const rgbString = `${r},${g},${b}`;
  uniqueLineColors.push(rgbString);
  r -= lineConfig.rDecr;
  g -= lineConfig.gDecr;
  b -= lineConfig.bDecr;
}

const uniqueImageColors = [...new Set(
    Object.values(charMap).map(item => `${item.color.r},${item.color.g},${item.color.b}`)
)];

const mergedColors = [...new Set([...uniqueLineColors, ...uniqueImageColors])];

const fSize = 22;
const charW = 13;
const charH = fSize;

// Original dimensions
const pastedCharH = 12;
const pastedCharW = 7;

let atlas;

const estimHeight = charImageHeight * pastedCharH;
const estimWidth = charImageWidth * pastedCharW;

let gridPixelWidth, gridPixelHeight;
const trackedElements = ref([]);

let hasMoved = false;

const onFirstInteraction = () => {
  hasMoved = true;
  window.removeEventListener('mousemove', onFirstInteraction);
  window.removeEventListener('touchstart', onFirstInteraction);
};

const updateTrackedElements = () => {
  const trackedBoxes = document.querySelectorAll('[data-ascii-tracked]');

  trackedElements.value = Array.from(trackedBoxes).map(el => {
    const rect = el.getBoundingClientRect();
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    const borderWidthX = parseInt(el.dataset.asciiBorderWidthX, 10) || 1;
    const borderWidthY = parseInt(el.dataset.asciiBorderWidthY, 10) || 1;
    const placement = el.dataset.asciiBorderPlacement || 'inside';
    return {
      el: el,
      ascii: el.dataset.asciiTracked, // Przechowa ciąg "border-box" lub "filled-box"
      borderWidthX: borderWidthX,
      borderWidthY: borderWidthY,
      placement: placement,
      vertices: {
        topLeft:     { x: rect.left + scrollX,  y: rect.top + scrollY },
        topRight:    { x: rect.right + scrollX, y: rect.top + scrollY },
        bottomRight: { x: rect.right + scrollX, y: rect.bottom + scrollY },
        bottomLeft:  { x: rect.left + scrollX,  y: rect.bottom + scrollY }
      },
      size: { width: rect.width, height: rect.height }
    };
  });
};

let bgCols, bgRows;
let width, height;

const sketch = (p) => {
  const atlasMap = {};
  let substituteTexture;
  let bgDataTexture;
  let bgGeometry;
  let bgShader;
  const colorIndexMap = new Map();
  let linesPerSecond = p.ceil(p.width / lineConfig.widthRatioConst);
  let framesForLine = p.ceil(60/linesPerSecond);

  ////////////////////////////////
  //////           INIT
  ////////////////////////////////
  const initGridAndTexture = () => {
    linesPerSecond = p.ceil(p.width / lineConfig.widthRatioConst);
    framesForLine = p.ceil(1/linesPerSecond * 60);

    bgCols = Math.ceil(p.width / pastedCharW);
    bgRows = Math.ceil((p.height * 10) / pastedCharH);

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

    let imgOffsetX = 0;

    const contWidth = 1600;

    if (p.width > contWidth) {
      imgOffsetX = p.width/2 - estimWidth;
      imgOffsetX > contWidth/2 - estimWidth ? imgOffsetX = contWidth/2 - estimWidth : imgOffsetX;
    } else {
      imgOffsetX = -0.1 * p.width;

      if (p.width < 1000) {
        imgOffsetX = -0.3 * p.width;
      }
    }

    let imgStartCol = Math.floor((p.width / 2 + imgOffsetX) / pastedCharW);
    let imgStartRow = Math.floor((p.height / 2 - estimHeight / 2) / pastedCharH);

    // Wypalanie Orba
    for (let iY = 0; iY < splitAscii.length; iY++) {
      const line = splitAscii[iY];
      const realRow = imgStartRow + iY;
      for (let iX = 0; iX < line.length; iX++) {
        const char = line[iX];
        const realCol = imgStartCol + iX;

        if (char === " ") continue;

        let color = charMap[char].color;
        const colorString = `${color.r},${color.g},${color.b}`;
        const colorIndex = mergedColors.indexOf(colorString);

        if (!atlasMap[colorString] || !atlasMap[colorString][char]) continue;

        if (isWithinGrid(realCol, realRow)) {
          const index = (realRow * bgCols + realCol) * 4;

          bgDataTexture.pixels[index + 0] = uniqueChars.indexOf(char);
          bgDataTexture.pixels[index + 1] = colorIndex;
          bgDataTexture.pixels[index + 2] = 255;  // kanał blue obrazek
          bgDataTexture.pixels[index + 3] = 255;
        }
      }
    }

      // RAMKI I WYPEŁNIENIA
    if (trackedElements && trackedElements.value) {
      trackedElements.value.forEach(box => {
        const startCol = Math.floor(box.vertices.topLeft.x / pastedCharW);
        const endCol = Math.floor(box.vertices.bottomRight.x / pastedCharW);
        const startRow = Math.floor(box.vertices.topLeft.y / pastedCharH);
        const endRow = Math.floor(box.vertices.bottomRight.y / pastedCharH);

        const charIndex = uniqueChars.indexOf('+');
        if (charIndex === -1) return;

        const wx = box.borderWidthX;
        const wy = box.borderWidthY;
        const placement = box.placement;

        let outerStartCol, outerEndCol, outerStartRow, outerEndRow;
        let innerStartCol, innerEndCol, innerStartRow, innerEndRow;

        if (placement === 'outside') {
          outerStartCol = startCol - wx;
          outerEndCol = endCol + wx;
          outerStartRow = startRow - wy;
          outerEndRow = endRow + wy;

          innerStartCol = startCol;
          innerEndCol = endCol;
          innerStartRow = startRow;
          innerEndRow = endRow;
        } else {
          outerStartCol = startCol;
          outerEndCol = endCol;
          outerStartRow = startRow;
          outerEndRow = endRow;

          innerStartCol = startCol + wx;
          innerEndCol = endCol - wx;
          innerStartRow = startRow + wy;
          innerEndRow = endRow - wy;
        }

        // --- DECOUPLING (ROZDZIELENIE KANAŁÓW BLUE) ---
        const BORDER_BOX_BLUE = 150;
        const FILLED_BOX_BLUE = 160;
        const BUTTON_BOX_BLUE = 170;

        const drawPixel = (col, row, blueChannelValue) => {
          if (isWithinGrid(col, row)) {
            const index = (row * bgCols + col) * 4;
            bgDataTexture.pixels[index + 0] = 0;
            bgDataTexture.pixels[index + 1] = 33;
            bgDataTexture.pixels[index + 2] = blueChannelValue;
            bgDataTexture.pixels[index + 3] = 255;
          }
        };

        // Warunek rozdzielający logikę rysowania struktur
        if (box.ascii === 'filled-box') {
          // Wypełniamy cały obszar od krawędzi do krawędzi
          for (let r = outerStartRow; r <= outerEndRow; r++) {
            for (let c = outerStartCol; c <= outerEndCol; c++) {
              drawPixel(c, r, FILLED_BOX_BLUE);
            }
          }
        } else if (box.ascii === 'border-box') {
          // Klasyczna ramka z wyciętym środkiem
          for (let r = outerStartRow; r <= outerEndRow; r++) {
            for (let c = outerStartCol; c <= outerEndCol; c++) {
              if (r >= innerStartRow && r <= innerEndRow && c >= innerStartCol && c <= innerEndCol) {
                continue;
              }
              drawPixel(c, r, BORDER_BOX_BLUE);
            }
          }
        } else {
          for (let r = outerStartRow; r <= outerEndRow; r++) {
            for (let c = outerStartCol; c <= outerEndCol; c++) {
              drawPixel(c, r, BUTTON_BOX_BLUE);
            }
          }
        }
      });
    }    bgDataTexture.updatePixels();
    bgDataTexture.drawingContext.imageSmoothingEnabled = false;

    // Budowanie wielkiego prostokąta dopasowanego do nowego okna
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

    lines = [];
  };


  ////////////////
  // SETUP
  ////////////////

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);

    atlas = p.createGraphics(uniqueChars.length * charW, mergedColors.length * charH);
    atlas.canvas.remove();
    atlas.textFont('monospace');
    atlas.textSize(fSize);
    atlas.textAlign(p.LEFT, p.TOP);
    atlas.fill(255);
    atlas.noSmooth();
    atlas.background(0);

    for (let i = 0; i < mergedColors.length; i++) {
      const color = mergedColors[i];
      let [r, g, b] = color.split(",").map(Number);

      atlasMap[color] = {};
      atlasMap[color].color = {r, g, b};

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

    width = substituteCharTextureData.length;
    height = longestSubstitute;

    substituteTexture = p.createImage(width, height);
    substituteTexture.loadPixels();

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let dataValue = 255;

        if (substituteCharTextureData[x] !== undefined && substituteCharTextureData[x][y] !== undefined) {
          dataValue = substituteCharTextureData[x][y];
        }

        let index = (y * width + x) * 4;

        substituteTexture.pixels[index] = dataValue;
        substituteTexture.pixels[index + 1] = 0;
        if (y === 0 && substituteCharTextureData[x]) {
          substituteTexture.pixels[index + 2] = substituteCharTextureData[x].length - 1;
        } else {
          substituteTexture.pixels[index + 2] = 0;
        }
        substituteTexture.pixels[index + 3] = 255;
      }
    }
    substituteTexture.updatePixels();
    substituteTexture.drawingContext.imageSmoothingEnabled = false;

    // Inicjalizacja pierwszej siatki tła
    initGridAndTexture();

    bgShader = p.createShader(bgVertShader, bgFragShader);
  };

  ////////////////////////////////
  //////           DRAW
  ////////////////////////////////

  let survivingLines = [];

  p.draw = () => {
    // line ratio
    // if (p.frameCount % 8 === 0) lines.push(generateLine(2, "down"));
    if (p.frameCount % framesForLine === 0) lines.push(generateLine(2, "down"));

    // 1. ZABIJANIE I CZYSZCZENIE (Tworzymy nową tablicę ocalałych linii)
    survivingLines = [];

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];

      if (isLineKillable(l)) {
        const totalLen = MAX_LINE_LENGTH + l.speed;
        for (let s = 0; s <= totalLen; s++) {
          const col = l.col + (s * l.dirX * -1);
          const row = l.row + (s * l.dirY * -1);
          if (isWithinGrid(col, row)) {
            const index = (row * bgCols + col) * 4;
            if ((bgDataTexture.pixels[index + 2] !== 255) &&
                (bgDataTexture.pixels[index + 2] !== 150) &&
                (bgDataTexture.pixels[index + 2] !== 140)) { // (Dodane zabezpieczenie 140!)
              bgDataTexture.pixels[index + 3] = 0;
            }
          }
        }
      } else {
        survivingLines.push(l); // Jeśli linia żyje, zapisz ją do nowej tablicy
      }
    }

    // Nadpisujemy starą tablicę nową
    lines = survivingLines;

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];

      let r = lineConfig.startColor.r;
      let g = lineConfig.startColor.g;
      let b = lineConfig.startColor.b;

      let letter = 0;

      while (r > 0 || g > 0 || b > 0) {
        let col = l.col + (letter * l.dirX * -1);
        let row = l.row + (letter * l.dirY * -1);

        if (isWithinGrid(col, row)) {
          const index = (row * bgCols + col) * 4;

          if ((bgDataTexture.pixels[index + 2] !== 255) && (bgDataTexture.pixels[index + 2] !== 150)) {
            const colorString = uniqueLineColors[letter];
            const colorIndex = colorIndexMap.get(colorString);

            bgDataTexture.pixels[index + 0] = 255;
            bgDataTexture.pixels[index + 1] = colorIndex;
            bgDataTexture.pixels[index + 2] = 120;
            bgDataTexture.pixels[index + 3] = 255;
          }
        }

        letter++;
        r -= lineConfig.rDecr;
        g -= lineConfig.gDecr;
        b -= lineConfig.bDecr;
      }

      for (let s = 0; s <= l.speed; s++) {
        let clearCol = l.col + ((letter + s) * l.dirX * -1);
        let clearRow = l.row + ((letter + s) * l.dirY * -1);

        if (isWithinGrid(clearCol, clearRow)) {
          const index = (clearRow * bgCols + clearCol) * 4;
          if ((bgDataTexture.pixels[index + 2] !== 255) && (bgDataTexture.pixels[index + 2] !== 150)) {
            bgDataTexture.pixels[index + 3] = 0;
          }
        }
      }

      l.frame++;
      l.row += l.speed * l.dirY;
      l.col += l.speed * l.dirX;
    }

    bgDataTexture.updatePixels();

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

      const mx = isTouch.value ? touchPos.x.value - p.width / 2 : p.mouseX - p.width / 2;
      const my = isTouch.value ? touchPos.y.value - p.height / 2 : p.mouseY - p.height / 2 - currentDelta;

      const startX = -p.width / 2;
      const startY = -p.height / 2;

      mouseCol = (mx - startX) / pastedCharW;
      mouseRow = (my - startY) / pastedCharH;

      mousePixelX = mx - startX;
      mousePixelY = my - startY;
    }

    bgShader.setUniform('uLineColorsNum', uniqueLineColors.length - 1)
    bgShader.setUniform('uScreenSize', [gridPixelWidth, gridPixelHeight])
    bgShader.setUniform('uMouseGrid', [mouseCol, mouseRow]);
    bgShader.setUniform('uMousePixel', [mousePixelX, mousePixelY]);
    bgShader.setUniform('uPastedCharSize', [pastedCharW, pastedCharH]);
    bgShader.setUniform('uTime', p.frameCount * 0.05);
    bgShader.setUniform('uVelocity', pageVelocity);
    bgShader.setUniform('uCharCount', uniqueChars.length);
    bgShader.setUniform('uSubArray', substituteTexture);
    bgShader.setUniform('uSubSize', [width, height]);
    bgShader.setUniform('uBgData', bgDataTexture);
    bgShader.setUniform('uBgSize', [bgCols, bgRows]);
    bgShader.setUniform('uTex', atlas);
    bgShader.setUniform('uCharUVSize', [charW / atlas.width, charH / atlas.height]);

    p.noStroke();

    p.push();
    p.translate(0, pageDelta, 0);
    p.model(bgGeometry);
    p.pop();

    // --- DEBUG: PODGLĄD ATLASU ---
    // p.resetShader();
    // p.push();
    // p.translate(-p.width / 2, -p.height / 2, 1);
    // p.image(atlas, 0, 0);
    // p.pop();
  };

  const generateLine = (speed, direction = p.random(availibleDirections), startCol, startRow) => {
    let line = {};
    let col, row, dirX = 0, dirY = 0;

    const currentTopRow = Math.floor(Math.abs(pageDelta) / pastedCharH);
    const rowsOnScreen = Math.ceil(p.height / pastedCharH);
    const currentBottomRow = currentTopRow + rowsOnScreen;

    switch(direction) {
      case 'up':
        col = p.floor(p.random(0, bgCols));
        row = currentBottomRow;
        dirY = -1;
        break;
      case 'left':
        col = bgCols;
        row = p.floor(p.random(currentTopRow, currentBottomRow));
        dirX = -1;
        break;
      case 'right':
        col = -1;
        row = p.floor(p.random(currentTopRow, currentBottomRow));
        dirX = 1;
        break;
      default:
        col = p.floor(p.random(0, bgCols));
        row = currentTopRow - 1;
        dirY = 1;
    }

    col = startCol ?? col;
    row = startRow ?? row;

    line = {
      col: col,
      row: row,
      frame: 0,
      dirX: dirX,
      dirY: dirY,
      speed: speed
    };

    return line;
  }

  const getLineLength = () => {
    const lenR = lineConfig.startColor.r / lineConfig.rDecr;
    const lenG = lineConfig.startColor.g / lineConfig.gDecr;
    const lenB = lineConfig.startColor.b / lineConfig.bDecr;
    return Math.floor(Math.max(lenR, lenG, lenB));
  };
  const MAX_LINE_LENGTH = getLineLength();

  const isLineKillable = (line) => {
    const tailCol = line.col - (line.dirX * MAX_LINE_LENGTH);
    const tailRow = line.row - (line.dirY * MAX_LINE_LENGTH);

    const currentTopRow = Math.floor(Math.abs(pageDelta) / pastedCharH);
    const rowsOnScreen = Math.ceil(p.height / pastedCharH);
    const currentBottomRow = currentTopRow + rowsOnScreen;

    const margin = 10;

    if (line.dirX === -1 && tailCol < 0) return true;
    if (line.dirX === 1 && tailCol > bgCols) return true;
    if (line.dirY === -1 && tailRow < currentTopRow - margin) return true;
    if (line.dirY === 1 && tailRow > currentBottomRow + margin) return true;

    return false;
  };

  const isWithinGrid = (col, row) => {
    if (col < 0 || row < 0 || col >= bgCols || row >= bgRows) {
      return false;
    }
    return true;
  }

  let resizeTimer;

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateTrackedElements();
      initGridAndTexture();
    }, 250);
  };
};
const handleScroll = (e) => {
  if (!p5Instance) return;

  pageDelta = -e.actualScroll;
  pageVelocity = Math.abs(-e.lastVelocity);

};

onMounted(async () => {
  if (typeof window !== 'undefined') {
    const p5 = (await import("p5")).default;

    updateTrackedElements();

    window.addEventListener('mousemove', onFirstInteraction, { passive: true });
    window.addEventListener('touchstart', onFirstInteraction, { passive: true });

    if (container.value) {
      p5Instance = new p5(sketch, container.value);
      lenis.on('scroll', handleScroll);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onFirstInteraction);
  window.removeEventListener('touchstart', onFirstInteraction);

  if (p5Instance) {
    p5Instance.remove();
  }
  if (lenis) {
    lenis.off('scroll', handleScroll);
  }
});

</script>
<template>
  <div ref="container"></div>
</template>
<style scoped lang="scss">
:deep(canvas) {
  touch-action: auto !important;
}
</style>