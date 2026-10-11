const charMap = {
  ".": {
    substituteChars: "`.,'-",
    color: { r: 0, g: 155, b: 0 },
  },
  ":": {
    substituteChars: ":xlj!=o",
    color: { r: 80, g: 90, b: 80 },
  },
  ";": {
    substituteChars: ":;!jJLlI=",
    color: { r: 190, g: 190, b: 190 },
  },
  "+": {
    substituteChars: "x>+<=^",
    color: { r: 120, g: 190, b: 120 },
  },
  x: {
    substituteChars: "x+X34#ahgure",
    color: { r: 120, g: 190, b: 120 },
  },
  X: {
    substituteChars: "Xx34fO/#",
    color: { r: 200, g: 200, b: 200 },
  },
  $: {
    substituteChars: "#A8Hha",
    color: { r: 0, g: 255, b: 0 },
  },
  "&": {
    substituteChars: "#@8$%",
    color: { r: 255, g: 255, b: 255 },
  },
};

// Prepare orb data once; the sketch owns the shared grid, atlas and shader.
export const createOrb = ({
  rawAscii,
  uniqueChars,
  pastedCharW,
  pastedCharH,
}) => {
  let splitAscii = rawAscii.split("\n");

  splitAscii.forEach((line, i) => {
    splitAscii[i] = line.split("");
  });
  const charImageWidth = splitAscii[0].length;
  const charImageHeight = splitAscii.length;
  let substituteCharTextureData = [];
  let longestSubstitute = 0;

  Object.keys(charMap).forEach((key) => {
    const index = uniqueChars.indexOf(key);
    substituteCharTextureData[index] = [];
    const charArray = charMap[key].substituteChars.split("");
    charArray.forEach((char, i) => {
      substituteCharTextureData[index][i] = uniqueChars.indexOf(char);
    });
    if (charArray.length > longestSubstitute)
      longestSubstitute = charArray.length;
  });

  const colors = [
    ...new Set(
      Object.values(charMap).map(
        (item) => `${item.color.r},${item.color.g},${item.color.b}`,
      ),
    ),
  ];

  const estimHeight = charImageHeight * pastedCharH;
  const estimWidth = charImageWidth * pastedCharW;

  const createSubstituteTexture = (p) => {
    const width = substituteCharTextureData.length;
    const height = longestSubstitute;

    const substituteTexture = p.createImage(width, height);
    substituteTexture.loadPixels();

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let dataValue = 255;

        if (
          substituteCharTextureData[x] !== undefined &&
          substituteCharTextureData[x][y] !== undefined
        ) {
          dataValue = substituteCharTextureData[x][y];
        }

        let index = (y * width + x) * 4;

        substituteTexture.pixels[index] = dataValue;
        substituteTexture.pixels[index + 1] = 0;
        if (y === 0 && substituteCharTextureData[x]) {
          substituteTexture.pixels[index + 2] =
            substituteCharTextureData[x].length - 1;
        } else {
          substituteTexture.pixels[index + 2] = 0;
        }
        substituteTexture.pixels[index + 3] = 255;
      }
    }
    substituteTexture.updatePixels();
    substituteTexture.drawingContext.imageSmoothingEnabled = false;

    return substituteTexture;
  };

  const burn = ({
    p,
    bgDataTexture,
    bgCols,
    bgRows,
    atlasMap,
    colorIndexMap,
  }) => {
    const isWithinGrid = (col, row) =>
      col >= 0 && row >= 0 && col < bgCols && row < bgRows;
    let imgOffsetX = 0;

    const contWidth = 1600;

    if (p.width > contWidth) {
      imgOffsetX = p.width / 2 - estimWidth;
      imgOffsetX > contWidth / 2 - estimWidth
        ? (imgOffsetX = contWidth / 2 - estimWidth)
        : imgOffsetX;
    } else {
      imgOffsetX = -0.1 * p.width;

      if (p.width < 1000) {
        imgOffsetX = -0.3 * p.width;
      }
    }

    let imgStartCol = Math.floor((p.width / 2 + imgOffsetX) / pastedCharW);
    let imgStartRow = Math.floor(
      (p.height / 2 - estimHeight / 2) / pastedCharH,
    );

    // Burn ASCII image into data texture
    for (let iY = 0; iY < splitAscii.length; iY++) {
      const line = splitAscii[iY];
      const realRow = imgStartRow + iY;
      for (let iX = 0; iX < line.length; iX++) {
        const char = line[iX];
        const realCol = imgStartCol + iX;

        if (char === " ") continue;

        let color = charMap[char].color;
        const colorString = `${color.r},${color.g},${color.b}`;
        const colorIndex = colorIndexMap.get(colorString);

        if (!atlasMap[colorString] || !atlasMap[colorString][char]) continue;

        if (isWithinGrid(realCol, realRow)) {
          const index = (realRow * bgCols + realCol) * 4;

          bgDataTexture.pixels[index + 0] = uniqueChars.indexOf(char);
          bgDataTexture.pixels[index + 1] = colorIndex;
          bgDataTexture.pixels[index + 2] = 255; // BLUE = 255 - Image
          bgDataTexture.pixels[index + 3] = 255;
        }
      }
    }
  };

  return { colors, createSubstituteTexture, burn };
};
