'use client';
import { useState, useEffect, useRef } from 'react';
import { Swords } from 'lucide-react';

const BOARD_SIZES = [5, 6, 7, 8];
const TIMER_OPTIONS = [15, 30, 60];
const moves = [
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [-2, -1],
  [-1, -2],
  [1, -2],
  [2, -1],
];

function getNextMoves(knight: [number, number], visited: boolean[][]) {
  const N = visited.length;
  const [kx, ky] = knight;
  return moves
    .map(([dx, dy]) => [kx + dx, ky + dy] as [number, number])
    .filter(([x, y]) => x >= 0 && x < N && y >= 0 && y < N && !visited[x][y]);
}

export default function KnightsTour() {
  const [boardSize, setBoardSize] = useState(8);
  const N = boardSize;
  const [knight, setKnight] = useState<[number, number] | null>(null);
  const [visited, setVisited] = useState(Array.from({ length: N }, () => Array(N).fill(false)));
  const [moveCount, setMoveCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [timerSec, setTimerSec] = useState(30);
  const [timer, setTimer] = useState(timerSec);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [failReason, setFailReason] = useState<null | 'timeout' | 'no-move' | 'success'>(null);

  // 타이머 옵션 변경 시 초기화
  function handleTimerChange(sec: number) {
    setTimerSec(sec);
    setTimer(sec);
  }

  // 보드 크기 변경 시 상태 초기화
  function handleSizeChange(size: number) {
    setBoardSize(size);
    setKnight(null);
    setVisited(Array.from({ length: size }, () => Array(size).fill(false)));
    setMoveCount(0);
    setGameOver(false);
    setStarted(false);
    setTimer(timerSec);
  }

  // 타이머 관리
  useEffect(() => {
    if (!started || gameOver) return;
    setTimer(timerSec);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line
  }, [moveCount, started, gameOver, timerSec]);

  // 타임아웃 시 실패 처리
  useEffect(() => {
    if (!started || gameOver) return;
    if (timer <= 0) {
      setGameOver(true);
      setFailReason('timeout');
    }
    // eslint-disable-next-line
  }, [timer]);

  // 누적 타이머 관리
  useEffect(() => {
    if (started && !gameOver) {
      totalTimerRef.current = setInterval(() => {
        setTotalTime((t) => t + 1);
      }, 1000);
    } else if (totalTimerRef.current) {
      clearInterval(totalTimerRef.current);
    }
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, [started, gameOver]);

  function handleCellClick(x: number, y: number, force = false) {
    if (!started) {
      setKnight([x, y]);
      const newVisited = Array.from({ length: N }, () => Array(N).fill(false));
      newVisited[x][y] = true;
      setVisited(newVisited);
      setMoveCount(1);
      setStarted(true);
      setGameOver(false);
      setFailReason(null);
      setTimer(timerSec);
      return;
    }
    if (gameOver || !knight) return;
    const [kx, ky] = knight;
    const isKnightMove = moves.some(([dx, dy]) => kx + dx === x && ky + dy === y);
    if ((!isKnightMove || visited[x][y]) && !force) return;
    const newVisited = visited.map((row) => [...row]);
    newVisited[x][y] = true;
    setKnight([x, y]);
    setVisited(newVisited);
    setMoveCount(moveCount + 1);
    setTimer(timerSec);
    if (moveCount + 1 === N * N) {
      setGameOver(true);
      setFailReason('success');
      return;
    }
    // 이동 후 더 이상 이동할 곳이 없으면 실패 처리
    const nextMoves = getNextMoves([x, y], newVisited);
    if (nextMoves.length === 0) {
      setGameOver(true);
      setFailReason('no-move');
    }
  }

  function handleReset() {
    setKnight(null);
    setVisited(Array.from({ length: N }, () => Array(N).fill(false)));
    setMoveCount(0);
    setGameOver(false);
    setStarted(false);
    setTimer(timerSec);
    setTotalTime(0);
    setFailReason(null);
  }

  return (
    <div className='flex flex-col items-center gap-6'>
      <h2 className='text-2xl font-bold mb-2 text-amber-800'>기사의 여행</h2>
      <div className='flex gap-2 mb-2'>
        {BOARD_SIZES.map((size) => (
          <button
            key={size}
            className={`px-3 py-1 rounded border text-sm font-semibold transition-colors
              ${
                boardSize === size
                  ? 'bg-yellow-400 text-white border-yellow-500'
                  : 'bg-white border-gray-300 hover:bg-yellow-100'
              }
              ${started ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !started && handleSizeChange(size)}
            disabled={started}
          >
            {size}x{size}
          </button>
        ))}
      </div>
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
              ${started ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !started && handleTimerChange(sec)}
            disabled={started}
          >
            {sec}초
          </button>
        ))}
        {started && !gameOver && <span className='ml-2 text-lg font-bold text-blue-700'>⏰ {timer}</span>}
      </div>
      <div className='flex flex-col items-center gap-2'>
        <div
          className='border-2 border-gray-400 grid'
          style={{
            gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${N}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: N * N }).map((_, idx) => {
            const x = Math.floor(idx / N);
            const y = idx % N;
            const isKnight = knight && knight[0] === x && knight[1] === y;
            const isVisited = visited[x][y];
            const isNext =
              started &&
              knight &&
              !isKnight &&
              !isVisited &&
              moves.some(([dx, dy]) => knight[0] + dx === x && knight[1] + dy === y);
            const canSelectStart = !started;
            return (
              <button
                key={idx}
                className={`w-10 h-10 flex items-center justify-center border border-gray-300 text-lg
                  ${
                    isKnight
                      ? 'bg-yellow-300'
                      : isVisited
                      ? 'bg-gray-200'
                      : isNext
                      ? 'bg-yellow-100 hover:bg-green-300'
                      : 'bg-white hover:bg-gray-100'
                  }
                  ${(x + y) % 2 === 0 ? '' : 'bg-gray-50'}
                  transition-colors`}
                onClick={() => handleCellClick(x, y)}
                disabled={isKnight || isVisited || gameOver || (started && !isNext)}
              >
                {isKnight ? (
                  <Swords className='w-6 h-6 text-yellow-700' />
                ) : isVisited && started ? (
                  moveCount > 1 ? (
                    '•'
                  ) : (
                    ''
                  )
                ) : (
                  ''
                )}
              </button>
            );
          })}
        </div>
        <div className='flex gap-4 mt-4 items-center'>
          <span className='text-gray-700'>이동 수: {moveCount}</span>
          <span className='text-gray-700'>⏱ {totalTime}</span>
          <button onClick={handleReset} className='px-4 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm font-medium'>
            리셋
          </button>
        </div>
        {!started && <div className='mt-4 text-blue-600 font-semibold'>시작할 위치를 선택하세요!</div>}
        {gameOver && started && failReason === 'timeout' && (
          <div className='mt-4 text-red-600 font-bold'>실패! (시간 초과)</div>
        )}
        {gameOver && started && failReason === 'no-move' && (
          <div className='mt-4 text-red-600 font-bold'>실패! (더 이상 이동할 곳이 없습니다)</div>
        )}
        {gameOver && started && failReason === 'success' && (
          <div className='mt-4 text-green-600 font-bold'>축하합니다! 모든 칸을 방문했습니다 🎉</div>
        )}
      </div>
    </div>
  );
}
