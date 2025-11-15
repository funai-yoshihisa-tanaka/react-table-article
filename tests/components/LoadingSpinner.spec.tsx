import { render, screen, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom'; // toHaveAttribute / toHaveStyle のため
import LoadingSpinner from '@/components/LoadingSpinner';

// --- 1. タイマーのモック設定 ---
// useEffect内の requestAnimationFrame を制御下に置く
beforeEach(() => {
  // vitest の fake timer を使う
  vi.useFakeTimers();
});

afterEach(() => {
  // 実行したスパイやモックをリセット
  vi.restoreAllMocks();
  // リアルなタイマーに戻す
  vi.useRealTimers();
});


// --- 2. テストスイート ---

describe('LoadingSpinner Component', () => {

  test('1. デフォルトのpropsで正しくレンダリングされるか', () => {
    render(<LoadingSpinner />);

    // アクセシビリティ属性（ARIA）の確認
    const svg = screen.getByRole('status');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-label', '読み込み中');

    // デフォルトサイズ (size=80)
    expect(svg).toHaveAttribute('width', '80');
    expect(svg).toHaveAttribute('height', '80');
    expect(svg).toHaveAttribute('viewBox', '0 0 80 80');

    // path要素の確認
    const path = svg.querySelector('path');
    expect(path).toBeInTheDocument();
    // デフォルトのストローク幅 (size / 10 = 8)
    expect(path).toHaveAttribute('stroke-width', '8');
    // 初期のストローク色 (brightness=256, color=00FF00)
    expect(path).toHaveAttribute('stroke', '#00ff00');
  });

  test('2. `size` propが正しく適用されるか', () => {
    render(<LoadingSpinner size={100} />);

    const svg = screen.getByRole('status');

    // カスタムサイズ (size=100)
    expect(svg).toHaveAttribute('width', '100');
    expect(svg).toHaveAttribute('height', '100');
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100');

    // カスタムサイズに基づくストローク幅 (100 / 10 = 10)
    const path = svg.querySelector('path');
    expect(path).toHaveAttribute('stroke-width', '10');
  });

  test('3. `size` propが最小値(20)未満の場合、20に補正されるか', () => {
    render(<LoadingSpinner size={10} />); // 最小値20より小さい

    const svg = screen.getByRole('status');

    // 最小サイズ (20) に補正されている
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
    expect(svg).toHaveAttribute('viewBox', '0 0 20 20');

    // 最小サイズに基づくストローク幅 (20 / 10 = 2)
    const path = svg.querySelector('path');
    expect(path).toHaveAttribute('stroke-width', '2');
  });

  test('4. コンポーネントのアンマウント時に cancelAnimationFrame が呼ばれるか', () => {
    // グローバルな cancelAnimationFrame をスパイ（監視）
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const { unmount } = render(<LoadingSpinner />);

    // アニメーションループを1回実行させ、animationFrameId.current にIDがセットされるようにする
    act(() => {
      vi.advanceTimersToNextFrame();
    });

    // コンポーネントをアンマウント
    unmount();

    // クリーンアップ関数（return ...）が実行され、
    // スパイした cancelAnimationFrame が1回呼ばれたことを確認
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  test('5. アニメーションが実行され、pathの属性(d, stroke)が変化するか', async () => {
    render(<LoadingSpinner />);
    const path = screen.getByRole('status').querySelector('path');

    // 初期値を取得
    const initialPathD = path?.getAttribute('d');
    const initialStroke = path?.getAttribute('stroke');

    // `act` で囲み、Reactのステート更新を処理
    await act(async() => {
      // フレームを100回進める (requestAnimationFrame を100回実行)
      for (let i = 0; i < 5000; i++) {
        vi.advanceTimersToNextFrame();
      }
    });

    // 属性が初期値から変化していることを確認
    const newPathD = path?.getAttribute('d');
    const newStroke = path?.getAttribute('stroke');

    // d属性 (arcPath) は rotation が変わるので変化するはず
    expect(newPathD).not.toBe(initialPathD);
    // stroke属性 (finalColor) は brightness が変わるので変化するはず
    expect(newStroke).not.toBe(initialStroke);
  });
});