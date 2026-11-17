import styles from './CenterTitle.module.css'

export function CenterTitle() {
  return (
    <div className={styles.lockup}>
      <img
        className={styles.rotatingMark}
        src="/images/title-mark.png"
        alt=""
        aria-hidden="true"
      />
      <img
        className={styles.title}
        src="/images/wall-title.png"
        alt="Enter your wish for the future of KL?"
      />
    </div>
  )
}
