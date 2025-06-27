'use client';

import { useState, useEffect, useRef } from 'react';
import { MAP_SIZE, players, initialStones, TIMER_OPTIONS } from './values';
import { checkStone, checkWall } from './logics';

// 벽 정보: 각 셀의 오른쪽/아래쪽에 벽이 있는지 저장 (number|null: 설치한 플레이어)
function createEmptyWalls() {
  return {
    right: Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(null) as (number | null)[]),
    down: Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(null) as (number | null)[]),
  };
}

// 벽 설치 가능 위치: 방금 이동한 돌의 상하좌우만
function getAvailableWalls(lastMoved: [number, number]) {
  const [r, c] = lastMoved;
  const result: { r: number; c: number; dir: 'right' | 'down' }[] = [];
  if (c < MAP_SIZE - 1) result.push({ r, c, dir: 'right' });
  if (c > 0) result.push({ r, c: c - 1, dir: 'right' });
  if (r < MAP_SIZE - 1) result.push({ r, c, dir: 'down' });
  if (r > 0) result.push({ r: r - 1, c, dir: 'down' });
  return result;
}

// 구역 분할 및 소유권 판정
function getAreas(
  stones: [number, number, number][],
  walls: { right: (number | null)[][]; down: (number | null)[][] }
) {
  const visited = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(false));
  const areaMap: number[][] = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(-1));
  const areas: { cells: [number, number][]; owners: number[] }[] = [];
  let areaId = 0;
  const dirs: [number, number, string][] = [
    [0, 1, 'right'],
    [1, 0, 'down'],
    [0, -1, 'right'],
    [-1, 0, 'down'],
  ];

  // 각 돌에서 시작하여 영역 탐색
  for (let stoneIdx = 0; stoneIdx < stones.length; stoneIdx++) {
    const [startR, startC, stoneOwner] = stones[stoneIdx];

    // 이미 방문한 돌이면 건너뛰기
    if (visited[startR][startC]) continue;

    // BFS로 구역 탐색
    const queue: [number, number][] = [[startR, startC]];
    visited[startR][startC] = true;
    areaMap[startR][startC] = areaId;
    const cells: [number, number][] = [[startR, startC]];
    const ownersInArea: number[] = [stoneOwner];

    while (queue.length) {
      const [r, c] = queue.shift()!;
      for (let d = 0; d < 4; d++) {
        const dr = Number(dirs[d][0]);
        const dc = Number(dirs[d][1]);
        const nr = Number(r) + dr;
        const nc = Number(c) + dc;
        if (nr < 0 || nr >= MAP_SIZE || nc < 0 || nc >= MAP_SIZE) continue;

        // 벽 체크
        if (d === 0 && walls.right[r][c] !== null) continue; // 오른쪽
        if (d === 1 && walls.down[r][c] !== null) continue; // 아래
        if (d === 2 && walls.right[nr][nc] !== null) continue; // 왼쪽
        if (d === 3 && walls.down[nr][nc] !== null) continue; // 위

        if (!visited[nr][nc]) {
          visited[nr][nc] = true;
          areaMap[nr][nc] = areaId;
          queue.push([nr, nc]);
          cells.push([nr, nc]);

          // 해당 위치에 돌이 있는지 확인하고 소유자 추가
          const stoneAtPos = stones.find(([sr, sc]) => sr === nr && sc === nc);
          if (stoneAtPos) {
            ownersInArea.push(stoneAtPos[2]);
          }
        }
      }
    }

    // 영역 내에 다른 색의 돌이 없으면 소유 영역으로 판단
    const uniqueOwners = [...new Set(ownersInArea)];
    if (uniqueOwners.length === 1) {
      areas.push({ cells, owners: [uniqueOwners[0]] });
    } else {
      // 다른 색의 돌이 있으면 소유권 없음
      areas.push({ cells, owners: [] });
    }

    areaId++;
  }

  return { areas, areaMap };
}

