import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const obtenerPerfilPublico = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const usuario = await prisma.user.findUnique({
            where: { id: id },
            select: {
                id: true,
                name: true,
                puntos: true,
                role: true,
                description: true,
                xpThreshold: true,
                totalStreamHours: true, // <--- NUEVO
                isLive: true,           // <--- NUEVO
                lastStreamStart: true,  // <--- NUEVO (Para el cronómetro)
                // avatar: true, // Si tuvieras avatar en la BD
            }
        });

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // CÁLCULO DE NIVEL (Misma fórmula que usas en el frontend)
        // Nivel = (Puntos / 500) + 1 (tomando la parte entera)
        // const nivelCalculado = Math.floor(usuario.puntos / 500) + 1; // Old calculation

        const publicProfile = {
            id: usuario.id,
            name: usuario.name,
            puntos: usuario.puntos,
            role: usuario.role,
            description: usuario.description,
            xpThreshold: usuario.xpThreshold, // <--- NUEVO: Enviamos la configuración al frontend
            nivel: Math.floor(usuario.puntos / usuario.xpThreshold) + 1, // <--- NUEVO: Cálculo dinámico

            // --- NUEVO: DATOS DE STREAMER ---
            isLive: usuario.isLive,
            totalStreamHours: usuario.totalStreamHours,
            lastStreamStart: usuario.lastStreamStart, // <--- Para el cronómetro
            streamerLevel: Math.floor(usuario.totalStreamHours / 10) + 1, // 1 Nivel cada 10 horas
            nextStreamerLevelAt: (Math.floor(usuario.totalStreamHours / 10) + 1) * 10
        };

        res.json(publicProfile);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo perfil" });
    }
};

// PATCH /api/streamer/settings
export const updateStreamerSettings = async (req: Request, res: Response) => {
    const { userId, newThreshold } = req.body;

    if (!newThreshold || newThreshold < 50) {
        return res.status(400).json({ error: "El mínimo es 50 puntos por nivel" });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { xpThreshold: Number(newThreshold) }
        });
        res.json({ message: "Dificultad actualizada", settings: updatedUser });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error actualizando configuración" });
    }
};

// GET /api/users/community-progress
export const getCommunityProgress = async (req: Request, res: Response) => {
    const { userId } = req.query; // Usamos query param para GET

    if (!userId) {
        return res.status(400).json({ error: "Falta userId" });
    }

    try {
        console.log(`🔍 [DEBUG] Buscando progreso para usuario: ${userId}`);

        // 1. Traemos todas las transacciones que dieron puntos
        const transacciones = await prisma.transaction.findMany({
            where: {
                userId: String(userId),
                points: { gt: 0 },
                targetStreamerId: { not: null }
            },
            include: {
                // Incluimos al streamer para saber su nombre y SU REGLA DE DIFICULTAD
                targetStreamer: { select: { id: true, name: true, xpThreshold: true } }
            }
        });

        console.log(`📊 [DEBUG] Transacciones encontradas: ${transacciones.length}`);
        if (transacciones.length > 0) {
            console.log("📝 [DEBUG] Primera transacción:", JSON.stringify(transacciones[0], null, 2));
        }

        // 2. Agrupación manual (Javascript reduce)
        // Definimos una interfaz para el acumulador para evitar errores de tipo
        interface ProgressAcc {
            [key: string]: {
                streamerName: string;
                streamerId: string;
                threshold: number;
                totalPoints: number;
            }
        }

        const progresoMap = transacciones.reduce((acc: ProgressAcc, tx) => {
            const sId = tx.targetStreamerId!;
            // Verificamos que targetStreamer exista (aunque el where lo asegura, TS puede quejarse)
            if (tx.targetStreamer) {
                if (!acc[sId]) {
                    acc[sId] = {
                        streamerName: tx.targetStreamer.name,
                        streamerId: tx.targetStreamer.id,
                        threshold: tx.targetStreamer.xpThreshold,
                        totalPoints: 0
                    };
                }
                acc[sId].totalPoints += tx.points;
            }
            return acc;
        }, {} as ProgressAcc);

        // 3. Formateo final
        const resultado = Object.values(progresoMap).map((p) => {
            const nivel = Math.floor(p.totalPoints / p.threshold) + 1;
            const puntosParaSiguiente = p.threshold - (p.totalPoints % p.threshold);
            // Progreso actual dentro del nivel (0 a 100%)
            // Puntos en el nivel actual = totalPoints % threshold
            const puntosEnNivelActual = p.totalPoints % p.threshold;
            const progressPercent = Math.floor((puntosEnNivelActual / p.threshold) * 100);

            return {
                // Formato JSON original (Propuesto en RF-30)
                streamerName: p.streamerName,
                streamerId: p.streamerId,
                xpLocal: p.totalPoints,
                xpThreshold: p.threshold,
                currentLevel: nivel,
                nextLevelAt: (nivel * p.threshold),
                pointsToNextLevel: puntosParaSiguiente,
                progressPercent: progressPercent,

                // Formato del Snippet "Guía Rápida" (Posiblemente usado por Frontend)
                streamer: p.streamerName,
                nivel: nivel,
                xp: p.totalPoints,
                meta: p.threshold,
                falta: puntosParaSiguiente
            };
        });

        res.json(resultado);
    } catch (error) {
        console.error("Error en community-progress:", error);
        res.status(500).json({ error: "Error calculando progreso" });
    }
};
