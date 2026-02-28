import { useTranslation } from "react-i18next";
import styles from "./SearchFilter.module.css"

import { useState } from "react"
import { SubjectsList } from "../../config";
import { useSearchParams } from "react-router-dom";

export default function SearchFilter({ onApply }) {
    const { t } = useTranslation();

    const [searchParams] = useSearchParams();

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [filter, setFilter] = useState({
        subjects: searchParams.getAll("subjects") || [],
        priceMin: searchParams.get("priceMin") || "",
        bidsMax: searchParams.get("bidsMax") || ""
    })

    const handleFilterApply = () => {
        setIsFilterOpen(false);
        onApply(filter);
    }

    const handleHideFilter = () => {
        setFilter({
            subjects: [],
            priceMin: "",
            bidsMax: ""
        });

        setIsFilterOpen(false);

        onApply({
            subjects: [],
            priceMin: "",
            bidsMax: ""
        });
    }

    const toggleSubject = (code) => {
        const isSelected = filter.subjects.includes(code);

        setFilter(prev => ({
            ...prev,
            subjects: isSelected ? 
            prev.subjects.filter(item => item !== code) :
            [...prev.subjects, code]
        }))
    }

    return (
        <div className={styles.FilterContainer}>
            {!isFilterOpen ? (
                <button className={styles.OpenBtn} onClick={() => setIsFilterOpen(true)}>
                    ⚙️ {t('search_filter.filter_text')} {filter.subjects.length > 0 && `(${filter.subjects.length})`}
                </button>
            ) : (
                <div className={styles.FilterModal}>
                    <div className={styles.FilterHeader}>
                        <h3>{t('search_filter.setting')} 🔍</h3>
                        <button onClick={() => setIsFilterOpen(false)}>✖️</button>
                    </div>

                    <div className={styles.FilterContent}>
                        <div className={styles.Section}>
                            <h4>📚 {t('search_filter.subjects')}</h4>
                            <div className={styles.Grid}>
                                {SubjectsList.map(subject => (
                                    <button
                                        key={subject.id}
                                        className={filter.subjects.includes(subject.value) ? styles.ActiveTag : styles.Tag}
                                        onClick={() => toggleSubject(subject.value)} 
                                    >
                                        {t(`subject.${subject.value}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.Section}>
                            <h4>💰 {t('search_filter.order_info')}</h4>
                            <div className={styles.InputGroup}>
                                <input
                                    type="number"
                                    placeholder={`💶 ${t('search_filter.min_price')}`} 
                                    value={filter.priceMin}
                                    onChange={(e) => setFilter(prev => ({ ...prev, priceMin: e.target.value }))}
                                />
                                <input
                                    type="number"
                                    placeholder={`📈 ${t('search_filter.max_bids')}`}
                                    value={filter.bidsMax}
                                    onChange={(e) => setFilter(prev => ({ ...prev, bidsMax: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.ChoiceBtn}>
                        <button className={styles.ApplyBtn} onClick={handleFilterApply}>🚀 {t('search_filter.apply')}</button>
                        <button className={styles.ResetBtn} onClick={handleHideFilter}>🧹 {t('search_filter.reset')}</button>
                    </div>
                </div>
            )}
        </div>
    )
}