// 게임 종료 판정: 모든 돌의 영역이 소유자가 결정되었는지 확인
function isGameOver(
  stones: [number, number, number][],
  walls: { right: (number | null)[][]; down: (number | null)[][] }
) {
  const { areas } = getAreas(stones, walls);

  // 모든 돌이 어떤 영역에 속하는지 확인
  const stoneAreas = new Set<number>();

  for (const stone of stones) {
    const [r, c] = stone;
    for (let i = 0; i < areas.length; i++) {
      if (areas[i].cells.some(([ar, ac]) => ar === r && ac === c)) {
        stoneAreas.add(i);
        break;
      }
    }
  }

  // 모든 돌이 속한 영역의 소유자가 결정되었는지 확인
  for (const areaIdx of stoneAreas) {
    if (areas[areaIdx].owners.length === 0) {
      // 소유자가 결정되지 않은 영역이 있으면 게임 계속
      return false;
    }
  }

  // 모든 돌의 영역이 소유자가 결정되었으면 게임 종료
  return true;
}

export default function WallBaduk() {
  // stones: [r, c, owner] 배열
  const [stones, setStones] = useState(initialStones);
  const [turn, setTurn] = useState(0); // 0: 파랑(A), 1: 빨강(B)
  const [walls, setWalls] = useState(createEmptyWalls());
  const [gameEnd, setGameEnd] = useState(false);
  const [phase, setPhase] = useState<'placement' | 'move' | 'wall'>('placement');
  const [placementStep, setPlacementStep] = useState(0); // 0~3
  const [hoverWall, setHoverWall] = useState<{ r: number; c: number; dir: 'right' | 'down' } | null>(null);
  const [selectedStone, setSelectedStone] = useState<number | null>(null); // 선택된 돌 인덱스
  const [lastMovedStone, setLastMovedStone] = useState<[number, number] | null>(null);
  const [timerSec, setTimerSec] = useState(30);
  const [timer, setTimer] = useState(timerSec);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // 반응형 크기 계산
  const cellSize = isMobile ? 32 : 48;
  const wallThickness = cellSize / 6;
  const wallOffset = cellSize / 12;

  // 화면 크기 감지
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // placementOrder: [A, B, B, A]
  const placementOrder = [0, 1, 1, 0];

  // --- 돌 추가 배치 ---
  function handlePlacement(r: number, c: number) {
    if (stones.some(([sr, sc]) => sr === r && sc === c)) return;
    const owner = placementOrder[placementStep];
    setStones([...stones, [r, c, owner]]);
    if (placementStep === 3) {
      setPhase('move');
      setTurn(0);
    } else {
      setPlacementStep(placementStep + 1);
    }
  }

  // --- 점수/구역 계산 ---
  const { areas, areaMap } = getAreas(stones, walls);
  const scores = [0, 0];
  areas.forEach((area) => {
    if (area.owners.length === 1) {
      scores[area.owners[0]] += area.cells.length;
    }
  });

  // --- 이동 가능 칸 계산 ---
  function getAvailableMoves(stoneIdx: number) {
    const [sr, sc] = [stones[stoneIdx][0], stones[stoneIdx][1]];
    const result: [number, number][] = [];
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
    result.push([sr, sc]); // 제자리
    // 직선 1, 2칸
    for (const [dr, dc] of straightDirs) {
      for (let dist = 1; dist <= 2; dist++) {
        const nr = sr + dr * dist;
        const nc = sc + dc * dist;
        if (nr < 0 || nr >= MAP_SIZE || nc < 0 || nc >= MAP_SIZE) break;
        let blocked = false;
        let cr = sr,
          cc = sc;
        for (let step = 1; step <= dist; step++) {
          const tr = sr + dr * step;
          const tc = sc + dc * step;
          if (checkWall(cr, cc, tr, tc, walls)) {
            blocked = true;
            break;
          }
          if (step < dist && stones.some(([ox, oy]) => ox === tr && oy === tc)) {
            blocked = true;
            break;
          }
          cr = tr;
          cc = tc;
        }
        if (blocked) break;
        if (stones.some(([ox, oy]) => ox === nr && oy === nc)) break;
        result.push([nr, nc]);
      }
    }
    // 대각선 1칸
    for (const [dr, dc] of diagDirs) {
      const nr = sr + dr;
      const nc = sc + dc;
      if (nr < 0 || nr >= MAP_SIZE || nc < 0 || nc >= MAP_SIZE) continue;

      console.log(sr, sc, '->', nr, nc, ' 가능');
      console.log(checkStone(nr, nc, stones));
      console.log(checkStone(sr, nc, stones), checkStone(nr, sc, stones));
      console.log(checkWall(sr, sc, nr, nc, walls));
      console.log(stones);
      console.log(walls);

      if (checkStone(nr, nc, stones)) continue;
      if (checkStone(sr, nc, stones) && checkStone(nr, sc, stones)) continue;
      if (checkWall(sr, sc, nr, nc, walls)) continue;
      result.push([nr, nc]);
    }
    return result;
  }

  // --- 돌 클릭(이동/선택) ---
  function handleMoveOrSelect(r: number, c: number) {
    if (phase !== 'move') return;
    if (selectedStone === null) {
      const idx = stones.findIndex(([sr, sc, owner]) => sr === r && sc === c && owner === turn);
      if (idx !== -1) setSelectedStone(idx);
      return;
    }
    const [sr, sc] = stones[selectedStone];
    if (sr === r && sc === c) {
      setSelectedStone(null);
      setLastMovedStone([r, c]);
      setPhase('wall');
      return;
    }
    const idx = stones.findIndex(([dr, dc, dOwner]) => dr === r && dc === c && dOwner === turn);
    if (idx !== -1) {
      setSelectedStone(idx);
      return;
    }
    const moves = getAvailableMoves(selectedStone);
    if (!moves.some(([mr, mc]) => mr === r && mc === c)) return;
    const newStones: [number, number, number][] = stones.map((s, i) => (i === selectedStone ? [r, c, s[2]] : s));
    setStones(newStones);
    setSelectedStone(null);
    setLastMovedStone([r, c]);
    setPhase('wall');
  }

  function handleCancelSelect() {
    setSelectedStone(null);
  }

  // --- 벽 설치 가능 위치 계산 ---
  const availableWalls =
    phase === 'wall' && lastMovedStone
      ? getAvailableWalls(lastMovedStone).filter((w) => walls[w.dir][w.r][w.c] === null)
      : [];

  // --- 벽 설치 ---
  function handlePlaceWall(r: number, c: number, dir: 'right' | 'down') {
    if (gameEnd || phase !== 'wall') return;
    if (walls[dir][r][c] !== null) return;
    const newWalls = {
      right: walls.right.map((row) => [...row]),
      down: walls.down.map((row) => [...row]),
    };
    newWalls[dir][r][c] = turn;
    setWalls(newWalls);
    setPhase('move');
    setLastMovedStone(null);
    if (isGameOver(stones, newWalls)) setGameEnd(true);
    else setTurn((turn + 1) % 2);
  }

  // --- 벽 설치 불가 시 턴 자동 넘김 ---
  useEffect(() => {
    if (phase === 'wall' && lastMovedStone) {
      const available = getAvailableWalls(lastMovedStone).filter((w) => walls[w.dir][w.r][w.c] === null);
      if (available.length === 0) {
        setPhase('move');
        setLastMovedStone(null);
        setTurn((turn + 1) % 2);
        setInfoMessage('놓을 수 있는 벽이 없어 턴이 자동으로 넘어갔습니다.');
        setTimeout(() => setInfoMessage(null), 2000);
      }
    }
  }, [phase, lastMovedStone, walls, turn]);

  function handleWallMouseEnter(r: number, c: number, dir: 'right' | 'down') {
    setHoverWall({ r, c, dir });
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

  // --- 타이머 옵션 변경 ---
  function handleTimerChange(sec: number) {
    setTimerSec(sec);
    setTimer(sec);
  }

  // --- 타이머 관리 ---
  useEffect(() => {
    if (phase === 'placement' || gameEnd || timerSec === 0) return;
    setTimer(timerSec);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, turn, gameEnd, timerSec]);

  // --- 타임아웃 시 자동 진행 ---
  useEffect(() => {
    if (phase === 'placement' || gameEnd || timerSec === 0) return;
    if (timer <= 0) {
      if (phase === 'move') {
        const myStones = stones.map((s, i) => ({ ...s, idx: i })).filter((s) => s[2] === turn);
        const movable = myStones.filter((s) => getAvailableMoves(s.idx).length > 0);
        let targetIdx = null;
        if (movable.length > 0) {
          const rand = movable[Math.floor(Math.random() * movable.length)];
          targetIdx = rand.idx;
        } else {
          if (myStones.length > 0) targetIdx = myStones[0].idx;
        }
        if (targetIdx !== null) {
          setSelectedStone(targetIdx);
          setTimeout(() => handleMoveOrSelect(stones[targetIdx][0], stones[targetIdx][1]), 300);
        }
      } else if (phase === 'wall' && lastMovedStone) {
        const available = getAvailableWalls(lastMovedStone).filter((w) => walls[w.dir][w.r][w.c] === null);
        if (available.length > 0) {
          const rand = available[Math.floor(Math.random() * available.length)];
          setTimeout(() => handlePlaceWall(rand.r, rand.c, rand.dir), 300);
        }
      }
    }
  }, [timer]);

  return (
    <div className='flex flex-col items-center gap-4 md:gap-6 p-4'>
      <h2 className='text-xl md:text-2xl font-bold mb-2 text-amber-800'>벽바둑</h2>
      <div className='flex flex-wrap gap-2 mb-2 items-center justify-center'>
        {TIMER_OPTIONS.map((sec) => (
          <button
            key={sec}
            className={`px-2 md:px-3 py-1 rounded border text-xs md:text-sm font-semibold transition-colors
              ${
                timerSec === sec
                  ? 'bg-blue-400 text-white border-blue-500'
                  : 'bg-white border-gray-300 hover:bg-blue-100'
              }
              ${phase !== 'placement' ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => phase === 'placement' && handleTimerChange(sec)}
            disabled={phase !== 'placement'}
          >
            {sec === 0 ? '없음' : `${sec}초`}
          </button>
        ))}
        {phase !== 'placement' && !gameEnd && timerSec > 0 && (
          <span className='ml-2 text-base md:text-lg font-bold text-blue-700'>⏰ {timer}</span>
        )}
      </div>
      <div className='mb-2 text-sm md:text-base text-gray-700 font-medium text-center'>
        {gameEnd ? (
          <span className='text-lg md:text-xl font-bold text-green-700'>게임 종료!</span>
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
      <div className='relative' style={{ width: MAP_SIZE * cellSize, height: MAP_SIZE * cellSize }}>
        <div
          className='grid grid-cols-7 grid-rows-7 border-2 border-gray-400 absolute top-0 left-0'
          style={{ width: MAP_SIZE * cellSize, height: MAP_SIZE * cellSize }}
        >
          {Array.from({ length: MAP_SIZE * MAP_SIZE }).map((_, idx) => {
            const r = Math.floor(idx / MAP_SIZE);
            const c = idx % MAP_SIZE;
            const stoneIdx = stones.findIndex(([sr, sc]) => sr === r && sc === c);
            const StoneIcon = stoneIdx !== -1 ? players[stones[stoneIdx][2]].icon : null;
            let bg = '';
            const area = areaMap[r][c];
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
              const moves = getAvailableMoves(selectedStone);
              if (moves.some(([mr, mc]) => mr === r && mc === c)) {
                highlight = 'bg-yellow-100 z-10';
              }
            }
            return (
              <button
                key={idx}
                className={`flex items-center justify-center border border-gray-300 ${bg} ${highlight} hover:bg-green-300 transition-colors relative`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  fontSize: cellSize * 0.4,
                }}
                onClick={() => (phase === 'placement' ? handlePlacement(r, c) : handleMoveOrSelect(r, c))}
                disabled={
                  gameEnd ||
                  (phase === 'placement'
                    ? stones.some(([sr, sc]) => sr === r && sc === c)
                    : phase !== 'move' ||
                      (selectedStone !== null
                        ? !getAvailableMoves(selectedStone).some(([mr, mc]) => mr === r && mc === c)
                        : stones.findIndex(([sr, sc, owner]) => sr === r && sc === c && owner === turn) === -1))
                }
              >
                {StoneIcon && <StoneIcon className={players[stones[stoneIdx][2]].color} />}
                {/* 선택된 돌 테두리 */}
                {phase === 'move' &&
                  selectedStone !== null &&
                  stones[selectedStone][0] === r &&
                  stones[selectedStone][1] === c && (
                    <span className='absolute inset-0 border-2 border-yellow-500 rounded-full pointer-events-none'></span>
                  )}
              </button>
            );
          })}
        </div>
        {/* 벽 시각화 + 벽 설치 가이드 */}
        {/* 오른쪽 벽 */}
        {walls.right.map((row, r) =>
          row.map((v, c) => {
            const isAvailable = availableWalls.some((w) => w.r === r && w.c === c && w.dir === 'right');
            return (
              <div
                key={`r${r}-${c}`}
                className={`absolute`}
                style={{
                  left: cellSize * (c + 1) - wallOffset,
                  top: cellSize * r + wallOffset,
                  width: wallThickness,
                  height: cellSize - 2 * wallOffset,
                  borderRadius: 4,
                  zIndex: 10,
                  backgroundColor:
                    hoverWall &&
                    hoverWall.dir === 'right' &&
                    hoverWall.r === r &&
                    hoverWall.c === c &&
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
                      hoverWall.r === r &&
                      hoverWall.c === c &&
                      phase === 'wall' &&
                      v === null &&
                      isAvailable)
                      ? 1
                      : 0.2,
                }}
                onClick={() => phase === 'wall' && v === null && isAvailable && handlePlaceWall(r, c, 'right')}
                onMouseEnter={() =>
                  phase === 'wall' && v === null && isAvailable && handleWallMouseEnter(r, c, 'right')
                }
                onMouseLeave={handleWallMouseLeave}
              />
            );
          })
        )}
        {/* 아래쪽 벽 */}
        {walls.down.map((row, r) =>
          row.map((v, c) => {
            const isAvailable = availableWalls.some((w) => w.r === r && w.c === c && w.dir === 'down');
            return (
              <div
                key={`d${r}-${c}`}
                className={`absolute`}
                style={{
                  left: cellSize * c + wallOffset,
                  top: cellSize * (r + 1) - wallOffset,
                  width: cellSize - 2 * wallOffset,
                  height: wallThickness,
                  borderRadius: 4,
                  zIndex: 10,
                  backgroundColor:
                    hoverWall &&
                    hoverWall.dir === 'down' &&
                    hoverWall.r === r &&
                    hoverWall.c === c &&
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
                      hoverWall.r === r &&
                      hoverWall.c === c &&
                      phase === 'wall' &&
                      v === null &&
                      isAvailable)
                      ? 1
                      : 0.2,
                }}
                onClick={() => phase === 'wall' && v === null && isAvailable && handlePlaceWall(r, c, 'down')}
                onMouseEnter={() => phase === 'wall' && v === null && isAvailable && handleWallMouseEnter(r, c, 'down')}
                onMouseLeave={handleWallMouseLeave}
              />
            );
          })
        )}
      </div>
      <div className='flex flex-col md:flex-row gap-4 md:gap-8 mt-4 text-base md:text-lg font-semibold'>
        <span className='text-blue-700'>플레이어 1 점수: {scores[0]}</span>
        <span className='text-red-700'>플레이어 2 점수: {scores[1]}</span>
      </div>
      {infoMessage && (
        <div className='mt-2 text-sm md:text-base text-gray-700 font-medium text-center'>{infoMessage}</div>
      )}
      {gameEnd && (
        <div className='mt-2 text-lg md:text-xl font-bold text-center'>
          {scores[0] > scores[1] ? '플레이어 1 승리!' : scores[0] < scores[1] ? '플레이어 2 승리!' : '무승부!'}
        </div>
      )}
      <button
        onClick={handleReset}
        className='mt-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm md:text-base font-medium'
      >
        리셋
      </button>
    </div>
  );
}
