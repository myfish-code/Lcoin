import styles from "./RadioChoice.module.css"

export default function RadioChoice({choices, currentStatus, onTabChange}) {
    return (
        <div className={styles.TabGroup}>
            {choices.map((choice) => (
                <span key={choice.id} className={styles.TabItem}>
                    <input 
                        type="radio"
                        name="status" 
                        id={`${choice.status}`}
                        className={styles.RadioInput} 
                        checked={currentStatus === choice.status}
                        onChange={() => onTabChange(choice.status)}/>

                    <label htmlFor={`${choice.status}`} className={styles.TabLabel}>{choice.text}</label>
                </span>
            ))}
        </div>
    )
}