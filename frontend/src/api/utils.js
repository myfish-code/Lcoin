import { refreshToken } from "./auth";

export async function privateGet(url) {
    let accessToken = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh")

    let res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        }
    });

    if (res.status == 401) {
        try {
            const data = await refreshToken(refresh);
            accessToken = data.access;

            localStorage.setItem("access", accessToken);

            res = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            })
        } catch {
            const error = new Error()
            error.status = res.status
            error.message = "TOKEN_EXPIRED"
            throw error;
        }

    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const error = new Error();
        error.status = res.status;
        error.message = data.error || "UNKNOWN_ERROR"
        throw error;
    }

    return res.json();

}

export async function privatePost(url, data = {}) {
    let accessToken = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh")

    const formData = new FormData();
    Object.keys(data).forEach(key => {
        formData.append(key, data[key])
    });

    const sendRequest = async (token) => {
        return await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });
    };

    let res = await sendRequest(accessToken);

    if (res.status == 401 && refresh) {
        try {
            const data = await refreshToken(refresh);
            accessToken = data.access;
            localStorage.setItem("access", accessToken)

            res = await sendRequest(accessToken);
        } catch {
            const error = new Error()
            error.status = res.status
            error.message = "TOKEN_EXPIRED"
            throw error;
        }
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const error = new Error();
        error.status = res.status;
        error.message = data.error || "UNKNOWN_ERROR"
        throw error;
    }

    return res.json();
}

export async function privatePatch(url, data = {}) {
    let accessToken = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh")

    const formData = new FormData();
    Object.keys(data).forEach(key => {
        formData.append(key, data[key])
    });

    const sendRequest = async (token) => {
        return await fetch(url, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });
    };

    let res = await sendRequest(accessToken);

    if (res.status == 401 && refresh) {
        try {
            const data = await refreshToken(refresh);
            accessToken = data.access;
            localStorage.setItem("access", accessToken)

            res = await sendRequest(accessToken);
        } catch {
            const error = new Error()
            error.status = res.status
            error.message = "TOKEN_EXPIRED"
            throw error;
        }
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const error = new Error();
        error.status = res.status;
        error.message = data.error || "UNKNOWN_ERROR"
        throw error;
    }

    return res.json();
}


export async function privateDelete(url) {
    let accessToken = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh")

    const sendRequest = async (token) => {
        return await fetch(url, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            },
        });
    };

    let res = await sendRequest(accessToken);

    if (res.status == 401 && refresh) {
        try {
            const data = await refreshToken(refresh);
            accessToken = data.access;
            localStorage.setItem("access", accessToken)

            res = await sendRequest(accessToken);
        } catch {
            const error = new Error()
            error.status = res.status
            error.message = "TOKEN_EXPIRED"
            throw error;
        }
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const error = new Error();
        error.status = res.status;
        error.message = data.error || "UNKNOWN_ERROR"
        throw error;
    }

    return res.json();
}
