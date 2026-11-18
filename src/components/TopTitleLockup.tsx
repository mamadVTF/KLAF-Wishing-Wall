import styles from './TopTitleLockup.module.css'

export function TopTitleLockup() {
  return (
    <div className={styles.lockup} aria-label="KLAF 2026 Finale">
      <img
        className={styles.title}
        src="/images/klaf-title.png"
        alt="KLAF 2026 Finale"
      />
      <img
        className={styles.subtitle}
        src="/images/klaf-subtitle.png"
        alt="Bangunan Sultan Abdul Samad"
      />
    </div>
  )
}
