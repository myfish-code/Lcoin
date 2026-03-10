
import { preRegister } from "../../api/auth";
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import RegisterForm from "../../components/Users/RegisterForm/RegisterForm";

import Loading from "../../components/Ui/Loading/Loading";
const REACT_APP =  `${import.meta.env.VITE_GOOGLE_API_URL}`;

export default function Register() {

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("access");
        if (token) {
            navigate("/profile/me", {replace: true});
        }
    }, [navigate])

    const handleSubmit = async ({loginValue, passwordValue, password2Value, language}) => {
        
        const data = await preRegister(loginValue, passwordValue, password2Value, language);

        if (data.error) {
            return data.error
        }

        window.location.href = `${REACT_APP}/accounts/google/login/`;

        return null;
    }

    if (localStorage.getItem("access")) {
        return <Loading />
    }
    return <RegisterForm onSubmit={handleSubmit}/>
}