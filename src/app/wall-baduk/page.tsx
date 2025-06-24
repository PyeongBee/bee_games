'use client';
import { useState, useEffect, useRef } from 'react';
import { Circle, Square } from 'lucide-react';

const N = 7;

// 플레이어 정보
const players = [
  { name: '플레이어 1', color: 'text-blue-600', icon: Circle },
  { name: '플레이어 2', color: 'text-red-600', icon: Square },
];

// 초기 돌 위치 (예시: 각자 모서리)
const initialStones: [number, number, number][] = [
  [1, 1, 0], // 플레이어 1 (파랑)
  [1, 5, 1], // 플레이어 2 (빨강)
  [5, 5, 0], // 플레이어 1 (파랑)
  [5, 1, 1], // 플레이어 2 (빨강)
];

// 벽 정보: 각 셀의 오른쪽/아래쪽에 벽이 있는지 저장 (number|null: 설치한 플레이어)
function createEmptyWalls() {
  return {
    right: Array.from({ length: N }, () => Array(N).fill(null) as (number | null)[]),
    down: Array.from({ length: N }, () => Array(N).fill(null) as (number | null)[]),
  };
}

// 돌을 뛰어넘지 못하게, 경로에 돌이 있는지 체크
function isValidMove(
  from: [number, number],
  to: [number, number],
  walls: { right: (number | null)[][]; down: (number | null)[][] },
  stones: [number, number, number][]
) {
  const [fx, fy] = from;
  const [tx, ty] = to;
  if (fx === tx && fy === ty) return true;
  const straightDirs = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  const diagDirs = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  // 직선 1, 2칸
  for (const [dx, dy] of straightDirs) {
    for (let dist = 1; dist <= 2; dist++) {
      const nx = fx + dx * dist;
      const ny = fy + dy * dist;
      if (nx === tx && ny === ty) {
        let blocked = false;
        let cx = fx,
          cy = fy;
        for (let step = 1; step <= dist; step++) {
          const tx2 = fx + dx * step;
          const ty2 = fy + dy * step;
          if (!canMoveStep(cx, cy, tx2, ty2, walls)) {
            blocked = true;
            break;
          }
          if (step < dist && stones.some(([ox, oy]) => ox === tx2 && oy === ty2)) {
            blocked = true;
            break;
          }
          cx = tx2;
          cy = ty2;
        }
        if (blocked) return false;
        if (stones.some(([ox, oy]) => ox === nx && oy === ny)) return false;
        return true;
      }
    }
  }
  // 대각선 1칸만
  for (const [dx, dy] of diagDirs) {
    const nx = fx + dx;
    const ny = fy + dy;
    if (nx === tx && ny === ty) {
      if (!canMoveStep(fx, fy, nx, ny, walls)) return false;
      if (stones.some(([ox, oy]) => ox === nx && oy === ny)) return false;
      return true;
    }
  }
  return false;
}

function canMoveStep(
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  walls: { right: (number | null)[][]; down: (number | null)[][] }
) {
  // fx, fy → tx, ty로 한 칸 이동 시 벽 체크
  if (fx === tx && Math.abs(fy - ty) === 1) {
    // 좌우
    if (fy < ty) return !walls.right[fx][fy];
    else return !walls.right[fx][ty];
  } else if (fy === ty && Math.abs(fx - tx) === 1) {
    // 상하
    if (fx < tx) return !walls.down[fx][fy];
    else return !walls.down[tx][fy];
  } else if (Math.abs(fx - tx) === 1 && Math.abs(fy - ty) === 1) {
    // 대각선: 두 경로 중 하나라도 벽이 없으면 허용
    const path1 = !walls.right[fx][fy] && !walls.down[fx][ty];
    const path2 = !walls.down[fx][fy] && !walls.right[tx][fy];
    return path1 || path2;
  }
  return false;
}

// 벽 설치 가능 위치: 방금 이동한 돌의 상하좌우만
function getAvailableWalls(lastMoved: [number, number]) {
  const [x, y] = lastMoved;
  const result: { x: number; y: number; dir: 'right' | 'down' }[] = [];
  if (y < N - 1) result.push({ x, y, dir: 'right' });
  if (y > 0) result.push({ x, y: y - 1, dir: 'right' });
  if (x < N - 1) result.push({ x, y, dir: 'down' });
  if (x > 0) result.push({ x: x - 1, y, dir: 'down' });
  return result;
}

