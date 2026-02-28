import styles from "./Pagination.module.css"

export default function Pagination({ currentPage, maxPage, onPageChange }) {
    const intCurrentPage = Number(currentPage);

    const startPage = Math.max(1, intCurrentPage - 2);
    const endPage = Math.min(intCurrentPage + 2, maxPage);

    const listPage = [];
    
    for (let i = startPage; i <= endPage; i++) {
        listPage.push(i);
    }

    return (
        <div className={styles.PaginationContainer}>
            <button
                disabled={intCurrentPage <= 1}
                onClick={() => onPageChange(intCurrentPage - 1)}
            >
                &laquo;
            </button>

            {listPage.map((item) => (
                
                <button 
                    key={item} 
                    className={item === intCurrentPage ? styles.active : ''}
                    onClick={() => onPageChange(item)}>
                        {item}
                    </button>
            ))}

            <button
                disabled={intCurrentPage >= maxPage}
                onClick={() => onPageChange(intCurrentPage + 1)}
            >
                &raquo;
            </button>
        </div>
    )
}