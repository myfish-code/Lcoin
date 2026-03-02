import { register } from "../../api/auth";
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import RegisterForm from "../../components/Users/RegisterForm/RegisterForm";

import Loading from "../../components/Ui/Loading/Loading";

export default function Register() {

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("access");
        if (token) {
            navigate("/profile/me", {replace: true});
        }
    }, [navigate])

    const handleSubmit = async ({loginValue, passwordValue, password2Value, emailValue, language}) => {
        
        const data = await register(loginValue, passwordValue, password2Value, emailValue, language);

        if (data.error) {
            return data.error
        }

        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate("/profile/me")

        return null
    }

    if (localStorage.getItem("access")) {
        return <Loading />
    }
    return <RegisterForm onSubmit={handleSubmit}/>
}