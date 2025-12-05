export const getUser = () => {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr || userStr === "undefined") return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        console.error("Error parsing user data:", e);
        localStorage.removeItem("currentUser");
        return null;
    }
};

export const setUser = (user: any) => {
    if (!user || typeof user !== "object") {
        console.warn("⚠️ Intento de guardar usuario inválido:", user);
        return;
    }
    localStorage.setItem("currentUser", JSON.stringify(user));
    window.dispatchEvent(new Event("balanceUpdated"));
};

export const clearUser = () => {
    localStorage.removeItem("currentUser");
    window.dispatchEvent(new Event("balanceUpdated"));
};
