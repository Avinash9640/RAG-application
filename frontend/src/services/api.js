const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000";


export async function request(
    endpoint,
    options = {}
) {
    let demoUser = null;

    try {
        demoUser = JSON.parse(
            localStorage.getItem("rag-demo-user") || "null"
        );
    } catch {
        demoUser = null;
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,

            headers: {
                ...(options.body instanceof FormData
                    ? {}
                    : { "Content-Type": "application/json" }),
                ...(demoUser?.role
                    ? { "X-Demo-Role": demoUser.role }
                    : {}),
                ...(demoUser?.email
                    ? { "X-Demo-User": demoUser.email }
                    : {}),
                ...(options.headers || {}),
            },
        }
    );


    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }


    if (!response.ok) {
        const message =
            data?.detail ||
            data?.message ||
            `Request failed with status ${response.status}`;

        throw new Error(message);
    }


    return data;
}


export async function getHealth() {
    return request("/api/health");
}


export async function requestBlob(endpoint) {
    let demoUser = null;
    try {
        demoUser = JSON.parse(localStorage.getItem("rag-demo-user") || "null");
    } catch {
        demoUser = null;
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            ...(demoUser?.role ? { "X-Demo-Role": demoUser.role } : {}),
            ...(demoUser?.email ? { "X-Demo-User": demoUser.email } : {}),
        },
    });
    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const data = await response.json();
            message = data?.detail || message;
        } catch {
            // The response may not contain JSON.
        }
        throw new Error(message);
    }
    return {
        blob: await response.blob(),
        disposition: response.headers.get("Content-Disposition") || "",
    };
}
