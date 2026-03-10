const API_URL =  `${import.meta.env.VITE_API_URL}/users/`;

export async function login(username, password, language) {
    
    const res = await fetch(`${API_URL}login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({username, password, language})
    })
    return res.json()
}

export async function loginGoogle() {
    
    const res = await fetch(`${API_URL}login-google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    })
    return res.json()
}

export async function preRegister(username, password, password2, language) {
    const res = await fetch(`${API_URL}pre-register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({username, password, password2, language})

    })
    return res.json()
}

export async function refreshToken(refresh) {
    const res = await fetch(`${API_URL}token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh })
    })

    if (!res.ok) {
        throw new Error("refresh token expired")
    }

    return res.json()
}
