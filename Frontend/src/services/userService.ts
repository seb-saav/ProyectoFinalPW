import { API_URL } from "../config";

export const getPublicProfile = async (userId: string) => {
    const response = await fetch(`${API_URL}/api/users/public/${userId}`);
    if (!response.ok) {
        throw new Error("No se pudo cargar el perfil");
    }
    return await response.json();
};

export const getCommunityProgress = async (userId: string) => {
    // Backend expects query param: /api/users/community-progress?userId=...
    const response = await fetch(`${API_URL}/api/users/community-progress?userId=${userId}`);
    if (!response.ok) {
        // Si falla (ej: 404 porque no existe endpoint), retornamos array vacío para no romper UI
        console.warn("Endpoint community-progress no disponible aún");
        return [];
    }
    return await response.json();
};

export const updateUserRole = async (userId: string, newRole: string) => {
    console.log("🚀 Iniciando cambio de rol...");
    console.log("URL:", `${API_URL}/api/user/update`);
    console.log("Payload:", { userId, role: newRole });

    try {
        const response = await fetch(`${API_URL}/api/user/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                role: newRole
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("❌ Error Backend:", errorData);
            throw new Error(errorData.error || 'Error en la petición');
        }

        return await response.json();
    } catch (error) {
        console.error("❌ Error updateUserRole:", error);
        throw error;
    }
};
