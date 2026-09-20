import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Крипто курсы — обучение торговле криптовалютой';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#0B0B0D',
          backgroundImage:
            'radial-gradient(60% 60% at 50% 30%, rgba(201,162,75,0.22), transparent 70%)',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, color: '#A8A29B', letterSpacing: 4 }}>
          КРИПТО КУРСЫ
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 24,
            fontSize: 64,
            fontWeight: 600,
            color: '#F2EFE9',
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Базовый · Средний · Продвинутый
        </div>
        <div style={{ display: 'flex', marginTop: 32, fontSize: 30, color: '#C9A24B' }}>
          Покупка через Telegram-бота
        </div>
      </div>
    ),
    { ...size },
  );
}