// 구역 분할 및 소유권 판정
function getAreas(
  stones: [number, number, number][],
  walls: { right: (number | null)[][]; down: (number | null)[][] }
) {
  const visited = Array.from({ length: N }, () => Array(N).fill(false));
  const areaMap: number[][] = Array.from({ length: N }, () => Array(N).fill(-1));
  const areas: { cells: [number, number][]; owners: number[] }[] = [];
  let areaId = 0;
  const dirs: [number, number, string][] = [
    [0, 1, 'right'],
    [1, 0, 'down'],
    [0, -1, 'right'],
    [-1, 0, 'down'],
  ];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (visited[i][j]) continue;
      // BFS로 구역 탐색
      const queue: [number, number][] = [[i, j]];
      visited[i][j] = true;
      areaMap[i][j] = areaId;
      const cells: [number, number][] = [[i, j]];
      while (queue.length) {
        const [x, y] = queue.shift()!;
        for (let d = 0; d < 4; d++) {
          const dx = Number(dirs[d][0]);
          const dy = Number(dirs[d][1]);
          const nx = Number(x) + dx;
          const ny = Number(y) + dy;
          if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue;
          // 벽 체크
          if (d === 0 && walls.right[x][y] !== null) continue; // 오른쪽
          if (d === 1 && walls.down[x][y] !== null) continue; // 아래
          if (d === 2 && walls.right[nx][ny] !== null) continue; // 왼쪽
          if (d === 3 && walls.down[nx][ny] !== null) continue; // 위
          if (!visited[nx][ny]) {
            visited[nx][ny] = true;
            areaMap[nx][ny] = areaId;
            queue.push([nx, ny]);
            cells.push([nx, ny]);
          }
        }
      }
      // 구역 내 돌 소유자 판정
      const owners: number[] = [];
      stones.forEach((s) => {
        if (cells.some(([x, y]) => s[0] === x && s[1] === y)) owners.push(s[2]);
      });
      areas.push({ cells, owners });
      areaId++;
    }
  }
  return { areas, areaMap };
}

// 게임 종료 판정: 모든 돌이 이동 불가 or 모든 구역 소유자 확정
function isGameOver(
  stones: [number, number, number][],
  walls: { right: (number | null)[][]; down: (number | null)[][] }
) {
  // 모든 돌이 이동 불가
  for (let i = 0; i < stones.length; i++) {
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        if (isValidMove([x, y], [x, y], walls, stones)) {
          if (!(stones[i][0] === x && stones[i][1] === y)) return false;
        }
      }
    }
  }
  return true;
}

const TIMER_OPTIONS = [15, 30, 60];

