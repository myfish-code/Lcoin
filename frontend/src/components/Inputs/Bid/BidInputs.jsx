import { useTranslation } from "react-i18next";
import styles from "./BidInputs.module.css"

import { useState } from "react";

export default function BidInputs({ onSubmitForm }) {
    const { t } = useTranslation();

    const [isLoadingCreate, setIsLoadingCreate] = useState(false);

    const [description, setDescription] = useState("");
    const [price, setPrice] = useState(1);
    const [daysToComplete, setDaysToComplete] = useState(1);

    const [error, setError] = useState(null);

    const handleChangeDescription = (e) => {
        const value = e.target.value;
        if (value.length <= 250) {
            setDescription(e.target.value);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const numericPrice = Number(price);
        const numericDaysToComplete = Number(daysToComplete);

        if (!description || !price || !daysToComplete) {
            setError(t('error_message.fields_empty'));
            return;
        }
        if (numericPrice <= 0 || !Number.isInteger(numericPrice)) {
            setError(t('error_message.price_abs'));
            return;
        }

        if (numericDaysToComplete <= 0 || !Number.isInteger(numericDaysToComplete)) {
            setError(t('error_message.term_abs'));
            return;
        }

        setIsLoadingCreate(true);
        
        const success = await onSubmitForm({ description, price, daysToComplete });

        if (success) {
            setDescription("");
            setPrice(1);
            setDaysToComplete(1);
        }
        setIsLoadingCreate(false);
    }

    return (
        <div className={styles.BidCreate}>
            <h3>{t('bids.new')}</h3>
            <form className={styles.FormBid} onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                    <label>{t('bids.description')}: </label>
                    <textarea
                        type="text"
                        name="description"
                        value={description}
                        maxLength={250}
                        onChange={(e) => handleChangeDescription(e)}

                    />
                    <span>{description.length}/250</span>
                </div>

                <div className={styles.row}>
                    <div className={styles.inputGroup}>
                        <label>{t('bids.price')}(EUR)</label>
                        <input
                            type="number"
                            name="price"
                            value={price}
                            onChange={(e) => { setPrice(e.target.value) }}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>{t('bids.term_complete')}</label>
                        <input
                            type="number"
                            name="days_to_complete"
                            value={daysToComplete}
                            onChange={(e) => { setDaysToComplete(e.target.value) }}
                        />
                    </div>
                </div>

                <button className={
                    `${styles.submitBtn} ${isLoadingCreate && styles.disabledBtn}`
                } type="Submit">{isLoadingCreate ? (
                    <div className="g-loading-info">
                        <p>{t('load.create')}</p>
                        <span className="dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </div>
                ) : t('bids.public')}</button>

                {error && (
                    <div className={styles.ErrorMessage}>{error}</div>
                )}
            </form>
        </div>
    )
}