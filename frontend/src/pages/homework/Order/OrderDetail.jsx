import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { postMyBid } from "../../../api/orders";
import {
    deleteMyBid,
    deleteMyOrder,
    assignExecutor,
    unAssignExecutor,
    getOrderDetail,
} from "../../../api/orders";

import OrderDetailForm from "../../../components/OrderForm/OrderDetailForm/OrderDetailForm";
import Loading from "../../../components/Ui/Loading/Loading";

import NotFoundPage from "../../../components/Ui/NotFoundPage/NotFoundPage";
import { useErrorHandler } from "../../../hooks/useErrorHandler";

export default function OrderDetail() {
    const { id } = useParams();

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    const handleError = useErrorHandler();

    const [errorData, setErrorData] = useState(null);

    const [order, setOrder] = useState(null);
    const [bids, setBids] = useState(null);
    const [isAuthor, setIsAuthor] = useState(false);
    const [userBidId, setUserBidId] = useState(null);

    const handleDeleteBid = async (bidId) => {

        if (!bidId) {
            return;
        }

        try {
            const data = await deleteMyBid(bidId);
            setBids(data.bids);
            setUserBidId(null);
            setErrorData(null);
        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }
    }

    const handleDeleteOrder = async (orderId) => {
        if (!orderId) {
            return;
        }

        try {
            await deleteMyOrder(orderId);
            setErrorData(null);
            navigate("/search")
        } catch (error) {

            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }

    }

    const handleSubmit = async ({ description, price, daysToComplete }) => {
        if (!description || !price || !daysToComplete) {
            setError("Нет всех данных для создания ставки");
            return false;
        }

        try {
            const data = await postMyBid(description, price, daysToComplete, id);
            setBids(data.bids);
            setUserBidId(data.bidId)
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

    const handleAssignExecutor = async (bidId, finalPrice, finalDays) => {
        if (!bidId || !finalPrice || !finalDays) {
            return;
        }

        try {
            const data = await assignExecutor(bidId, finalPrice, finalDays);
            setOrder(data.order);
            setErrorData(null);
        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }
    }

    const handleUnAssignExecutor = async (orderId) => {
        if (!orderId) {
            return;
        }

        try {
            const data = await unAssignExecutor(orderId);
            setOrder(data.order);
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
        if (!localStorage.getItem("access")) {
            navigate("/login");
            return;
        }

        if (!/^\d+$/.test(id)) {
            setErrorData({ type: "NOT_FOUND" });
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        getOrderDetail(id).then((data) => {
            setOrder(data.order);
            setBids(data.bids);
            setIsAuthor(data.is_author);
            setUserBidId(data.user_bid_id);
            setErrorData(null);

        }).catch((error) => {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        }).finally(() => {
            setIsLoading(false);
        });


    }, [navigate])

    if (isLoading) {
        return <Loading />
    }

    if (errorData?.type === "NOT_FOUND" || (!order)) {
        return <NotFoundPage />
    }


    return <OrderDetailForm onSubmitPost={handleSubmit}
        onSubmitDeleteOrder={handleDeleteOrder}
        onSubmitDeleteBid={handleDeleteBid}
        onSubmitAssignExecutor={handleAssignExecutor}
        onSubmitUnAssignExecutor={handleUnAssignExecutor}
        bids={bids}
        order={order}
        isAuthor={isAuthor}
        userBidId={userBidId}
        error={errorData} />


}