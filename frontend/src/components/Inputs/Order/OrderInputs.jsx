import { useTranslation } from "react-i18next";
import styles from "./OrderInputs.module.css"
import { useState } from "react";
import { SubjectsList } from "../../../config";

export default function OrderInputs({ onSubmitForm }) {
    const { t } = useTranslation();

    const [isLoadingCreate, setIsLoadingCreate] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    const [price, setPrice] = useState(1);
    const [deadline_time, setDeadline_Time] = useState(1);
    const [subject, setSubject] = useState("");

    const [error, setError] = useState(null);

    const handleChangeName = (e) => {
        const value = e.target.value;
        if (value.length <= 60) {
            setName(e.target.value);
        }
    }

    const handleChangeDescription = (e) => {
        const value = e.target.value;
        if (value.length <= 800) {
            setDescription(e.target.value);
        }
    }

    const handleChangeFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError(t('error_message.to_large_file_10mb'))
            e.target.value = "";
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);

    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const numericPrice = Number(price);
        const numericDeadline = Number(deadline_time);

        if (!name || !description || !price || !deadline_time || !subject) {
            setError(t('error_message.fields_empty'));
            return;
        }
        if (numericPrice <= 0 || !Number.isInteger(numericPrice)) {
            setError(t('error_message.price_abs'));
            return;
        }

        if (numericDeadline <= 0 || !Number.isInteger(numericDeadline)) {
            setError(t('error_message.term_abs'));
            return;
        }

        setIsLoadingCreate(true);
        
        const success = await onSubmitForm({ name, description, price, deadline_time, subject, fileUpload: selectedFile });

        if (success) {
            setName("");
            setDescription("");
            setPrice(1);
            setDeadline_Time(1);
            setSubject("");
        }
        setIsLoadingCreate(false);
    }

    return (
        <div className={styles.OrderCreate}>
            <h3>{t('orders.new')}</h3>
            <form className={styles.FormOrder} onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                    <label>{t('orders.name')}: </label>
                    <input
                        type="text"
                        name="name"
                        value={name}
                        maxLength={60}
                        onChange={(e) => handleChangeName(e)} />
                    <span>{name.length}/60</span>
                </div>

                <div className={styles.inputGroup}>
                    <label>{t('orders.subject')}</label>
                    <select
                        className={styles.subjectsSelect}
                        name="subject"
                        required
                        value={subject}
                        onChange={(e) => { setSubject(e.target.value) }}
                    >
                        <option value="" disabled hidden>-- {t('orders.select_subject')} --</option>
                        {SubjectsList.map((subject) => (
                            <option
                                key={subject.id}
                                value={subject.value}>
                                {t(`subject.${subject.value}`)}
                            </option>
                        ))}
                    </select>

                </div>

                <div className={styles.inputGroup}>
                    <label>{t('orders.description')}: </label>

                    <textarea
                        name="description"
                        value={description}
                        maxLength={800}
                        onChange={(e) => handleChangeDescription(e)} />

                    <span>{description.length}/800</span>
                </div>

                <div className={styles.inputGroup}>
                    <div className={styles.labelGroup}>
                        <label className={styles.bigLabel}>{t('orders.file_upload')}: </label>
                        <label className={styles.smallLabel}>{t('orders.file_size_limit')}</label>
                    </div>
                    <input type="file" onChange={(e) => handleChangeFile(e)} />
                </div>

                <div className={styles.row}>
                    <div className={styles.inputGroup}>
                        <label>{t('orders.price')}(EUR): </label>
                        <input
                            type="number"
                            name="price"
                            value={price}
                            onChange={(e) => { setPrice(e.target.value) }} />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>{t('orders.term_complete')}: </label>
                        <input
                            type="number"
                            name="deadline_time"
                            value={deadline_time}
                            onChange={(e) => { setDeadline_Time(e.target.value) }} />
                    </div>
                </div>

                <button type="submit" className={
                    `${styles.submitBtn} ${isLoadingCreate && styles.disabledBtn}`
                }>{isLoadingCreate ? (
                    <div className="g-loading-info">
                        <p>{t('load.create')}</p>
                        <span className="dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </div>
                ) : t('orders.public')}</button>

                {error && (
                    <div className={styles.ErrorMessage}>{error}</div>
                )}
            </form>
        </div>
    )
}