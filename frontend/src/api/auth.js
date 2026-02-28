const API_URL =  `${import.meta.env.VITE_API_URL}/users/`;

export async function login(username, password) {
    
    const res = await fetch(`${API_URL}login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({username, password})
    })
    return res.json()
}

export async function register(username, password, password2, email) {
    const res = await fetch(`${API_URL}register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({username, password, password2, email})

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
