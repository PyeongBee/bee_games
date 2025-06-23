'use client';
import { useState } from 'react';
import { Swords } from 'lucide-react';

const N = 8;
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

export default function KnightsTour() {
  const [knight, setKnight] = useState<[number, number] | null>(null);
  const [visited, setVisited] = useState(Array.from({ length: N }, () => Array(N).fill(false)));
  const [moveCount, setMoveCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  function handleCellClick(x: number, y: number) {
    if (!started) {
      // 시작 위치 선택
      setKnight([x, y]);
      const newVisited = Array.from({ length: N }, () => Array(N).fill(false));
      newVisited[x][y] = true;
      setVisited(newVisited);
      setMoveCount(1);
      setStarted(true);
      setGameOver(false);
      return;
    }
    if (gameOver || !knight) return;
    const [kx, ky] = knight;
    const isKnightMove = moves.some(([dx, dy]) => kx + dx === x && ky + dy === y);
    if (!isKnightMove || visited[x][y]) return;
    const newVisited = visited.map((row) => [...row]);
    newVisited[x][y] = true;
    setKnight([x, y]);
    setVisited(newVisited);
    setMoveCount(moveCount + 1);
    // 승리 조건 체크
    if (moveCount + 1 === N * N) setGameOver(true);
  }

  function handleReset() {
    setKnight(null);
    setVisited(Array.from({ length: N }, () => Array(N).fill(false)));
    setMoveCount(0);
    setGameOver(false);
    setStarted(false);
  }

  return (
    <div className='flex flex-col items-center gap-6'>
      <h2 className='text-2xl font-bold mb-2 text-amber-800'>기사의 여행</h2>
      <div className='flex flex-col items-center gap-2'>
        <div className='grid grid-cols-8 grid-rows-8 border-2 border-gray-400'>
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
                  ${isKnight ? 'bg-yellow-300' : isVisited ? 'bg-gray-200' : 'bg-white'}
                  ${isNext ? 'ring-2 ring-yellow-400' : ''}
                  ${(x + y) % 2 === 0 ? '' : 'bg-gray-50'}
                  ${canSelectStart ? 'hover:bg-yellow-100 cursor-pointer' : ''}
                  transition-colors`}
                onClick={() => handleCellClick(x, y)}
                disabled={started ? isKnight || isVisited || gameOver || !isNext : false}
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
          <button onClick={handleReset} className='px-4 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm font-medium'>
            리셋
          </button>
        </div>
        {!started && <div className='mt-4 text-blue-600 font-semibold'>시작할 위치를 선택하세요!</div>}
        {gameOver && started && (
          <div className='mt-4 text-green-600 font-bold'>축하합니다! 모든 칸을 방문했습니다 🎉</div>
        )}
      </div>
    </div>
  );
}
