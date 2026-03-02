
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export const useErrorHandler = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleError = (error) => {

        if (error.status === 401) {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            navigate("/login")
            return { type: 'REDIRECT' };
        }

        if (error.status === 404) {
            return { type: 'NOT_FOUND', message: t('error_message.NOT_FOUND') };
        }

        return {
            type: 'MESSAGE',
            message: t(`error_message.${error.message || 'UNKNOWN_ERROR'}`)
        };
    }

    return handleError;
}