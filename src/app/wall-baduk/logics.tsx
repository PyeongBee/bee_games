export function checkStone(r: number, c: number, stones: [number, number, number][]) {
  return stones.some(([ox, oy]) => ox === r && oy === c);
}

export function checkWall(
  fr: number,
  fc: number,
  tr: number,
  tc: number,
  walls: { right: (number | null)[][]; down: (number | null)[][] },
  direction?: 'CW' | 'CCW'
) {
  if (fr === tr && Math.abs(fc - tc) === 1) {
    // 좌우
    if (fc < tc) {
      return walls.right[fr][fc] !== null;
    } else {
      return walls.right[fr][tc] !== null;
    }
  } else if (fc === tc && Math.abs(fr - tr) === 1) {
    // 상하
    if (fr < tr) {
      return walls.down[fr][fc] !== null;
    } else {
      return walls.down[tr][fc] !== null;
    }
  } else if (Math.abs(fr - tr) === 1 && Math.abs(fc - tc) === 1) {
    if (fr + 1 === tr && fc + 1 === tc) {
      // 좌상단 -> 우하단
      if (direction === 'CW') {
        return walls.right[fr][fc] !== null || walls.down[fr][tc] !== null;
      } else if (direction === 'CCW') {
        return walls.down[fr][fc] !== null || walls.right[tr][fc] !== null;
      }
    } else if (fr - 1 === tr && fc - 1 === tc) {
      // 우하단 -> 좌상단
      if (direction === 'CW') {
        return walls.down[tr][tc] !== null || walls.right[fr][tc] !== null;
      } else if (direction === 'CCW') {
        return walls.right[tr][tc] !== null || walls.down[tr][fc] !== null;
      }
    } else if (fr - 1 === tr && fc + 1 === tc) {
      // 좌하단 -> 우상단
      if (direction === 'CW') {
        return walls.right[tr][fc] !== null || walls.down[tr][fc] !== null;
      } else if (direction === 'CCW') {
        return walls.down[tr][tc] !== null || walls.right[fr][fc] !== null;
      }
    } else if (fr + 1 === tr && fc - 1 === tc) {
      // 우상단 -> 좌하단
      if (direction === 'CW') {
        return walls.down[fr][fc] !== null || walls.right[tr][tc] !== null;
      } else if (direction === 'CCW') {
        return walls.right[fr][tc] !== null || walls.down[fr][tc] !== null;
      }
    }
  }
  return false;
}
