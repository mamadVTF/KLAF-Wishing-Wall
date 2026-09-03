import { QRCodeSVG } from 'qrcode.react'
import styles from './QrCode.module.css'

interface QrCodeProps {
  qrUrl: string
}

export function QrCode({ qrUrl }: QrCodeProps) {
  return (
    <div className={styles.block}>
      <p className={styles.tagline}>
        Anda teringin perisa apa?
        <br />
        Imbas QR &amp; beritahu kami!
      </p>
      <svg className={styles.arrow} viewBox="0 0 140 80" aria-hidden="true">
        <path
          d="M 8 8 C 30 80, 80 30, 120 62"
          fill="none"
          stroke="var(--color-maggi-red)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M 120 62 L 104 58 L 111 48 Z" fill="var(--color-maggi-red)" />
      </svg>
      <div
        className={styles.card}
        aria-label={`Scan to open the wish submission form: ${qrUrl}`}
      >
        <QRCodeSVG value={qrUrl} size={150} />
      </div>
    </div>
  )
}