export interface CoinPack {
    id: number;
    amount: number;
    price: string;
    pointsAwarded: number;
    isActive?: boolean;
}

export interface Gift {
    id: number;
    name: string; // Backend uses 'name', Frontend interface used 'nombre' - normalizing to 'name' or mapping
    costo: number;
    emoji: string;
    puntos?: number; // Some interfaces have this
    isActive?: boolean;
    isCustom?: boolean;
}

import { API_URL } from "../config";
const STORE_API = `${API_URL}/api/store`;

export const StoreService = {
    getGifts: async (): Promise<Gift[]> => {
        try {
            const response = await fetch(`${STORE_API}/gifts`);
            if (!response.ok) throw new Error("Error fetching gifts");
            return await response.json();
        } catch (error) {
            console.error("StoreService.getGifts error:", error);
            return [];
        }
    },

    getCoinPacks: async (): Promise<CoinPack[]> => {
        try {
            const response = await fetch(`${STORE_API}/packs`);
            if (!response.ok) throw new Error("Error fetching coin packs");
            return await response.json();
        } catch (error) {
            console.error("StoreService.getCoinPacks error:", error);
            return [];
        }
    }
};
