
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Loading from "../../components/Ui/Loading/Loading";

const AuthSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const access = params.get("access");
        const refresh = params.get("refresh");
        const user = params.get("user");

        if (access && refresh && user) {
            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);
            localStorage.setItem("user", user);
            navigate("/profile/me", { replace: true });
        } else {
            navigate("/login", { replace: true });
        }
    }, [navigate, location]);

    return <Loading />
};

export default AuthSuccess;