export default function WallBaduk() {
  // stones: [x, y, owner] 배열
  const [stones, setStones] = useState(initialStones);
  const [turn, setTurn] = useState(0); // 0: 파랑(A), 1: 빨강(B)
  const [walls, setWalls] = useState(createEmptyWalls());
  const [gameEnd, setGameEnd] = useState(false);
  const [phase, setPhase] = useState<'placement' | 'move' | 'wall'>('placement');
  const [placementStep, setPlacementStep] = useState(0); // 0~3
  const [hoverWall, setHoverWall] = useState<{ x: number; y: number; dir: 'right' | 'down' } | null>(null);
  const [selectedStone, setSelectedStone] = useState<number | null>(null); // 선택된 돌 인덱스
  const [lastMovedStone, setLastMovedStone] = useState<[number, number] | null>(null);
  const [timerSec, setTimerSec] = useState(30);
  const [timer, setTimer] = useState(timerSec);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // placementOrder: [A, B, B, A]
  const placementOrder = [0, 1, 1, 0];

  // placement phase: 돌 추가 배치
  function handlePlacement(x: number, y: number) {
    // 이미 돌이 있는 칸은 불가
    if (stones.some(([sx, sy]) => sx === x && sy === y)) return;
    const owner = placementOrder[placementStep];
    setStones([...stones, [x, y, owner]]);
    if (placementStep === 3) {
      setPhase('move');
      setTurn(0); // 파랑(A)부터 시작
    } else {
      setPlacementStep(placementStep + 1);
    }
  }

  // 구역 및 소유권 계산
  const { areas, areaMap } = getAreas(stones, walls);
  // 점수 계산
  const scores = [0, 0];
  areas.forEach((area) => {
    if (area.owners.length === 1) {
      scores[area.owners[0]] += area.cells.length;
    }
  });

  // 이동 가능 칸 계산
  function getMovableCells(stoneIdx: number) {
    const [sx, sy] = [stones[stoneIdx][0], stones[stoneIdx][1]];
    const result: [number, number][] = [];
    const straightDirs = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0], // 상하좌우
    ];
    const diagDirs = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1], // 대각선
    ];
    // 제자리
    result.push([sx, sy]);
    // 직선 1, 2칸
    for (const [dx, dy] of straightDirs) {
      for (let dist = 1; dist <= 2; dist++) {
        const nx = sx + dx * dist;
        const ny = sy + dy * dist;
        if (nx < 0 || nx >= N || ny < 0 || ny >= N) break;
        let blocked = false;
        let cx = sx,
          cy = sy;
        for (let step = 1; step <= dist; step++) {
          const tx = sx + dx * step;
          const ty = sy + dy * step;
          if (!canMoveStep(cx, cy, tx, ty, walls)) {
            blocked = true;
            break;
          }
          if (step < dist && stones.some(([ox, oy]) => ox === tx && oy === ty)) {
            blocked = true;
            break;
          }
          cx = tx;
          cy = ty;
        }
        if (blocked) break;
        if (stones.some(([ox, oy]) => ox === nx && oy === ny)) break;
        result.push([nx, ny]);
      }
    }
    // 대각선 1칸만
    for (const [dx, dy] of diagDirs) {
      const nx = sx + dx;
      const ny = sy + dy;
      if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue;
      if (!canMoveStep(sx, sy, nx, ny, walls)) continue;
      if (stones.some(([ox, oy]) => ox === nx && oy === ny)) continue;
      result.push([nx, ny]);
    }
    return result;
  }

  function handleCellClick(x: number, y: number) {
    if (phase !== 'move' || selectedStone === null) return; // move 단계가 아니거나 선택된 돌이 없으면 동작하지 않음
    // 이동 단계: 선택된 돌만 이동 가능, 이동 가능 칸만 허용
    const [sx, sy] = [stones[selectedStone][0], stones[selectedStone][1]];
    if (!(sx === x && sy === y) && stones.some(([ox, oy]) => ox === x && oy === y)) return;
    if (!isValidMove([sx, sy], [x, y], walls, stones)) return;
    // 이동
    const newStones: [number, number, number][] = stones.map((s, i) => (i === selectedStone ? [x, y, s[2]] : s));
    setStones(newStones);
    setSelectedStone(null);
    setLastMovedStone([x, y]); // 이동한 돌 좌표 저장
    setPhase('wall');
  }

  function handleCancelSelect() {
    setSelectedStone(null);
  }

  function handleWallClick(x: number, y: number, dir: 'right' | 'down') {
    if (gameEnd || phase !== 'wall') return;
    if (walls[dir][x][y] !== null) return;
    const newWalls = {
      right: walls.right.map((row) => [...row]),
      down: walls.down.map((row) => [...row]),
    };
    newWalls[dir][x][y] = turn;
    setWalls(newWalls);
    setPhase('move');
    setLastMovedStone(null); // 벽 설치 후 초기화
    // 게임 종료 체크
    if (isGameOver(stones, newWalls)) {
      setGameEnd(true);
    } else {
      setTurn((turn + 1) % 2);
    }
  }

  function handleWallMouseEnter(x: number, y: number, dir: 'right' | 'down') {
    setHoverWall({ x, y, dir });
  }
  function handleWallMouseLeave() {
    setHoverWall(null);
  }

  function handleReset() {
    setStones(initialStones);
    setWalls(createEmptyWalls());
    setTurn(0);
    setGameEnd(false);
    setPhase('placement');
    setPlacementStep(0);
    setHoverWall(null);
    setSelectedStone(null);
    setLastMovedStone(null);
  }

  // 벽 설치 가능 위치 계산
  const availableWalls = phase === 'wall' && lastMovedStone ? getAvailableWalls(lastMovedStone) : [];

  // 타이머 옵션 변경 시 초기화
  function handleTimerChange(sec: number) {
    setTimerSec(sec);
    setTimer(sec);
  }

  // 타이머 관리
  useEffect(() => {
    if (phase === 'placement' || gameEnd) return;
    setTimer(timerSec);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, turn, gameEnd, timerSec]);

  // 타임아웃 시 자동 진행
  useEffect(() => {
    if (phase === 'placement' || gameEnd) return;
    if (timer <= 0) {
      if (phase === 'move') {
        // 움직일 수 있는 돌 중 랜덤 돌의 제자리
        const myStones = stones.map((s, i) => ({ ...s, idx: i })).filter((s) => s[2] === turn);
        const movable = myStones.filter((s) => getMovableCells(s.idx).length > 0);
        let targetIdx = null;
        if (movable.length > 0) {
          const rand = movable[Math.floor(Math.random() * movable.length)];
          targetIdx = rand.idx;
        } else {
          // 모두 못 움직이면 아무 돌이나
          if (myStones.length > 0) targetIdx = myStones[0].idx;
        }
        if (targetIdx !== null) {
          setSelectedStone(targetIdx);
          // 제자리 이동
          setTimeout(() => handleCellClick(stones[targetIdx][0], stones[targetIdx][1]), 300);
        }
      } else if (phase === 'wall' && lastMovedStone) {
        // 벽 설치 가능 위치 중 랜덤
        const available = getAvailableWalls(lastMovedStone).filter((w) => walls[w.dir][w.x][w.y] === null);
        if (available.length > 0) {
          const rand = available[Math.floor(Math.random() * available.length)];
          setTimeout(() => handleWallClick(rand.x, rand.y, rand.dir), 300);
        }
      }
    }
    // eslint-disable-next-line
  }, [timer]);

  return (
    <div className='flex flex-col items-center gap-6'>
      <h2 className='text-2xl font-bold mb-2 text-amber-800'>벽바둑</h2>
      <div className='flex gap-2 mb-2 items-center'>
        {TIMER_OPTIONS.map((sec) => (
          <button
            key={sec}
            className={`px-3 py-1 rounded border text-sm font-semibold transition-colors
              ${
                timerSec === sec
                  ? 'bg-blue-400 text-white border-blue-500'
                  : 'bg-white border-gray-300 hover:bg-blue-100'
              }
              ${phase !== 'placement' ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => phase === 'placement' && handleTimerChange(sec)}
            disabled={phase !== 'placement'}
          >
            {sec}초
          </button>
        ))}
        {phase !== 'placement' && !gameEnd && <span className='ml-2 text-lg font-bold text-blue-700'>⏰ {timer}</span>}
      </div>
      <div className='mb-2 text-gray-700 font-medium'>
        {gameEnd ? (
          <span className='text-xl font-bold text-green-700'>게임 종료!</span>
        ) : phase === 'placement' ? (
          <>
            돌 추가 배치:{' '}
            <span className={players[placementOrder[placementStep]].color}>
              {players[placementOrder[placementStep]].name}
            </span>
          </>
        ) : phase === 'move' ? (
          <>
            {selectedStone === null ? (
              <>
                돌 선택: <span className={players[turn].color}>{players[turn].name}</span>
              </>
            ) : (
              <>
                이동할 칸 선택{' '}
                <button onClick={handleCancelSelect} className='ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded'>
                  선택 취소
                </button>
              </>
            )}
          </>
        ) : (
          <>
            벽 설치: <span className={players[turn].color}>{players[turn].name}</span>
          </>
        )}
      </div>
      <div className='relative' style={{ width: N * 48, height: N * 48 }}>
        <div className='grid grid-cols-7 grid-rows-7 border-2 border-gray-400 absolute top-0 left-0'>
          {Array.from({ length: N * N }).map((_, idx) => {
            const x = Math.floor(idx / N);
            const y = idx % N;
            const stoneIdx = stones.findIndex(([sx, sy]) => sx === x && sy === y);
            const StoneIcon = stoneIdx !== -1 ? players[stones[stoneIdx][2]].icon : null;
            let bg = '';
            const area = areaMap[x][y];
            if (area !== -1) {
              if (areas[area].owners.length === 1) {
                bg = areas[area].owners[0] === 0 ? 'bg-blue-50' : 'bg-red-50';
              } else if (areas[area].owners.length > 1) {
                bg = 'bg-gray-100';
              }
            }
            // 이동 가능 칸 하이라이트
            let highlight = '';
            if (phase === 'move' && selectedStone !== null) {
              const movables = getMovableCells(selectedStone);
              if (movables.some(([mx, my]) => mx === x && my === y)) {
                highlight = 'bg-yellow-100 z-10';
              }
            }
            return (
              <button
                key={idx}
                className={`w-12 h-12 flex items-center justify-center border border-gray-300 text-2xl ${bg} ${highlight} hover:bg-green-300 transition-colors relative`}
                onClick={() => (phase === 'placement' ? handlePlacement(x, y) : handleCellClick(x, y))}
                disabled={
                  gameEnd ||
                  (phase === 'placement'
                    ? stones.some(([sx, sy]) => sx === x && sy === y)
                    : phase !== 'move' ||
                      (selectedStone !== null
                        ? !getMovableCells(selectedStone).some(([mx, my]) => mx === x && my === y)
                        : stones.findIndex(([sx, sy, owner]) => sx === x && sy === y && owner === turn) === -1))
                }
              >
                {StoneIcon && <StoneIcon className={players[stones[stoneIdx][2]].color} />}
                {/* 선택된 돌 테두리 */}
                {phase === 'move' &&
                  selectedStone !== null &&
                  stones[selectedStone][0] === x &&
                  stones[selectedStone][1] === y && (
                    <span className='absolute inset-0 border-2 border-yellow-500 rounded-full pointer-events-none'></span>
                  )}
              </button>
            );
          })}
        </div>
        {/* 벽 시각화 + 벽 설치 가이드 */}
        {/* 오른쪽 벽 */}
        {walls.right.map((row, i) =>
          row.map((v, j) => {
            const isAvailable = availableWalls.some((w) => w.x === i && w.y === j && w.dir === 'right');
            return (
              <div
                key={`r${i}-${j}`}
                className={`absolute`}
                style={{
                  left: 48 * (j + 1) - 4,
                  top: 48 * i + 8,
                  width: 8,
                  height: 32,
                  borderRadius: 4,
                  zIndex: 10,
                  backgroundColor:
                    hoverWall &&
                    hoverWall.dir === 'right' &&
                    hoverWall.x === i &&
                    hoverWall.y === j &&
                    phase === 'wall' &&
                    v === null &&
                    isAvailable
                      ? 'rgba(253, 224, 71, 0.6)'
                      : v === 0
                      ? '#3b82f6'
                      : v === 1
                      ? '#ef4444'
                      : undefined,
                  cursor: phase === 'wall' && v === null && isAvailable ? 'pointer' : 'default',
                  opacity:
                    v !== null ||
                    (hoverWall &&
                      hoverWall.dir === 'right' &&
                      hoverWall.x === i &&
                      hoverWall.y === j &&
                      phase === 'wall' &&
                      v === null &&
                      isAvailable)
                      ? 1
                      : 0.2,
                }}
                onClick={() => phase === 'wall' && v === null && isAvailable && handleWallClick(i, j, 'right')}
                onMouseEnter={() =>
                  phase === 'wall' && v === null && isAvailable && handleWallMouseEnter(i, j, 'right')
                }
                onMouseLeave={handleWallMouseLeave}
              />
            );
          })
        )}
        {/* 아래쪽 벽 */}
        {walls.down.map((row, i) =>
          row.map((v, j) => {
            const isAvailable = availableWalls.some((w) => w.x === i && w.y === j && w.dir === 'down');
            return (
              <div
                key={`d${i}-${j}`}
                className={`absolute`}
                style={{
                  left: 48 * j + 8,
                  top: 48 * (i + 1) - 4,
                  width: 32,
                  height: 8,
                  borderRadius: 4,
                  zIndex: 10,
                  backgroundColor:
                    hoverWall &&
                    hoverWall.dir === 'down' &&
                    hoverWall.x === i &&
                    hoverWall.y === j &&
                    phase === 'wall' &&
                    v === null &&
                    isAvailable
                      ? 'rgba(253, 224, 71, 0.6)'
                      : v === 0
                      ? '#3b82f6'
                      : v === 1
                      ? '#ef4444'
                      : undefined,
                  cursor: phase === 'wall' && v === null && isAvailable ? 'pointer' : 'default',
                  opacity:
                    v !== null ||
                    (hoverWall &&
                      hoverWall.dir === 'down' &&
                      hoverWall.x === i &&
                      hoverWall.y === j &&
                      phase === 'wall' &&
                      v === null &&
                      isAvailable)
                      ? 1
                      : 0.2,
                }}
                onClick={() => phase === 'wall' && v === null && isAvailable && handleWallClick(i, j, 'down')}
                onMouseEnter={() => phase === 'wall' && v === null && isAvailable && handleWallMouseEnter(i, j, 'down')}
                onMouseLeave={handleWallMouseLeave}
              />
            );
          })
        )}
      </div>
      <div className='flex gap-8 mt-4 text-lg font-semibold'>
        <span className='text-blue-700'>플레이어 1 점수: {scores[0]}</span>
        <span className='text-red-700'>플레이어 2 점수: {scores[1]}</span>
      </div>
      {infoMessage && <div className='mt-2 text-base text-gray-700 font-medium'>{infoMessage}</div>}
      {gameEnd && (
        <div className='mt-2 text-xl font-bold'>
          {scores[0] > scores[1] ? '플레이어 1 승리!' : scores[0] < scores[1] ? '플레이어 2 승리!' : '무승부!'}
        </div>
      )}
      <button
        onClick={handleReset}
        className='mt-2 px-4 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm font-medium'
      >
        리셋
      </button>
    </div>
  );
}
