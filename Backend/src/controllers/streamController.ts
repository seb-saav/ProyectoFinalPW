import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/streams/status
export const updateStreamStatus = async (req: Request, res: Response) => {
    const { userId, action } = req.body; // action: "START" o "END"

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

        if (action === "START") {
            // --- INICIO DEL STREAM ---
            // Guardamos la hora exacta. Si el servidor explota, este dato persiste.
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    isLive: true,
                    lastStreamStart: new Date() // <--- Marca de tiempo (Checkpoint)
                }
            });

            // --- NOTIFICACIÓN SOCKET (Para el Feed y Viewers) ---
            const io = req.app.get('io');
            if (io) {
                const streamData = {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    streamTitle: updatedUser.streamTitle,
                    streamCategory: updatedUser.streamCategory,
                    lastStreamStart: updatedUser.lastStreamStart // <--- CRUCIAL: Para el cronómetro del viewer
                };
                io.emit('server:stream_started', streamData);
                console.log(`📡 Evento 'server:stream_started' emitido para ${updatedUser.name}`);
            }
            // ----------------------------------------------------

            return res.json({
                message: "Stream iniciado 🔴",
                lastStreamStart: updatedUser.lastStreamStart
            });
        }

        else if (action === "END") {
            // --- FIN DEL STREAM (Cálculo de Tiempo) ---

            // 1. Validamos: ¿Tenía una hora de inicio guardada?
            if (!user.lastStreamStart) {
                // Caso raro: Terminó un stream que nunca "empezó" oficialmente.
                await prisma.user.update({ where: { id: userId }, data: { isLive: false } });
                return res.json({ message: "Stream finalizado (Sin tiempo registrado)" });
            }

            // 2. MATEMÁTICA DE TIEMPO (Tolerante a fallos)
            const ahora = new Date();
            const inicio = new Date(user.lastStreamStart);

            // Restamos milisegundos y convertimos a horas
            const diffMs = ahora.getTime() - inicio.getTime();
            const horasSesion = diffMs / (1000 * 60 * 60); // ms -> horas

            // 3. ACTUALIZACIÓN ATÓMICA
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    isLive: false,
                    lastStreamStart: null, // Borramos la marca temporal
                    totalStreamHours: { increment: horasSesion } // Sumamos al historial
                }
            });

            // --- NOTIFICACIÓN SOCKET (Para cerrar viewers) ---
            const io = req.app.get('io');
            if (io) {
                const endPayload = {
                    streamerId: userId,
                    message: "Stream finalizado"
                };
                io.emit("server:stream_ended", endPayload);
                console.log(`📡 Evento 'server:stream_ended' enviado para ${userId}`);
            }
            // -------------------------------------------------

            return res.json({
                message: "Stream finalizado",
                horasSumadas: horasSesion.toFixed(2),
                totalHoras: updatedUser.totalStreamHours
            });
        } else {
            return res.status(400).json({ error: "Acción inválida (START/END)" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error cambiando estado" });
    }
};
