import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config'; // Usamos SOCKET_URL de config.ts

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // 1. Inicializar conexión ÚNICA
        console.log("🔌 Inicializando Socket Global...");
        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
        });

        // 2. Listeners de estado
        newSocket.on('connect', () => {
            console.log('🟢 Socket Global Conectado:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('🔴 Socket Global Desconectado');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error("❌ Error de conexión Socket Global:", err.message);
        });

        setSocket(newSocket);

        // 3. Cleanup al cerrar la app (no al cambiar de página)
        return () => {
            console.log("🔌 Desconectando Socket Global...");
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
