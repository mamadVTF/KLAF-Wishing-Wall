import { QRCodeSVG } from 'qrcode.react'
import styles from './QrCode.module.css'

interface QrCodeProps {
  qrUrl: string
}

export function QrCode({ qrUrl }: QrCodeProps) {
  return (
    <div className={styles.block}>
      <div
        className={styles.card}
        role="img"
        aria-label={`Scan to open the wish submission form: ${qrUrl}`}
      >
        <QRCodeSVG
          className={styles.code}
          value={qrUrl}
          bgColor="transparent"
          fgColor="#111"
          level="M"
        />
        <span className={styles.instruction} aria-hidden="true">
          <span>SCAN TO SUBMIT</span>
          <span>YOUR WISHES</span>
        </span>
      </div>
    </div>
  )
}
