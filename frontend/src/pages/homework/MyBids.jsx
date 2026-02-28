import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import MyBidsForm from "../../components/BidForm/MyBidsForm/MyBidsForm";
import Pagination from "../../components/Ui/Pagination/Pagination";
import { MyBidsPagination } from "../../config";

import { getMyBids } from "../../api/orders";
import { deleteMyBid } from "../../api/orders";
import Loading from "../../components/Ui/Loading/Loading";
import NotFoundPage from "../../components/Ui/NotFoundPage/NotFoundPage";
import { useErrorHandler } from "../../hooks/useErrorHandler";


export default function MyBids() {
    const [bids, setBids] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const handleError = useErrorHandler();

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [errorData, setErrorData] = useState(null);

    const currentStatus = searchParams.get("status") || "pending"

    const currentPage = searchParams.get("page") || "1";
    const [maxPage, setMaxPage] = useState("1");
    const SIZE = MyBidsPagination.SIZE;

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
        });
    }


    const handleDeleteBid = async (id) => {
        if (!id) {
            return;
        }
        try {
            await deleteMyBid(id);
            setBids(prev => prev.filter((b) => b.id !== id));
            setErrorData(null);
        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }

    }

    useEffect(() => {
        

        const rawStatus = searchParams.get("status");
        const rawPage = searchParams.get("page");

        const validatedPage = Math.max(1, Number(rawPage) || 1);

        const listStatus =  ["pending", "offer", "accepted", "completed"];
        const validatedStatus = listStatus.includes(rawStatus) ? rawStatus : "pending"

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

        getMyBids(validatedStatus, validatedPage, SIZE).then((data) => {
            setBids(data.bids);
            setMaxPage(data.maxPage);
            setErrorData(null);
        }).catch((error) => {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        }).finally(() => {
            setIsLoading(false);
        })


    }, [navigate, searchParams])

    if (isLoading && !bids) {
        return <Loading />
    }

    if (errorData?.type === "NOT_FOUND" || (!bids)) {
        return <NotFoundPage />
    }

    return (
        <div>
            <MyBidsForm
                bids={bids}
                onSubmit={handleDeleteBid}
                currentStatus={currentStatus}
                onTabChange={handleTabChange}
                isLoading={isLoading}
                error={errorData} />
            
            <Pagination 
                currentPage={currentPage}
                maxPage={maxPage}
                onPageChange={handlePageChange}/>
        </div>
    )

}