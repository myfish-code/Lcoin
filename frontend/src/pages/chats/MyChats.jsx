import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { getMyChats } from "../../api/chats"

import MyChatsForm from "../../components/ChatForm/MyChatsForm/MyChatsForm";
import Loading from "../../components/Ui/Loading/Loading";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import NotFoundPage from "../../components/Ui/NotFoundPage/NotFoundPage";

export default function Chats() {
    
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [errorData, setErrorData] = useState(null);
    const handleError = useErrorHandler();

    const [chats, getChats] = useState(null);

    const userData = localStorage.getItem("user");
    const myData = userData ? JSON.parse(userData) : null;
    const myId = myData?.id;

    useEffect(() => {

        setIsLoading(true)
        getMyChats().then((data) => {
            getChats(data.chats);
            setErrorData(null);
        }).catch((error) => {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        }).finally(() => {
            setIsLoading(false)
        })

    }, [myId, navigate])

    if (isLoading) {
        return <Loading />
    }

    if (errorData?.type === "NOT_FOUND" || (!chats)) {
        return <NotFoundPage />
    }

    return (
        <MyChatsForm chats={chats} myId={myId} error={errorData}/>
    )
} 