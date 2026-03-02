import LoginForm from "../../components/Users/LoginForm/LoginForm";
import { login } from "../../api/auth";
import { useState, useEffect } from "react";
import { replace, useNavigate } from 'react-router-dom';
import Loading from "../../components/Ui/Loading/Loading";

export default function Login() {

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("access");
        if (token) {
            navigate("/profile/me", {replace: true})
        }
    }, [navigate])

    const handleLogin = async ({loginValue, passwordValue, language}) => {

        const data = await login(loginValue, passwordValue, language);
        
        if (data.error) {
            return data.error
        }
        
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        navigate("/profile/me")
        return null;
    }

    if (localStorage.getItem("access")) {
        return <Loading />
    }
    return <LoginForm onSubmit={handleLogin}/>
}