// Optional effect: scan DOM boxes, then burn their borders/fills into the grid.
// Importing this module does not access the DOM or start any observers.
export const createTrackedBoxes = () => {
  let trackedElements = [];

  const update = () => {
    const trackedBoxes = document.querySelectorAll("[data-ascii-tracked]");

    trackedElements = Array.from(trackedBoxes).map((el) => {
      const rect = el.getBoundingClientRect();
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;

      const borderWidthX = parseInt(el.dataset.asciiBorderWidthX, 10) || 1;
      const borderWidthY = parseInt(el.dataset.asciiBorderWidthY, 10) || 1;
      const placement = el.dataset.asciiBorderPlacement || "inside";
      return {
        el: el,
        ascii: el.dataset.asciiTracked, // Stores "border-box" or "filled-box"
        borderWidthX: borderWidthX,
        borderWidthY: borderWidthY,
        placement: placement,
        vertices: {
          topLeft: { x: rect.left + scrollX, y: rect.top + scrollY },
          topRight: { x: rect.right + scrollX, y: rect.top + scrollY },
          bottomRight: { x: rect.right + scrollX, y: rect.bottom + scrollY },
          bottomLeft: { x: rect.left + scrollX, y: rect.bottom + scrollY },
        },
        size: { width: rect.width, height: rect.height },
      };
    });
    return trackedElements;
  };

  const burn = ({
    bgDataTexture,
    bgCols,
    bgRows,
    pastedCharW,
    pastedCharH,
    uniqueChars,
  }) => {
    let changed = false;
    const isWithinGrid = (col, row) =>
      col >= 0 && row >= 0 && col < bgCols && row < bgRows;

    if (trackedElements.length) {
      trackedElements.forEach((box) => {
        const startCol = Math.floor(box.vertices.topLeft.x / pastedCharW);
        const endCol = Math.floor(box.vertices.bottomRight.x / pastedCharW);
        const startRow = Math.floor(box.vertices.topLeft.y / pastedCharH);
        const endRow = Math.floor(box.vertices.bottomRight.y / pastedCharH);

        const charIndex = uniqueChars.indexOf("+");
        if (charIndex === -1) return;

        const wx = box.borderWidthX;
        const wy = box.borderWidthY;
        const placement = box.placement;

        let outerStartCol, outerEndCol, outerStartRow, outerEndRow;
        let innerStartCol, innerEndCol, innerStartRow, innerEndRow;

        if (placement === "outside") {
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

        // DECOUPLING
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
            changed = true;
          }
        };

        if (box.ascii === "filled-box") {
          for (let r = outerStartRow; r <= outerEndRow; r++) {
            for (let c = outerStartCol; c <= outerEndCol; c++) {
              drawPixel(c, r, FILLED_BOX_BLUE);
            }
          }
        } else if (box.ascii === "border-box") {
          for (let r = outerStartRow; r <= outerEndRow; r++) {
            for (let c = outerStartCol; c <= outerEndCol; c++) {
              if (
                r >= innerStartRow &&
                r <= innerEndRow &&
                c >= innerStartCol &&
                c <= innerEndCol
              ) {
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
    }

    return changed;
  };

  const reset = () => {
    trackedElements = [];
  };

  return { update, burn, reset };
};
