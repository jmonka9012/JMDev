<script setup>
import {onMounted, ref, onUnmounted, inject} from "vue";
import rawAscii from './DivineOrb.txt?raw';

const lenis = inject('lenis');

let p5Instance = null;
const container = ref(null);

let splitAscii = rawAscii.split('\n'); // Każdy wiersz obrazka to element tablicy. Puste znaki zachowane

splitAscii.forEach((line, i) => {
  splitAscii[i] = line.split("");
})


const charImageWidth = splitAscii[0].length;
const charImageHeight = splitAscii.length;

const fontSize = 12;
const fontSizeW = 7;

const estimHeight = charImageHeight * fontSize;
const estimWidth = charImageWidth * fontSizeW;

/*
      r: 193, g: 48, b: 209  // fioletowy
      r: 146, g: 59, b: 156  // ciemny fioletowy
      r: 255, g: 92, b: 206  // różowy
      r: 222, g: 104, b: 212  //jasny różowy
      r: 81, g: 153, b: 63  //zielony
      r: 108, g: 224, b: 79  //jasny zielony
      r: 118, g: 199, b: 97  //zielony 2
 */

const charMap = {
  ".": {
    substituteChars: "`.,' -`.,' -,",
    substituteCharsJp: "ゝヽ゜゛・ニシエトュ",
    color: {
      r: 0, g: 155, b: 0
      // r: 146, g: 59, b: 156
      // r: 0, g: 110, b: 0
    }
  },
  ":": {
    substituteChars: ":xlj!=o:xlj!=o:xlj!=o:xlj!=o",
    substituteCharsJp: "ニシエトュ",
    color: {
      r: 80, g: 90, b: 80
      // r: 193, g: 48, b: 209
      // r: 0, g: 110, b: 0
    }
  },
  ";": {
    substituteChars: ":;!jJLlI=:;!jJLlI=:;!jJLlI=",
    substituteCharsJp: "ハツソメルれ",
    color: {
      // r: 144, g: 110, b: 67
      r: 190, g: 190, b: 190
      // r: 0, g: 110, b: 0
    }
  },
  "+": {
    substituteChars: "x>+<=^x>+<=^x>+<=^",
    substituteCharsJp: "けサナモオき",
    color: {
      // r: 144, g: 110, b: 67
      r: 120, g: 190, b: 120
      // r: 0, g: 110, b: 0
    }
  },
  "x": {
    substituteChars: "x+X34#ahgurex+X34#ahgure",
    substituteCharsJp: "ほまねたぬあ",
    color: {
      // r: 139, g: 110, b: 75
      r: 120, g: 190, b: 120
      // r: 0, g: 140, b: 0
    }
  },
  "X": {
    substituteChars: "Xx34fO/#Xx34fO/#Xx34fO/#",
    substituteCharsJp: "お終ボまをぽ",
    color: {
      // r: 217, g: 180, b: 113
      r: 200, g: 200, b: 200
      // r: 120, g: 230, b: 120
    }
  },
  "$": {
    substituteChars: "#A8Hha#A8Hha#A8Hha",
    substituteCharsJp: "ぬねふあんゆ",
    color: {
      // r: 217, g: 180, b: 113
      r: 0, g: 255, b: 0
      // r: 150, g: 250, b: 150
    }
  },
  "&": {
    substituteChars: "#@8$%#@8$%#@8$%",
    substituteCharsJp: "あいうえおかが",
    color: {
      // r: 255, g: 237, b: 163
      r: 255, g: 255, b: 255
      // r: 190, g: 255, b: 190
    }
  }
}

let circles = [];
let lines = [];
let specialLetters = [];

const containerWidth = 1600;

