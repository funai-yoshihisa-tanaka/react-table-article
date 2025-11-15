import React, { useState, useEffect, useRef, useMemo, useCallback, type SetStateAction } from 'react';

const DEFAULT_COLOR = {
  red: 0,
  green: 255,
  blue: 0,
}

// --- Propsの型定義 ---
type LoadingSpinnerProps = {
  /** スピナー全体の大きさ (px) */
  size?: number;
};


// --- ヘルパー関数 (変更なし) ---
function sin(degree: number): number {
  return Math.sin(degree * Math.PI / 180);
}

function cos(degree: number): number {
  return Math.cos(degree * Math.PI / 180);
}

function polarToCartesian(size: number, angleInDegree: number): { x: number; y: number } {
  const radius = size * 0.45;
  const center = size / 2;
  return {
    x: center + (radius * sin(angleInDegree)),
    y: center - (radius * cos(angleInDegree))
  };
}

function describeArc(size: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(size, startAngle);
  const end = polarToCartesian(size, endAngle);
  const radius = size * 0.45;
  return ["M", start.x, start.y, "A", radius, radius, 0, 0, 0, end.x, end.y].join(" ");
}

function getHex(baseColor: number, brightness: number) {
  const diff = baseColor - 64;
  return Math.round(64 + diff * brightness / 256).toString(16).padStart(2, '0');
}

// --- ローディングスピナー コンポーネント ---

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 80,
}) => {
  const [mySize, strokeWidth, viewBox] = useMemo(() =>{
    const mySize = Math.max(20, size);
    return [mySize, Math.round(mySize / 10), `0 0 ${mySize} ${mySize}`];
  }, [size]);
  // --- Stateの定義 ---
  const [rotation, setRotation] = useState<number>(0);
  // 現在の輝度をStateで管理
  const [brightness, setBrightness] = useState<number>(256); // 0-256で管理
  const animationFrameId = useRef<number>(0);

  // --- アニメーションループ ---
  useEffect(() => {
    let currentSpeed = 3;
    setBrightness(256);
    setRotation(0);

    const animate = () => {      
      currentSpeed = Math.max(0.1, currentSpeed * 0.99);

      // 1. 角度を更新
      setRotation(prev => {
        const result = prev + currentSpeed * 6;
        // 角度が大きくなりすぎないように調整するロジック
        return result > 1440 ? result - 1080 : result;
      });
      
      // 2. 輝度を減らす (16を下限とする)
      setBrightness(prev => Math.max(16, prev - 1));
      
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId.current!);
    };
  }, [setRotation, setBrightness]);

  // --- 派生データの計算 ---
  const arcPath = useMemo(() => {
    const length = (1 + cos(rotation)) * 30
    const startAngle = rotation + length;
    const endAngle = Math.max(0, rotation - length);
    return describeArc(mySize, startAngle, endAngle);
  }, [mySize, rotation]);

  // 輝度を考慮した色をHEX形式(#RRGGBB)に変換
  const finalColor = useMemo(() => {
    const { red, green, blue } = DEFAULT_COLOR;
    const redHex = getHex(red, brightness);
    const greenHex = getHex(green, brightness);
    const blueHex = getHex(blue, brightness);
    return `#${redHex}${greenHex}${blueHex}`;
  }, [brightness]);

  return (
    <svg width={mySize} height={mySize} viewBox={viewBox} role="status" aria-label="読み込み中">
      <path
        d={arcPath}
        fill="none"
        stroke={finalColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};

export default LoadingSpinner;