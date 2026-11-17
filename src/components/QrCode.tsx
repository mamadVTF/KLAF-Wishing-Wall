import { QRCodeSVG } from 'qrcode.react'
import styles from './QrCode.module.css'

interface QrCodeProps {
  qrUrl: string
}

export function QrCode({ qrUrl }: QrCodeProps) {
  return (
    <div className={styles.block}>
      <div
        className={styles.frame}
        aria-label={`Scan to open the wish submission form: ${qrUrl}`}
      >
        <img
          className={styles.frameImage}
          src="/images/qr-corner.png"
          alt=""
          aria-hidden="true"
        />
        <QRCodeSVG
          className={styles.code}
          value={qrUrl}
          bgColor="transparent"
          fgColor="#fff"
          level="M"
        />
      </div>
      <img
        className={styles.instruction}
        src="/images/scan-to-submit-wishes.png"
        alt="Scan to submit your wishes"
      />
    </div>
  )
}
