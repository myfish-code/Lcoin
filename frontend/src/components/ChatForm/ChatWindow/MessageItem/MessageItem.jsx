import {Trash2, Edit2} from "lucide-react"
import { useTranslation } from "react-i18next";

import OrderMessageContent from "./OrderMessageContent/OrderMessageContent";

import styles from "./MessageItem.module.css"
import ActionConfirm from "../../../ModalWindow/ActionConfirm/ActionConfirm";
import { useState } from "react";

const MESSAGE_CONFIG = [
    'offer', 
    'offer_accepted', 
    'offer_declined', 
    'dispute', 
    'order_completed'
];

export default function MessageItem({message, currentUserId, isMenuConfig, onOpenMenu, isModeChat, isLoadingEdit, onEdit, onDelete,
    onAcceptOffer, onDeclineOffer,
    onConfirmOrder,
    onOpenDispute,
    onSubmitReview
    }) {
    const { t } = useTranslation();
    
    const [isLoadingDel, setIsLoadingDel] = useState(false);

    const messageType = message.type;
    const isOrderMessage = MESSAGE_CONFIG.includes(messageType);

    const isMe = currentUserId === message.author.id;
    const isAdmin = message.type === "admin";

    const isConditionMessage = isModeChat && isMe && !isOrderMessage && !isAdmin && messageType !== "deleted";
    
    const textDelete = (isMe ? t('chats.you_delete') : t('chats.user_delete'));
    const MessageClass = isAdmin ? 
        styles.Admin : (
            isMe ? styles.Me : styles.Opponent
        )
    
    const handleDeleteMessage = async (message) => {
        setIsLoadingDel(true);
        await onDelete(message);
        setIsLoadingDel(false);
    }

    return (
        <div className={`${styles.MessageItem} ${MessageClass}`}>
            
            {!isAdmin && (
                 <div className={`${styles.AuthorName} ${isMe ? styles.isMe : styles.isNotMe}`}>
                    {isMe ? t('chats.you') : message.author.name}
                 </div>
            )}
            
            <div className={styles.MessageContent}>
                <div className={`${styles.TextContent} ${styles[messageType] || ''}`} 
                        onClick={(e) => isConditionMessage && onOpenMenu(e)}>
                    {isAdmin && (
                        <div className={styles.adminFrame}>
                            {t('general.admin')}
                        </div>
                    )}
                    {isOrderMessage ? (
                        <OrderMessageContent 
                            isMe={isMe} 
                            messageType={messageType}
                            message={message}
                            onSubmitReview={onSubmitReview}
                            onAcceptOffer={onAcceptOffer}
                            onDeclineOffer={onDeclineOffer}
                            onConfirmOrder={onConfirmOrder}
                            onOpenDispute={onOpenDispute}/>
                    ) : (
                        <span>{messageType === "deleted" ? textDelete : (
                            (isLoadingDel || isLoadingEdit) ? (
                                <div className="g-loading-info">
                                    <p>{t(`load.${isLoadingDel ? 'delete' : 'edit'}`)}</p>
                                    <span className="dots">
                                        <span>.</span><span>.</span><span>.</span>
                                    </span>
                                </div>
                            ) : message.text
                        )}</span>
                    )}
                    <span className={styles.Date}>
                        {new Date(message.created_at).toLocaleString([], {
                            "hour": "2-digit",
                            "minute": "2-digit"
                        })}
                    </span>
                </div>
                
                {isConditionMessage &&(
                    <div className={styles.MenuContainer}>

                        {isMenuConfig.isOpen && isMenuConfig.messageId === message.id && (
                            <div>
                                <button 
                                    className={styles.EditBtn}
                                    onClick={() => onEdit(message)}>
                                        <Edit2 size={14} />
                                </button>

                                <ActionConfirm 
                                    labelName={<Trash2 size={14} />}
                                    buttonClass={styles.TrashBtn}
                                    confirmMessage={t('chats.delete_message_confirm')}
                                    onConfirm={() => handleDeleteMessage(message)}/>

                            </div>
                        )}
                    </div>  
                )}
            </div>
            
        </div>
    )
}