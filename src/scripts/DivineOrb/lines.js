const DEFAULT_LINE_CONFIG = {
  rDecr: 7,
  gDecr: 2,
  bDecr: 7,
  startColor: { r: 255, g: 255, b: 255 },
  widthRatioConst: 320,
  targetFps: 60,
  speed: 2,
  direction: "down",
  margin: 10,
};

// Each effect owns its lines. Overrides are applied once, before building the atlas.
export const createLines = (lineConfig = {}) => {
  const config = {
    ...DEFAULT_LINE_CONFIG,
    ...lineConfig,
    startColor: { ...DEFAULT_LINE_CONFIG.startColor, ...lineConfig.startColor },
  };

  // Positive decrements guarantee that building the color palette terminates.
  for (const key of [
    "rDecr",
    "gDecr",
    "bDecr",
    "widthRatioConst",
    "targetFps",
    "speed",
  ]) {
    if (!Number.isFinite(config[key]) || config[key] <= 0) {
      throw new Error(`lineConfig.${key} must be a positive number.`);
    }
  }

  const colors = [];
  let { r, g, b } = config.startColor;
  while (r > 0 || g > 0 || b > 0) {
    colors.push(`${r},${g},${b}`);
    r -= config.rDecr;
    g -= config.gDecr;
    b -= config.bDecr;
  }

  const maxLineLength = Math.floor(
    Math.max(
      config.startColor.r / config.rDecr,
      config.startColor.g / config.gDecr,
      config.startColor.b / config.bDecr,
    ),
  );
  const availableDirections = ["down", "up", "right", "left"];
  let lines = [];

  const generateLine = (p, bgCols, topRow, bottomRow) => {
    const direction = config.direction ?? p.random(availableDirections);
    let col, row;
    let dirX = 0;
    let dirY = 0;

    switch (direction) {
      case "up":
        col = p.floor(p.random(0, bgCols));
        row = bottomRow;
        dirY = -1;
        break;
      case "left":
        col = bgCols;
        row = p.floor(p.random(topRow, bottomRow));
        dirX = -1;
        break;
      case "right":
        col = -1;
        row = p.floor(p.random(topRow, bottomRow));
        dirX = 1;
        break;
      default:
        col = p.floor(p.random(0, bgCols));
        row = topRow - 1;
        dirY = 1;
    }

    return { col, row, frame: 0, dirX, dirY, speed: config.speed };
  };

  // Updates pixel data only. The sketch uploads the texture and draws the shader.
  const update = ({
    p,
    motionPaused,
    bgDataTexture,
    colorIndexMap,
    bgCols,
    bgRows,
    pageDelta,
    pastedCharH,
  }) => {
    let changed = false;
    const pixels = bgDataTexture.pixels;
    const topRow = Math.floor(Math.abs(pageDelta) / pastedCharH);
    const bottomRow = topRow + Math.ceil(p.height / pastedCharH);
    const isWithinGrid = (col, row) =>
      col >= 0 && row >= 0 && col < bgCols && row < bgRows;

    // Both rates are derived here from the current canvas width.
    const linesPerSecond = Math.max(
      1,
      Math.ceil(p.width / config.widthRatioConst),
    );
    const framesForLine = Math.max(
      1,
      Math.ceil(config.targetFps / linesPerSecond),
    );

    // Pausing prevents new lines; existing lines continue until they disappear.
    if (!motionPaused && p.frameCount % framesForLine === 0) {
      lines.push(generateLine(p, bgCols, topRow, bottomRow));
    }

    const survivingLines = [];
    for (const line of lines) {
      const tailCol = line.col - line.dirX * maxLineLength;
      const tailRow = line.row - line.dirY * maxLineLength;
      const killable =
        (line.dirX === -1 && tailCol < 0) ||
        (line.dirX === 1 && tailCol > bgCols) ||
        (line.dirY === -1 && tailRow < topRow - config.margin) ||
        (line.dirY === 1 && tailRow > bottomRow + config.margin);

      if (!killable) {
        survivingLines.push(line);
        continue;
      }

      for (let s = 0; s <= maxLineLength + line.speed; s++) {
        const col = line.col - s * line.dirX;
        const row = line.row - s * line.dirY;
        if (!isWithinGrid(col, row)) continue;
        const index = (row * bgCols + col) * 4;
        if (
          pixels[index + 2] !== 255 &&
          pixels[index + 2] !== 150 &&
          pixels[index + 2] !== 140 &&
          pixels[index + 3] !== 0
        ) {
          pixels[index + 3] = 0;
          changed = true;
        }
      }
    }
    lines = survivingLines;

    for (const line of lines) {
      for (let letter = 0; letter < colors.length; letter++) {
        const col = line.col - letter * line.dirX;
        const row = line.row - letter * line.dirY;
        if (!isWithinGrid(col, row)) continue;
        const index = (row * bgCols + col) * 4;
        if (pixels[index + 2] !== 255 && pixels[index + 2] !== 150) {
          pixels[index] = 255;
          pixels[index + 1] = colorIndexMap.get(colors[letter]);
          pixels[index + 2] = 120;
          pixels[index + 3] = 255;
          changed = true;
        }
      }

      for (let s = 0; s <= line.speed; s++) {
        const col = line.col - (colors.length + s) * line.dirX;
        const row = line.row - (colors.length + s) * line.dirY;
        if (!isWithinGrid(col, row)) continue;
        const index = (row * bgCols + col) * 4;
        if (
          pixels[index + 2] !== 255 &&
          pixels[index + 2] !== 150 &&
          pixels[index + 3] !== 0
        ) {
          pixels[index + 3] = 0;
          changed = true;
        }
      }

      line.frame++;
      line.row += line.speed * line.dirY;
      line.col += line.speed * line.dirX;
    }

    return changed;
  };

  const reset = () => {
    lines = [];
  };

  return { colors, update, reset };
};
