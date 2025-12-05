export const streamersData: { [key: string]: any[] } = {
    valorant: [
        { id: "val-pro-01", name: "TenZ", title: "Radiant Ranked | Road to #1", viewers: 25300, avatarUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/5953b039-ba6b-4560-af60-5a507a7e1485-profile_image-70x70.png" },
        { id: "val-pro-02", name: "Shroud", title: "Chill Valorant streams", viewers: 18900, avatarUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/643f2b96-60a6-4598-a6a3-009955e8c253-profile_image-70x70.png" },
        { id: "val-pro-03", name: "Kyedae", title: "RANKED w/ friends! :)", viewers: 12100, avatarUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/754a0149-a3a1-432d-8153-a5c92d54e482-profile_image-70x70.png" }
    ],
    lol: [
        { id: "lol-pro-01", name: "Faker", title: "Challenger Solo Queue", viewers: 45000, avatarUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/faker-profile_image-29f6e553a1f81498-70x70.jpeg" }
    ],
    asmr: [
        { id: "asmr-01", name: "Amouranth", title: "ASMR & Just Chatting", viewers: 12300, avatarUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/amouranth-profile_image-9339d1db-4fab-4103-93c6-d80f837e2a48-70x70.png" }
    ],
    fortnite: [
        { id: "fn-01", name: "Ninja", title: "Fortnite OG", viewers: 120800, avatarUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/4e36f06a-a03d-4229-8472-74d3209a3674-profile_image-70x70.png" }
    ],
    fc24: [
        { id: "fc-01", name: "Castro_1021", title: "FUT Champions Rewards", viewers: 30200, avatarUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/41355009-1dd1-4357-89b5-68b3554b7336-profile_image-70x70.png" }
    ],
    minecraft: [
        { id: "mc-01", name: "xQc", title: "Minecraft Speedruns", viewers: 25900, avatarUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/xqc-profile_image-9298d2877057642a-70x70.jpeg" }
    ],
    f1: [
        { id: "f1-01", name: "LandoNorris", title: "Racing Sims & Fun", viewers: 15400, avatarUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/5a91d331-a6a5-42b7-a36c-486180a3a411-profile_image-70x70.png" }
    ],
    basketball: [
        { id: "nba-01", name: "adinross", title: "NBA 2K25 Wagers", viewers: 8900, avatarUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/e83b3c2b-f227-42c2-a740-41a3130a3825-profile_image-70x70.png" }
    ],
    music: [
        { id: "music-01", name: "TheWeeknd", title: "Exclusive Listening Party", viewers: 78000, avatarUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/e519e933-d748-4790-8208-422c53f93ac4-profile_image-70x70.png" }
    ],
};

// Helper para buscar un streamer por ID en todas las categorías
export const getStreamerById = (id: string) => {
    for (const category in streamersData) {
        const found = streamersData[category].find(s => s.id === id);
        if (found) return found;
    }
    return null;
};
