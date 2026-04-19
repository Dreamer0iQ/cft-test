'use client';

import { useEffect, useRef } from 'react';
import styles from './PixelWave.module.scss';

export function PixelWave() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    const start = performance.now();

    // направление бегущей волны (нормализованное)
    const dirX = Math.SQRT1_2;
    const dirY = Math.SQRT1_2;

    const frame = (now: number) => {
      const t = (now - start) / 1000;

      // фон — тёмный радиальный градиент, запекаем каждый кадр
      const bg = ctx.createRadialGradient(w * 0.35, h * 0.45, 0, w * 0.35, h * 0.45, Math.max(w, h));
      bg.addColorStop(0, 'rgba(12, 32, 44, 0.95)');
      bg.addColorStop(0.55, 'rgba(7, 17, 26, 0.95)');
      bg.addColorStop(1, 'rgba(4, 10, 16, 1)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // шаг крупнее — квадраты выглядят весомее
      const targetStep = 42;
      const cols = Math.ceil(w / targetStep) + 2;
      const rows = Math.ceil(h / targetStep) + 2;
      const stepX = w / (cols - 2);
      const stepY = h / (rows - 2);

      for (let r = -1; r < rows - 1; r++) {
        for (let c = -1; c < cols - 1; c++) {
          const baseX = c * stepX + stepX * 0.5;
          const baseY = r * stepY + stepY * 0.5;

          // фаза по проекции позиции на направление — волна строго по диагонали
          const proj = baseX * dirX + baseY * dirY;
          const phase = proj * 0.010 - t * 1.9;
          const z =
            Math.sin(phase) * 26 +
            Math.sin(phase * 1.6 + 0.6) * 10;

          // вертикальное смещение на гребнях даёт псевдо-3D без лишних трансформаций
          const sx = baseX;
          const sy = baseY - z * 0.6;

          const heightNorm = Math.max(0, Math.min(1, (z + 36) / 72));
          const size = 5 + heightNorm * 9;

          // grayscale: тёмно-серый в низинах, светло-серый на пиках
          const grey = Math.round(60 + heightNorm * 150);
          const alpha = 0.18 + heightNorm * 0.62;

          ctx.fillStyle = `rgba(${grey},${grey},${grey},${alpha})`;
          ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={styles.canvas} aria-hidden />;
}
