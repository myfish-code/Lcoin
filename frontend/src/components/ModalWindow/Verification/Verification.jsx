import styles from "./Verification.module.css"

import isicExample from "../../../assets/images/isic_example.jpg"
import ReactDOM from 'react-dom';

import { useTranslation } from "react-i18next"
import { useState } from "react";


export default function Verification({ onSubmit }) {
    const { t } = useTranslation();

    const [isLoadingSend, setIsLoadingSend] = useState(false);

    const [showModal, setShowModal] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState(null);

    const handleCloseModal = () => {
        setShowModal(false);
        setError(null);
        setIsLoadingSend(false);
    }
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError(t('error_message.to_large_file_5mb'));
            return;
        }

        if (file) {
            setError(null);
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    }

    const handleVerify = async () => {
        if (!selectedFile) {
            setError(t('error_message.no_photo_upload'));
            return;
        }
        setIsLoadingSend(true);
        await onSubmit(selectedFile);

        setSelectedFile(null);
        setPreviewUrl(null);
        setShowModal(false);
        setIsLoadingSend(false);

    }

    return (
        <>
            <button className={styles.verifyBtn} onClick={() => setShowModal(true)}>
                {t('verify.button')}
            </button>
            {showModal && ReactDOM.createPortal(
                <div className={styles.overlay} onClick={() => handleCloseModal()}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.header}>
                            <h3>{t('verify.title')}</h3>
                            <span onClick={() => handleCloseModal()}>❌</span>
                        </div>

                        <div className={styles.verifyInfo}>
                            <p className={styles.securityNote}>{t('verify.security_note')}</p>

                            <div className={styles.benefitsBlock}>
                                <p className={styles.benefitsTitle}>{t('verify.benefits_title')}</p>
                                <ul>
                                    <li>✅ {t('verify.benefit_1')}</li>
                                    <li>✅ {t('verify.benefit_2')}</li>
                                    <li>✅ {t('verify.benefit_3')}</li>
                                </ul>
                            </div>
                        </div>

                        <div className={styles.uploadSection}>
                            <h4>{t('verify.step_1_title')}</h4>
                            <p>{t('verify.step_1_desc')}</p>

                            <div className={styles.visualGroup}>
                                <div className={styles.exampleBlock}>
                                    <img src={isicExample} alt="Example ISIC" className={styles.examplePhoto} />
                                </div>
                                <label className={styles.fileLabel}>
                                    <input type="file" onChange={handleFileChange} accept="image/*" hidden />
                                    <div className={styles.uploadPlaceholder}>
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className={styles.previewImg} />
                                        ) : (
                                            <span>📸 {t('verify.button')}</span>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button
                            className={`${styles.submitBtn} ${isLoadingSend && styles.disabledBtn}`}
                            onClick={handleVerify}>
                            {isLoadingSend ? (
                                <div className="g-loading-info">
                                    <p>{t('load.send')}</p>
                                    <span className="dots">
                                        <span>.</span><span>.</span><span>.</span>
                                    </span>
                                </div>
                            ) : t('verify.button')}
                        </button>
                        {error && (
                            <div className={styles.ErrorMessage}>{error}</div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}