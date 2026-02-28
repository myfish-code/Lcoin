import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom";

import MyOrdersForm from "../../../components/OrderForm/MyOrdersForm/MyOrdersForm";
import Pagination from "../../../components/Ui/Pagination/Pagination";
import { MyOrdersPagination } from "../../../config";

import { deleteMyOrder, getMyOrders, postMyOrder } from "../../../api/orders";
import Loading from "../../../components/Ui/Loading/Loading";
import { useErrorHandler } from "../../../hooks/useErrorHandler";
import NotFoundPage from "../../../components/Ui/NotFoundPage/NotFoundPage";

export default function MyOrders() {
    const [errorData, setErrorData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const handleError = useErrorHandler();

    const [orders, setOrders] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();

    const navigate = useNavigate();

    const currentStatus = searchParams.get("status") || "open";

    const currentPage = searchParams.get("page") || "1";
    const [maxPage, setMaxPage] = useState("1");
    const SIZE = MyOrdersPagination.SIZE;

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

    const handleCreate = async ({ name, description, price, deadline_time, subject, fileUpload }) => {
        
        const rawStatus = searchParams.get("status");
        const rawPage = searchParams.get("page");

        const validatedPage = Math.max(1, Number(rawPage) || 1);

        const listStatus = ["open", "pending", "in_progress", "completed"];
        const validatedStatus = listStatus.includes(rawStatus) ? rawStatus : "open"

        const needsUpdate = String(validatedPage) !== rawPage || !listStatus.includes(rawStatus)

        if (needsUpdate) {
            setSearchParams({
                ...Object.fromEntries(searchParams),
                page: validatedPage,
                status: validatedStatus
            })
        }



        try {
            const data = await postMyOrder(name, description, price, deadline_time, subject, fileUpload, validatedStatus, validatedPage, SIZE);

            if (currentStatus !== "open") {
                setSearchParams({
                    ...Object.fromEntries(searchParams),
                    status: "open", page: "1"
                })
            } else {
                setOrders(data.myOrders);
                setMaxPage(data.maxPage);
            }


            setErrorData(null);
            return true;
        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }

    }

    const handleDelete = async (id) => {
        if (!id) {
            return;
        }

        try {
            const data = await deleteMyOrder(id);
            if (data.success) {
                setOrders(prev => prev.filter((b) => b.id !== id));
                setErrorData(null);
            }
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

        const listStatus = ["open", "pending", "in_progress", "completed"];
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

        getMyOrders(validatedStatus, validatedPage, SIZE).then((data) => {

            setOrders(data.myOrders);
            setMaxPage(data.maxPage);
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
            <MyOrdersForm
                onSubmitPost={handleCreate}
                onSubmitDelete={handleDelete}
                orders={orders}
                currentStatus={currentStatus}
                onTabChange={handleTabChange}
                isLoading={isLoading}
                error={errorData} />

            <Pagination
                currentPage={currentPage}
                maxPage={maxPage}
                onPageChange={handlePageChange} />
        </div>
    )
}