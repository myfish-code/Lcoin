import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import { getProfile, changeLanguage, sendVerifyPhoto } from "../../api/users";
import { createChat } from "../../api/chats";

import ProfileCard from "../../components/Users/Profile/ProfileCard";
import { ProfileOrderPagination } from "../../config";
import Loading from "../../components/Ui/Loading/Loading";
import NotFoundPage from "../../components/Ui/NotFoundPage/NotFoundPage";
import { useErrorHandler } from "../../hooks/useErrorHandler";

export default function Profile() {

    const [errorData, setErrorData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const handleError = useErrorHandler();

    const navigate = useNavigate();

    const { userId } = useParams();
    const [user, setUser] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();

    const [orders, setOrders] = useState(null);

    const myData = JSON.parse(localStorage.getItem("user"));
    const myId = myData?.id

    const currentRole = searchParams.get("role") || "executor";

    const currentPage = searchParams.get("page") || "1";
    const [maxPage, setMaxPage] = useState("1");
    const SIZE = ProfileOrderPagination.SIZE || 3;

    const { i18n } = useTranslation();

    const handlePageChange = (changePage) => {
        setSearchParams({
            ...Object.fromEntries(searchParams),
            page: changePage
        })
    }

    const handleTabChange = (role) => {
        setSearchParams({
            ...Object.fromEntries(searchParams),
            role: role,
            page: "1"
        })
    }

    const handleCreateChat = async () => {
        if (!userId) {
            return;
        }

        try {
            const data = await createChat(userId);

            navigate(`/chats/${data.chatId}`);

        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }
    }

    const handleApplyLangChange = async (langChange) => {
        if (!langChange) {
            return;
        }

        try {
            const data = await changeLanguage(langChange);
            await i18n.changeLanguage(langChange);
            setUser(data.user);
            localStorage.setItem("language", langChange)
            setErrorData(null);

        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }
    }

    const handleVerifyPhoto = async (photo) => {
        if (!photo) {
            return;
        }

        try {
            const data = await sendVerifyPhoto(photo);
            if (!data.error) {
                setUser(prev => ({
                    ...prev,
                    verification_status: "pending"
                }))
                setErrorData(null);
            }

            return data.error
        } catch (error) {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        } finally {

        }
    }

    useEffect(() => {
        if (!myId) {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            localStorage.removeItem("user");
            navigate("/login");
            return;
        }

        if (!/^\d+$/.test(userId) && userId !== "me") {
            setErrorData({ type: "NOT_FOUND" });
            setIsLoading(false);
            return;
        }

        if (Number(userId) === myId) {
            navigate("/profile/me", { replace: true })
            return;
        }

        const idTo = userId === "me" ? myId : userId;

        const rawRole = searchParams.get("role");
        const rawPage = searchParams.get("page");

        const listRole = ["executor", "customer"];
        const validatedRole = listRole.includes(rawRole) ? rawRole : "executor";

        const validatedPage = Math.max(1, Number(rawPage) || 1);

        const needsUpdate = String(validatedPage) !== rawPage || !listRole.includes(rawRole)

        if (needsUpdate) {
            setSearchParams({
                ...Object.fromEntries(searchParams),
                page: validatedPage,
                role: validatedRole
            })
        }

        setIsLoading(true);

        getProfile(idTo, validatedRole, validatedPage, SIZE).then((data) => {
            setUser(data.user)
            setOrders(data.orders);
            setMaxPage(data.maxPage);
            setErrorData(null);
        }).catch((error) => {
            const result = handleError(error);
            if (result.type !== 'REDIRECT') {
                setErrorData(result);
            }
        }).finally(() => {
            setIsLoading(false)
        })


    }, [navigate, currentRole, currentPage, userId]);

    const isOwner = userId === 'me';


    if (isLoading && !user) {
        return <Loading />
    }

    if (errorData?.type === "NOT_FOUND" || (!user)) {
        return <NotFoundPage />
    }

    return (
        <ProfileCard
            error={errorData}
            user={user}
            isOwner={isOwner}
            orders={orders}
            currentRole={currentRole}
            onTabChange={handleTabChange}
            currentPage={currentPage}
            maxPage={maxPage}
            onPageChange={handlePageChange}
            onCreateChat={handleCreateChat}
            onApplyLangChange={handleApplyLangChange}
            onSubmitVerifyPhoto={handleVerifyPhoto}
            isLoading={isLoading} />
    );
}


