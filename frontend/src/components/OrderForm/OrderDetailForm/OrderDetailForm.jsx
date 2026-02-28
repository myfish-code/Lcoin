import { useNavigate } from "react-router-dom";
import { useState } from "react";

import styles from "./OrderDetailForm.module.css"

import BidInputs from "../../Inputs/Bid/BidInputs";
import OrderInfo from "../../Info/OrderInfo/OrderInfo"; 
import BidInfo from "../../Info/BidInfo/BidInfo";
import ErrorWindow from "../../Ui/ErrorWindow/ErrorWindow"; 

import { useTranslation } from "react-i18next";


export default function OrderDetailForm({onSubmitPost,
                                         onSubmitDeleteBid,
                                         onSubmitDeleteOrder,
                                         onSubmitAssignExecutor,
                                         onSubmitUnAssignExecutor,
                                         bids,
                                         order,
                                         isAuthor,
                                         userBidId,
                                         error}) {
    
    const { t } = useTranslation();

    const [showForm, setShowForm] = useState(false);

    const handleSubmit = async (params) => {
        const success = await onSubmitPost(params);
        if (success) {
            setShowForm(false);
        }
    }

    const handleDeleteBid = async (bidId) => {
        await onSubmitDeleteBid(bidId);
        
    }

    const handleDeleteOrder = async(orderId) => {
        await onSubmitDeleteOrder(orderId);
    }

    const handleAssignExecutor = async(bidId, finalPrice, finalDays) => {
        await onSubmitAssignExecutor(bidId, finalPrice, finalDays);
    }

    const handleUnAssignExecutor = async (orderId) => {
        await onSubmitUnAssignExecutor(orderId);
    }
    
    return (
        <div className={styles.OrderDetailContainer}>
            {error && (
                <ErrorWindow error={error}/>
            )}
            <OrderInfo 
                order={order}
                isAuthor={isAuthor}
                onDeleteOrder={handleDeleteOrder}/>

            { !isAuthor && !userBidId && (order.status === "open" || order.status === "pending") && (
                <button className={styles.OptionBtn} onClick={() => setShowForm(!showForm)}>
                    {showForm ? t('bids.cancel') : t('bids.create_bid')}
                </button>
            
            )}

            {showForm && !isAuthor && !userBidId &&  (
                <BidInputs 
                    onSubmitForm={handleSubmit}
                />
            )}

            {bids.length === 0 ? (
                <div className="g-empty-view">
                    <span className="g-empty-icon">📩</span>
                    <p>{t('bids.text_empty')}</p>
                    <h4>{t('bids.text_empty_explain')}</h4>
                </div>
            ) : (
                <div className={styles.BidsDetailContainer}>
                    <h3 className={styles.BidsTitle}>{t('general.bids')}: ({bids.length})</h3>
                    
                    {bids.map((bid) => (
                        <BidInfo 
                            key={bid.id}
                            bid={bid} order={order} isAuthor={isAuthor} userBidId={userBidId}
                            onDeleteBid={handleDeleteBid}
                            onAssignExecutor={handleAssignExecutor}
                            onUnAssignExecutor={handleUnAssignExecutor}
                            />
                    ))}
                </div>
            )}
        </div>
    )
}