const sketch = (p) => {

  // Kółka
  const circleR = 80;
  const innerCircleR = 28;
  const startState = 100;
  const stateFadeRate = 3;
  const circleDecreaseRate = 3;
  const innerCircleDecreaseRate = 1;
  // Page delta
  let pageDelta = 0;

  // Linie
  const lineConfig = {
    colorDR: 2,
    alphaDR: 7,
    color: {r: 255, g: 255, b: 255},
    distTolerance: 1800,
    asciiString: asciiString
  }

  const availibleDirections = ['down', 'up', 'right', 'left'];

  // Pozycja obrazka
  let imgStartX, imgStartY;

  let imgOffsetX = containerWidth/2 - estimWidth/2;

  if (window.innerWidth < containerWidth) {
    imgOffsetX = (window.innerWidth - estimWidth)/2;
  }


  p.setup = () => {
    p.createCanvas(document.documentElement.clientWidth, p.windowHeight);
    p.textFont('monospace');
    p.textSize(fontSize);
    p.textAlign(p.CENTER, p.CENTER);
    p.frameRate(60);
  };

  const generateLine = (speed, direction = p.random(availibleDirections), startX, startY) => {
    let line = {};
    let x, y, dirX = 0, dirY = 0;

    // Najpierw obliczamy domyślne wartości na podstawie kierunku
    switch(direction) {
      case 'up':
        x = p.random(0, p.width);
        y = p.height;
        dirY = -1;
        break;
      case 'left':
        x = p.width;
        y = p.random(0, p.height);
        dirX = -1;
        break;
      case 'right':
        x = 0;
        y = p.random(0, p.height);
        dirX = 1;
        break;
      default:
        x = p.random(0, p.width);
        y = 0;
        dirY = 1;
    }

    x = startX ?? x;
    y = startY ?? y;

    const closestLetter = findClosestLetter(x, y);

    line = {
      coords: {
        x,y
      },
      letterX: closestLetter.iX,
      letterY: closestLetter.iY,
      frame: 0,
      alphaDR: lineConfig.alphaDR,
      colorDR: lineConfig.colorDR,
      killable: () => {
        const letterDeltaX = -dirX * line.length();
        const letterDeltaY = -dirY * line.length();

        const x = line.coords.x + letterDeltaX * fontSizeW;
        const y = line.coords.y + letterDeltaY * fontSize;

        if (dirX === -1 && x < 0) return true;
        if (dirX === 1 && x > p.width) return true;
        if (dirY === -1 && y < 0) return true;
        if (dirY === 1 && y > p.height) return true;

        return false;
      },
      length: () => {
        return p.floor(lineConfig.color.g / lineConfig.colorDR)
      },
      speed,
      dirX,
      dirY
    };

    return line;
  }

  p.draw = () => {
    p.background(0);

    specialLetters = [];

    imgStartX = p.width / 2 - estimWidth / 2 + imgOffsetX;
    imgStartY = pageDelta + p.height / 2 - estimHeight / 2;

    // KÓŁKA

    if (p.mouseX !== 0 || p.mouseY !== 0) {
      circles.push({
        x: p.mouseX,
        y: p.mouseY,
        r: circleR,
        ir: innerCircleR,
        state: startState
      });
    }

    // Przebudować na używanie tablicy znaków startujących od 0,0
    // Przemyśleć jak to się ma do rysowania obrazka

    for (let i = 0; i < circles.length; i++) {
      const c = circles[i]

      const closestToCircle = findClosestLetter(c.x, c.y);

      const radiusLetterX = Math.floor(c.r / fontSizeW);
      const radiusLetterY = Math.floor(c.r / fontSize);

      const startLetterIndexX = closestToCircle.iX - radiusLetterX;
      const startLetterIndexY = closestToCircle.iY - radiusLetterY;

      for (let iY = 0; iY <= 2 * radiusLetterY; iY++) {
        const currentLetterRealIndexY = startLetterIndexY + iY;
        if (!specialLetters[currentLetterRealIndexY]) {
          specialLetters[currentLetterRealIndexY] = [];
        }

        for (let iX = 0; iX <= 2 * radiusLetterX; iX++) {
          const currentLetterRealIndexX = startLetterIndexX + iX;

          const coords = calcRealPixel(currentLetterRealIndexX, currentLetterRealIndexY)

          const isWithinR = isWithinRadius(c.r, c.x, c.y, coords.x, coords.y);
          const isBlank = false;

          if (isWithinR) {
            let existing = specialLetters[currentLetterRealIndexY][currentLetterRealIndexX] || { isBlank: false };
            if (!existing.lastCircle || c.state > existing.lastCircle.state) {
              specialLetters[currentLetterRealIndexY][currentLetterRealIndexX] = {
                lastCircle: c,
                isBlank: existing.isBlank || isBlank,
                isWithinR: true
              };
            }
          }
        }
      }

      c.state -= stateFadeRate;
      c.r -= circleDecreaseRate;
      c.ir -= innerCircleDecreaseRate;
      if (c.state <= 0) {
        circles.splice(i, 1);
      }
    }

    // LINIE

    if (p.frameCount % 20 === 0) lines.push(generateLine(2, "down"));

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];

      l.frame++;
      l.letterY += l.speed * l.dirY;
      l.letterX += l.speed * l.dirX;

      l.coords = calcRealPixel(l.letterX, l.letterY);

      if (l.killable(l.coords)) {
        lines.splice(i, 1);
      }

      let r = lineConfig.color.r;
      let g = lineConfig.color.g;
      let b = lineConfig.color.b;

      let letter = 0;

      while (r > 0 || g > 0 || b > 0) {
        let letterX, letterY;
        const deltaX = letter * l.dirX * -1;
        const deltaY = letter * l.dirY * -1;

        letterX = l.coords.x + deltaX * fontSizeW;
        letterY = l.coords.y + deltaY * fontSize;

        if (isWithinCanvas(letterX, letterY)) {
          if (!isWithinImage(l.letterX + deltaX, l.letterY + deltaY)) {
            p.noStroke();
            p.fill(r, g, b);
            p.text(p.random(lineConfig.asciiString.split("")), letterX, letterY);
          }
        }
        letter++;

        r -= lineConfig.alphaDR;
        g -= lineConfig.colorDR;
        b -= lineConfig.alphaDR;
      }
    }

    // OBRAZEK

    for (let iY = 0; iY < splitAscii.length; iY++) {
      const line = splitAscii[iY];

      for (let iX = 0; iX < line.length; iX++) {
        const char = line[iX];
        if (char === " " || !charMap[char]) continue;

        const letterX = imgStartX + iX * fontSizeW;
        const letterY = imgStartY + iY * fontSize;

        if (!isWithinCanvas(letterX, letterY)) continue;

        let n = p.noise(iX , iY , p.frameCount * 0.01);
        let adjustedN = n;
        // let adjustedN = (1 - Math.cos(n * Math.PI)) / 2;

        // console.log(adjustedN);
        let letter = charMap[char].substituteChars[p.floor(adjustedN * charMap[char].substituteChars.length)];
        // let letter = p.random(charMap[char].substituteChars.split(''));

        let color = charMap[char].color;

        const letterReference = specialLetters[iY]?.[iX];

        if (letterReference) {
          if (letterReference.isBlank) {
            letter = " ";
          } else if (letterReference.lastCircle) {
            const noiseState = p.random(0, startState);

            if (noiseState <= letterReference.lastCircle.state) {
              p.randomSeed((iX * iY));
              letter = p.random(charMap[char].substituteCharsJp.split(''));
            }
          }
        }

        p.noStroke();
        p.fill(color.r, color.g, color.b);
        p.text(letter, letterX, letterY);
      }
    }
  }

  const calcRealPixel = (ix,iy) => {
    const realX = imgStartX + fontSizeW * ix;
    const realY = imgStartY + fontSize * iy;

    return {
      x: realX,
      y: realY,
    }
  }

  const isWithinImage = (ix, iy) => {
    const char = splitAscii[iy]?.[ix];

    return char !== undefined && char !== " ";
  }

  const isWithinCanvas = (x,y) => {
    if (x < 0 || y < 0 || x > p.width || y > p.height) {
      return false;
    } else return true;
  }

  const isWithinRadius = (r, mx, my, px, py) => {
    return p.dist(mx, my, px, py) <= r;
  }

  const findClosestLetter = (x, y) => {
    const relativeX = (x - imgStartX);
    const relativeY = (y - imgStartY);

    const closestLetterIndexX = Math.round(relativeX/fontSizeW);
    const closestLetterIndexY = Math.round(relativeY/fontSize);

    return {
      iX: closestLetterIndexX,
      iY: closestLetterIndexY,
    }
  }

  const sendClickX = () => {
    const cx = p.mouseX;
    const cy = p.mouseY;
    // lines.push(generateLine(5, "up", cx, p.height));

    const closestSideX = cx >= p.width/2 ? 1 : 0;
    const closestSideY = cy >= p.height/2 ? 1 : 0;

    if (closestSideX === 0) lines.push(generateLine(6, "right", 0, cy));
    if (closestSideX === 1) lines.push(generateLine(6, "left", p.width, cy));
    // if (closestSideY === 0) lines.push(generateLine(6, "down", cx, 0));
    // if (closestSideY === 1) lines.push(generateLine(6, "up", cx, p.height));

/*    lines.push(generateLine(2, "down", cx, cy));
    lines.push(generateLine(2, "up", cx, cy));
    lines.push(generateLine(2, "right", cx, cy));
    lines.push(generateLine(2, "left", cx, cy));*/
  }

  p.lenisScroll = (e) => {
    pageDelta = -e.actualScroll;
  }

  p.windowResized = () => {
    p.resizeCanvas(document.documentElement.clientWidth, p.windowHeight);
    imgOffsetX = containerWidth/2 - estimWidth/2;

    if (window.innerWidth < containerWidth) {
      imgOffsetX = (window.innerWidth - estimWidth)/2;
    }
  };

  p.mouseClicked = () => {
    sendClickX();
  }
}

const handleScroll = (e) => {
  p5Instance.lenisScroll(e);
};

onMounted(async () => {
  if (typeof window !== 'undefined') {
    const p5 = (await import("p5")).default;
    if (container.value) {
      p5Instance = new p5(sketch, container.value);

      lenis.on('scroll', handleScroll)
    }
  }
});

onUnmounted(() => {
  if (p5Instance) {
    p5Instance.remove();
  }
  lenis.off('scroll', handleScroll)
});

</script>

<template>
  <div ref="container"></div>
</template>

<style scoped>

</style>