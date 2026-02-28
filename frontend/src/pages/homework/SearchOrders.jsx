import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getOrders } from "../../api/orders";

import OrderCard from "../../components/Cards/OrderCard/OrderCard";

import SearchFilter from "../../components/SearchFilter/SearchFilter";

import Pagination from "../../components/Ui/Pagination/Pagination";
import { SearchPagination } from "../../config";

import Loading from "../../components/Ui/Loading/Loading";
import NotFoundPage from "../../components/Ui/NotFoundPage/NotFoundPage";
import { useErrorHandler } from "../../hooks/useErrorHandler";

export default function SearchOrders() {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [errorData, setErrorData] = useState(null);

    const handleError = useErrorHandler();
    const navigate = useNavigate();

    const [orders, setOrders] = useState(null);
    const [maxPage, setMaxPage] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();

    const currentPage = searchParams.get("page") || "1"
    const SIZE = SearchPagination.SIZE;

    const handlePageChange = (changePage) => {

        const newParams = new URLSearchParams(searchParams);

        newParams.set('page', changePage);

        setSearchParams(newParams);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    const handleApplyFilter = (filter) => {
        const newParams = new URLSearchParams(searchParams);

        if (filter.priceMin) {
            newParams.set('priceMin', filter.priceMin)
        } else {
            newParams.delete('priceMin');
        }
        if (filter.bidsMax) {
            newParams.set('bidsMax', filter.bidsMax)
        } else {
            newParams.delete('bidsMax')
        }

        newParams.delete('subjects');
        filter.subjects.forEach(subject => {
            newParams.append('subjects', subject);
        });

        newParams.set('page', "1")
        setSearchParams(newParams);
    }

    useEffect(() => {

        const rawPage = searchParams.get("page");
        const rawBidsMax = searchParams.get("bidsMax");
        const rawPriceMin = searchParams.get("priceMin");
        const rawSubjects = searchParams.getAll("subjects");

        const validatedPage = Math.max(1, Number(rawPage) || 1);
        const validatedBidsMax = rawBidsMax ? Math.max(0, Number(rawBidsMax)) : null;
        const validatedPriceMin = rawPriceMin ? Math.max(0, Number(rawPriceMin)) : null;

        const isPageWrong = String(validatedPage) !== (rawPage);
        const isBidsWrong = rawBidsMax !== null && String(validatedBidsMax) !== rawBidsMax;
        const isPriceWrong = rawPriceMin !== null && String(validatedPriceMin) !== rawPriceMin;

        if (isPageWrong || isBidsWrong || isPriceWrong) {

            const params = new URLSearchParams(searchParams);

            params.set('page', validatedPage);

            if (validatedBidsMax !== null) {
                params.set("bidsMax", validatedBidsMax);
            } else {
                params.delete("bidsMax");
            }

            if (validatedPriceMin !== null) {
                params.set("priceMin", validatedPriceMin);
            } else {
                params.delete("priceMin");
            }

            setSearchParams(params, { replace: true });
            return;

        }
        setIsLoading(true);

        getOrders(validatedPage, SIZE, validatedBidsMax, validatedPriceMin, rawSubjects).then((data) => {
            setOrders(data.orders)
            setMaxPage(data.maxPage);
            setErrorData(null);
        }).catch((error) => {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        }).finally(() => {
            setIsLoading(false);
        });
    }, [navigate, searchParams])

    if (isLoading && !orders) {
        return <Loading />
    }

    if (errorData?.type === "NOT_FOUND" || (!orders)) {
        return <NotFoundPage />
    }

    return (
        <div>
            {errorData && (
                <ErrorWindow error={error} />
            )}
            <SearchFilter onApply={handleApplyFilter} />

            {isLoading ? (
                <div className="g-loading-view">
                    <span className="g-loading-icon">📚</span>
                    <div className="g-loading-info">
                        <p>{t('load.orders')}</p>
                        <span className="dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </div>

                    <h4>{t('load.text_wait')}</h4>
                </div>
            ) : orders.length === 0 ? (
                <div className="g-empty-view">
                    <span className="g-empty-icon">📚</span>
                    <p>{t('search_orders.empty_orders')}</p>
                    <h4><Link to="/myOrders">{t('search_orders.push_project')}</Link> {t('search_orders.help_text')}</h4>
                </div>
            ) : (
                orders.map(order => (
                    <div key={order.id}>
                        <OrderCard order={order} isProfileView={false} />
                    </div>

                )))}

            <Pagination
                currentPage={currentPage}
                maxPage={maxPage}
                onPageChange={handlePageChange} />
        </div>
    )

}