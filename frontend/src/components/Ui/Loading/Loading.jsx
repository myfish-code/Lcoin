import styles from "./Loading.module.css"
import ReactDOM from 'react-dom';

export default function Loading() {
    return (
        <div className={styles.overlay}>
            <div className={styles.spinner}>
                <div className={styles.loader}></div>
            </div>
        </div>
    )

}