import styles from "./MyOrdersForm.module.css"

import { useState } from "react"

import OrderCard from "../../Cards/OrderCard/OrderCard"
import RadioChoice from "../../Ui/RadioChoice/RadioChoice"
import OrderInputs from "../../Inputs/Order/OrderInputs"
import { useTranslation } from "react-i18next"
import ErrorWindow from "../../Ui/ErrorWindow/ErrorWindow"
import Loading from "../../Ui/Loading/Loading"
export default function MyOrderForm({ onSubmitPost, onSubmitDelete, orders, currentStatus, onTabChange, isLoading, error }) {
    const { t } = useTranslation();

    const [showForm, setShowForm] = useState(false);

    const handleSubmit = async (params) => {

        const success = await onSubmitPost(params);
        if (success) {
            setShowForm(false);
        }
    }

    const handleDelete = async (id) => {
        await onSubmitDelete(id)
    }

    const handleOrderTypeChange = (status) => {
        onTabChange(status);
    }

    const choices = [
        { id: 1, status: "open", text: t('orders.status_open') },
        { id: 2, status: "pending", text: t('orders.status_pending') },
        { id: 3, status: "in_progress", text: t('orders.status_in_progress') },
        { id: 4, status: "completed", text: t('orders.status_completed') },
    ]

    const textOrders = {
        open: t('orders.text_open'),
        pending: t('orders.text_pending'),
        in_progress: t('orders.text_in_progress'),
        completed: t('orders.text_completed')
    }

    return (
        <div className={styles.OrdersForm}>
            {error && (
                <ErrorWindow error={error} />
            )}
            <RadioChoice
                choices={choices}
                currentStatus={currentStatus}
                onTabChange={handleOrderTypeChange} />


            <button className={styles.OptionBtn} onClick={() => { setShowForm(!showForm) }}>
                {showForm ? t('orders.button_cancel') : t('orders.button_text')}
            </button>

            {showForm && (
                <OrderInputs
                    onSubmitForm={handleSubmit}
                />
            )}

            {isLoading ? (
                <div className="g-loading-view">
                    <span className="g-loading-icon">📦</span>
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
                    <span className="g-empty-icon">📦</span>
                    <p>{textOrders[currentStatus] || t('orders.text_general')}</p>
                    <h4>{t('orders.text_info')}</h4>
                </div>
            ) : (
                orders.map((order) => (
                    <div key={order.id}>
                        <OrderCard order={order} isProfileView={true} onDelete={() => handleDelete(order.id)} reviews={order.reviews_data} />
                    </div>

                ))
            )}
        </div>
    )
}