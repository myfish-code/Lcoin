import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMyDisputes } from "../../../api/orders";

import MyDisputesForm from "../../../components/DisputesForm/MyDisputesForm/MyDisputesForm";
import { MyDisputesPagination } from "../../../config";
import Pagination from "../../../components/Ui/Pagination/Pagination";
import Loading from "../../../components/Ui/Loading/Loading";
import NotFoundPage from "../../../components/Ui/NotFoundPage/NotFoundPage";
import { useErrorHandler } from "../../../hooks/useErrorHandler";

export default function MyDisputes() {
    
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const handleError = useErrorHandler();

    const [errorData, setErrorData] = useState(null);
    const [disputes, setDisputes] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();

    const currentStatus = searchParams.get("status") || "open"

    const currentPage = searchParams.get("page") || "1";

    const [maxPage, setMaxPage] = useState("1");
    const SIZE = MyDisputesPagination.SIZE;

    const handleTabChange = (status) => {
        setSearchParams({
            ...Object.fromEntries(searchParams),
            page: "1",
            status: status
        });
    }

    const handlePageChange = (changePage) => {
        setSearchParams({
            ...Object.fromEntries(searchParams),
            page: changePage
        })
    }

    useEffect(() => {

        const rawStatus = searchParams.get("status");
        const rawPage = searchParams.get("page");

        const validatedPage = Math.max(1, Number(rawPage) || 1);

        const listStatus = ["open", "on_review", "resolved", "closed"];
        const validatedStatus = listStatus.includes(rawStatus) ? rawStatus : "open"

        const needsUpdate = String(validatedPage) !== rawPage || !listStatus.includes(rawStatus)

        if (needsUpdate) {
            setSearchParams({
                ...Object.fromEntries(searchParams),
                page: validatedPage,
                status: validatedStatus
            })
            return;
        }

        setIsLoading(true);

        getMyDisputes(validatedStatus, validatedPage, SIZE).then((data) => {
            setDisputes(data.disputes);
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

    if (isLoading && !disputes) {
        return <Loading />
    }
    if (errorData?.type === "NOT_FOUND" || (!disputes)) {
        return <NotFoundPage />
    }

    return (
        <div>
            <MyDisputesForm
                currentStatus={currentStatus}
                onTabChange={handleTabChange}
                disputes={disputes}
                isLoading={isLoading}
                error={errorData} />
            
            <Pagination 
                currentPage={currentPage}
                maxPage={maxPage}
                onPageChange={handlePageChange}/>
        </div>

    )
}