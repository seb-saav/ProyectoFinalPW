import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const enviarRegalo = async (req: Request, res: Response) => {
    // Recibimos: Quién envía (userId), A quién (streamerId) y Qué regala (giftId)
    const { userId, streamerId, giftId } = req.body;

    console.log("🎁 [DEBUG] Intento de regalo:", { userId, streamerId, giftId });

    if (!userId || !streamerId || !giftId) {
        console.error("❌ [DEBUG] Faltan datos en enviarRegalo");
        return res.status(400).json({ error: "Faltan datos (userId, streamerId, giftId)" });
    }

    try {
        // 1. Buscamos cuánto cuesta el regalo
        const idRegalo = Number(giftId);
        if (isNaN(idRegalo)) {
            return res.status(400).json({ error: "ID de regalo inválido" });
        }

        const regalo = await prisma.gift.findUnique({
            where: { id: idRegalo }
        });

        if (!regalo) return res.status(404).json({ error: "Regalo no encontrado" });

        // 2. Buscamos al usuario para ver si tiene saldo
        const usuario = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
        if (usuario.monedas < regalo.costo) {
            return res.status(400).json({ error: "Saldo insuficiente 💸" });
        }

        // 3. LA MATEMÁTICA DE XP (Tu requerimiento) 🧮
        const xpGanada = regalo.costo * 10;

        // --- LÓGICA DE NIVEL DINÁMICA ---
        console.log(`🔍 [DEBUG] Buscando configuración de streamer ${streamerId}`);
        const streamer = await prisma.user.findUnique({
            where: { id: streamerId },
            select: { xpThreshold: true }
        });

        const factorDificultad = streamer?.xpThreshold || 500;
        console.log(`📊 [DEBUG] Factor Dificultad: ${factorDificultad}`);

        const calcularNivel = (puntos: number) => Math.floor(puntos / factorDificultad) + 1;

        const xpActual = usuario.puntos;
        const nivelActual = calcularNivel(xpActual);

        const xpFutura = xpActual + xpGanada;
        const nivelFuturo = calcularNivel(xpFutura);

        const subioNivel = nivelFuturo > nivelActual;
        // -----------------------

        // 4. TRANSACCIÓN ATÓMICA
        console.log("🔄 [DEBUG] Iniciando transacción...");
        const resultado = await prisma.$transaction(async (tx) => {

            // A. Restamos monedas y Sumamos XP
            const usuarioActualizado = await tx.user.update({
                where: { id: userId },
                data: {
                    monedas: { decrement: regalo.costo },
                    puntos: { increment: xpGanada }
                }
            });

            // C. Guardamos el recibo
            await tx.transaction.create({
                data: {
                    userId: userId,
                    targetStreamerId: streamerId,
                    amount: regalo.costo,
                    price: 0,
                    points: xpGanada,
                    type: "GIFT",
                    status: "COMPLETED"
                }
            });

            return usuarioActualizado;
        });

        console.log("✅ [DEBUG] Transacción exitosa");

        // 5. Responder
        res.json({
            success: true,
            mensaje: `¡Enviaste ${regalo.name}! Ganaste ${xpGanada} XP.`,
            nuevasMonedas: resultado.monedas,
            nuevosPuntos: resultado.puntos,
            levelUp: subioNivel,
            nuevoNivel: nivelFuturo
        });

    } catch (error) {
        console.error("❌ [DEBUG] Error en enviarRegalo:", error);
        res.status(500).json({ error: "Error procesando el regalo" });
    }
};
