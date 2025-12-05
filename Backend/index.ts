// backend/index.ts

import express, { Request, Response } from "express"
import cors from "cors"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import crypto from "crypto"
import { enviarCorreoBienvenida } from "./src/emailService"
import { enviarRegalo } from "./src/controllers/giftController"
import { obtenerPerfilPublico, updateStreamerSettings, getCommunityProgress } from "./src/controllers/userController"
import { updateStreamStatus } from "./src/controllers/streamController"

// Carga las variables de entorno (como DATABASE_URL)
dotenv.config()

// --- Inicialización ---
const app = express()
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
}) // Creamos el "conector" a la BD
const PORT = process.env.PORT || 8000
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"

// Middlewares
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}))
app.use(express.json()) // Permite al servidor entender el formato JSON

// --- RUTAS DE LA API ---

// Ruta de prueba
app.get("/api/test", (req: Request, res: Response) => {
  res.json({ message: "¡El backend de ULimeñitaPlay funciona GOZU!" })
})

// backend/index.ts

// ... (tu app.get("/api/test", ...)) ...

// ---- ¡AÑADE ESTO! ----
app.get("/api/prueba", (req, res) => {
  console.log("¡LLEGÓ LA PETICIÓN A /api/prueba!");
  res.json({ message: "¡LA RUTA DE PRUEBA FUNCIONA!" });
});
// ----------------------

// ... (el resto de tus rutas, como /api/auth/register, etc.) ...

// ===========================================
// ¡AQUÍ EMPIEZA LA NUEVA LÓGICA DE REGISTRO!
// ===========================================
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    // 1. Validar que los datos llegaron
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" })
    }

    // 2. Revisar si el email ya existe en la BD
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    })

    if (existingUser) {
      return res.status(409).json({ error: "Este correo electrónico ya está registrado" })
    }

    // 3. Encriptar la contraseña (¡MUY IMPORTANTE!)
    const hashedPassword = await bcrypt.hash(password, 10) // 10 "rondas" de encriptación

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 4. Crear el nuevo usuario en la Base de Datos
    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        verificationToken: verificationToken,
        isVerified: false
        // Los valores por defecto (monedas: 100, puntos: 0, role: "usuario")
        // se aplican automáticamente gracias a tu 'schema.prisma'
      },
    })

    enviarCorreoBienvenida(newUser.email, newUser.name, verificationToken);



    // 5. Enviar respuesta exitosa
    // No devolvemos el usuario para evitar auto-login
    res.status(201).json({ message: "Usuario registrado. Por favor verifica tu correo electrónico." })

  } catch (error) {
    console.error("Error en el registro:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// ===========================================
// ¡VERIFICACIÓN DE CUENTA!
// ===========================================
app.post("/api/auth/verify", async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null
      }
    });

    res.json({ message: "¡Cuenta verificada con éxito!" });
  } catch (error) {
    console.error("Error en verificación:", error);
    res.status(500).json({ error: "Error al verificar" });
  }
})

// backend/index.ts
// ... (justo después del código de /register) ...

// ===========================================
// ¡NUEVA LÓGICA DE LOGIN!
// ===========================================
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    console.log("🔵 1. Login endpoint llamado")
    console.log("🔵 2. Body recibido:", JSON.stringify(req.body, null, 2))

    const { email, password } = req.body
    console.log("🔵 3. Email extraído:", email)
    console.log("🔵 4. Password recibido:", password ? "SÍ (ocultado)" : "NO")

    // 1. Validar que los datos llegaron
    if (!email || !password) {
      console.log("🔴 5. Validación falló: Campos vacíos")
      return res.status(400).json({ error: "Email y contraseña son obligatorios" })
    }
    console.log("✅ 5. Validación pasó")

    // 2. Buscar al usuario en la Base de Datos
    console.log("🔵 6. Buscando usuario en BD...")
    const user = await prisma.user.findUnique({
      where: { email: email },
    })
    console.log("🔵 7. Usuario encontrado:", user ? "SÍ ✅" : "NO ❌")

    if (user) {
      console.log("🔵 7a. Datos del usuario:", {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role
      })
    }

    // 3. Si el usuario NO existe
    if (!user) {
      console.log("🔴 8. Usuario no encontrado en BD")
      return res.status(404).json({ error: "Correo o contraseña incorrectos" })
    }
    console.log("✅ 8. Usuario existe en BD")

    // VERIFICAR SI LA CUENTA ESTÁ ACTIVADA
    console.log("🔵 9. Verificando si cuenta está activada:", user.isVerified)
    if (!user.isVerified) {
      console.log("🔴 10. Cuenta NO verificada")
      return res.status(403).json({ error: "Debes verificar tu correo antes de iniciar sesión." })
    }
    console.log("✅ 10. Cuenta verificada")

    // 4. Comparar la contraseña encriptada
    console.log("🔵 11. Comparando contraseñas...")
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log("🔵 12. Resultado comparación:", isPasswordValid ? "VÁLIDA ✅" : "INVÁLIDA ❌")

    // 5. Si la contraseña NO coincide
    if (!isPasswordValid) {
      console.log("🔴 13. Contraseña incorrecta")
      return res.status(401).json({ error: "Correo o contraseña incorrectos" })
    }
    console.log("✅ 13. Contraseña correcta")

    // ¡ÉXITO!
    console.log(`✅ 14. LOGIN EXITOSO - Usuario ${user.name} ha iniciado sesión como ${user.role}`)

    // 6. Enviar respuesta exitosa
    // (Ocultamos la contraseña en la respuesta por seguridad)
    const { password: _, ...userWithoutPassword } = user

    // Devolvemos al usuario Y el rol que seleccionó
    console.log("🔵 15. Enviando respuesta al frontend...")
    res.status(200).json({ user: userWithoutPassword, role: user.role })
    console.log("✅ 16. Respuesta enviada exitosamente")

  } catch (error) {
    console.error("❌ ERROR CRÍTICO EN LOGIN:", error)
    console.error("❌ Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    console.error("❌ Tipo de error:", error instanceof Error ? error.constructor.name : typeof error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// backend/index.ts
// ... (después del código de /login) ...
// ... (Tus imports y configs)

// ==========================================
// 1. INICIAR STREAM (Gozu Mode On)
// ==========================================
app.post("/api/stream/start", async (req: Request, res: Response) => {
  try {
    const { userId, title, category } = req.body;

    // Generate timestamp on the server (CRITICAL)
    const lastStreamStart = new Date();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isLive: true,
        streamTitle: title,
        streamCategory: category,
        lastStreamStart: lastStreamStart // <--- CRITICAL: Save timestamp
      }
    });

    // Socket.IO notification (CRITICAL for real-time feed)
    const io = req.app.get('io');
    if (io) {
      const streamData = {
        id: updatedUser.id,
        name: updatedUser.name,
        streamTitle: updatedUser.streamTitle,
        streamCategory: updatedUser.streamCategory,
        lastStreamStart: updatedUser.lastStreamStart // <--- CRITICAL
      };
      io.emit('server:stream_started', streamData);
      console.log(`🟢 Stream iniciado:`, {
        userId: updatedUser.id,
        lastStreamStart: updatedUser.lastStreamStart,
        title: updatedUser.streamTitle
      });
    }

    res.json({
      success: true,
      message: "¡Stream Iniciado!",
      lastStreamStart: updatedUser.lastStreamStart // <--- CRITICAL: Return to client
    });
  } catch (error) {
    console.error("❌ Error iniciando stream:", error);
    res.status(500).json({ error: "No se pudo iniciar el stream." });
  }
});

// ==========================================
// 2. TERMINAR STREAM (Apagar todo)
// ==========================================
app.post("/api/stream/stop", async (req: Request, res: Response) => {
  const { userId } = req.body;

  try {
    // 1. Obtener datos del usuario ANTES de actualizar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        lastStreamStart: true,
        totalStreamHours: true,
        isLive: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!user.isLive) {
      return res.status(400).json({ error: "El usuario no está en vivo" });
    }

    // 2. Calcular horas de stream (si tiene lastStreamStart)
    let hoursStreamed = 0;
    let newTotalHours = user.totalStreamHours || 0;

    if (user.lastStreamStart) {
      const now = new Date();
      const startTime = new Date(user.lastStreamStart);
      hoursStreamed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60); // en horas
      newTotalHours = (user.totalStreamHours || 0) + hoursStreamed;
    }

    // 3. Actualizar usuario en BD
    await prisma.user.update({
      where: { id: userId },
      data: {
        isLive: false,
        lastStreamStart: null,
        streamTitle: null,
        streamCategory: null,
        totalStreamHours: newTotalHours
      }
    });

    // 4. ⚠️ CRÍTICO: Emitir evento Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('server:stream_ended', {
        streamerId: userId,          // ← DEBE coincidir con el ID del streamer
        streamerName: user.name,
        horasTransmitidas: hoursStreamed.toFixed(2),
        totalHoras: newTotalHours.toFixed(2)
      });

      // 5. Log para debug
      console.log(`🛑 Evento 'server:stream_ended' emitido para ${user.name}`);
      console.log(`   - streamerId: ${userId}`);
      console.log(`   - Horas transmitidas: ${hoursStreamed.toFixed(2)}`);
    }

    // 6. Respuesta al cliente
    res.json({
      success: true,
      message: "Stream finalizado exitosamente",
      horasSumadas: hoursStreamed.toFixed(2),
      totalHoras: newTotalHours.toFixed(2)
    });
  } catch (error) {
    console.error("❌ Error en /api/stream/stop:", error);
    res.status(500).json({ error: "Error al apagar el stream." });
  }
});

// ==========================================
// 3. OBTENER USUARIOS EN VIVO (Para PantallaGeneral)
// ==========================================
app.get("/api/streams/live", async (req: Request, res: Response) => {
  try {
    const liveUsers = await prisma.user.findMany({
      where: { isLive: true, role: 'streamer' },
      select: {
        id: true, name: true, streamTitle: true, streamCategory: true,
        lastStreamStart: true // <--- IMPORTANT: For viewer stopwatch
        // No enviamos password ni email por seguridad
      }
    });
    res.json(liveUsers);
  } catch (error) {
    res.status(500).json({ error: "Error al cargar streams." });
  }
});

// ==========================================
// 4. HISTORIAL DE CHAT (Restored)
// ==========================================
app.get("/api/messages/:streamId", async (req: Request, res: Response) => {
  const { streamId } = req.params;
  try {
    const messages = await prisma.message.findMany({
      where: { streamId: streamId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { name: true } } }
    });

    const historial = messages.map(msg => ({
      text: msg.text,
      userId: msg.userId,
      username: msg.user.name
    }));

    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: "Error loading chat" });
  }
});

// ... (Resto de tus endpoints de Auth y Tienda) ...

// ==========================================
// CORRECCIÓN TOGGLE REGALOS
// ==========================================
// El problema del toggle era visual en el front o de lógica aquí.
// Asegúrate que tu endpoint toggle-gift devuelva el nuevo estado.
app.post("/api/streamer/toggle-gift", async (req: Request, res: Response) => {
  try {
    const { userId, giftId } = req.body;
    const existing = await prisma.streamerGift.findFirst({
      where: { streamerId: userId, giftId: giftId }
    });

    if (existing) {
      await prisma.streamerGift.delete({ where: { id: existing.id } });
      res.json({ isActive: false }); // Devolvemos el estado explícito
    } else {
      await prisma.streamerGift.create({ data: { streamerId: userId, giftId: giftId } });
      res.json({ isActive: true });
    }
  } catch (error) { res.status(500).json({ error: "Error toggle" }); }
});

// ==========================================
// ELIMINAR REGALO (Endpoint que te faltaba)
// ==========================================
app.delete("/api/streamer/regalo/:giftId", async (req: Request, res: Response) => {
  try {
    const giftId = Number(req.params.giftId);
    await prisma.gift.delete({ where: { id: giftId } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "No se pudo eliminar" });
  }
});
// ===========================================
// ¡NUEVA LÓGICA PARA OBTENER DATOS DE LA TIENDA!
// ===========================================
app.get("/api/store/gifts", async (req: Request, res: Response) => {
  try {
    const gifts = await prisma.gift.findMany({
      orderBy: { costo: 'asc' }
    });
    res.json(gifts);
  } catch (error) {
    console.error("Error fetching gifts:", error);
    res.status(500).json({ error: "Error fetching gifts" });
  }
});

app.get("/api/store/packs", async (req: Request, res: Response) => {
  try {
    const packs = await prisma.coinPack.findMany({
      where: { isActive: true },
      orderBy: { amount: 'asc' }
    });
    res.json(packs);
  } catch (error) {
    console.error("Error fetching packs:", error);
    res.status(500).json({ error: "Error fetching packs" });
  }
});

// ===========================================
// ¡NUEVA LÓGICA PARA CANJEAR PUNTOS!
// ===========================================
app.post("/api/store/redeem", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body

    // 1. Validar que llegó el ID de usuario
    if (!userId) {
      return res.status(400).json({ error: "Falta el ID del usuario" })
    }

    // 2. Buscar al usuario en la BD
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    // 3. Verificar si tiene puntos suficientes
    if (user.puntos < 100) {
      return res.status(400).json({ error: "No tienes suficientes puntos para canjear." })
    }

    // 4. Calcular los nuevos saldos
    const nuevosPuntos = user.puntos - 100
    const nuevasMonedas = user.monedas + 10

    // 5. Actualizar la base de datos
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        puntos: nuevosPuntos,
        monedas: nuevasMonedas,
      },
    })

    // 6. Enviar al frontend el usuario actualizado
    const { password: _, ...userWithoutPassword } = updatedUser
    res.status(200).json(userWithoutPassword)

  } catch (error) {
    console.error("Error al canjear puntos:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// backend/index.ts
// ... (después del código de /redeem) ...

// ===========================================
// ¡NUEVA LÓGICA PARA ENVIAR REGALO!
// ===========================================
app.post("/api/store/gift", async (req: Request, res: Response) => {
  try {
    const { userId, costoRegalo, puntosRegalo } = req.body

    // 1. Validar
    if (!userId || costoRegalo === undefined || puntosRegalo === undefined) {
      return res.status(400).json({ error: "Faltan datos para el regalo" })
    }

    // 2. Buscar al usuario en la BD
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    // 3. Verificar si tiene monedas suficientes
    if (user.monedas < costoRegalo) {
      return res.status(400).json({ error: "No tienes suficientes monedas." })
    }

    // 4. Calcular los nuevos saldos
    const nuevasMonedas = user.monedas - costoRegalo
    const nuevosPuntos = user.puntos + puntosRegalo

    // 5. Actualizar la base de datos
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        monedas: nuevasMonedas,
        puntos: nuevosPuntos,
      },
    })

    // 6. Enviar al frontend el usuario actualizado
    const { password: _, ...userWithoutPassword } = updatedUser
    res.status(200).json(userWithoutPassword)

  } catch (error) {
    console.error("Error al enviar regalo:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// backend/index.ts
// ... (después del código de /gift) ...

// ===========================================
// ¡NUEVA LÓGICA PARA CREAR TRANSACCIÓN (PayU)!
// ===========================================

app.post("/api/pagos/crear-transaccion", async (req: Request, res: Response) => {
  try {
    const { userId, pack } = req.body

    // 1. Validar
    if (!userId || !pack) {
      return res.status(400).json({ error: "Faltan datos de la transacción" })
    }

    // 2. Buscar al usuario
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    // 3. Crear la transacción PENDIENTE en la BD
    const nuevaTransaccion = await prisma.transaction.create({
      data: {
        userId: userId,
        amount: pack.amount,
        price: parseFloat(pack.price.replace("S/ ", "")),
        points: pack.pointsAwarded,
        status: "PENDING", // ¡Importante!
      },
    })

    // 4. Devolver el ID de la transacción al frontend
    // Lo usaremos para verificar el pago después
    res.status(201).json({ transactionId: nuevaTransaccion.id })

  } catch (error) {
    console.error("Error al crear transacción:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})


// =======================================================
// ¡NUEVA LÓGICA PARA VERIFICAR PAGO Y DAR MONEDAS!
// =======================================================
// backend/index.ts

// REEMPLAZA EL ENDPOINT /verificar CON ESTE NUEVO /completar
// =======================================================
// LÓGICA UNIFICADA PARA COMPLETAR PAGO (Monedas y Subs)
// =======================================================
app.post("/api/pagos/completar-simulado", async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.body

    if (!transactionId) return res.status(400).json({ error: "Falta ID" })

    // 1. Buscar transacción
    // 1. Buscar transacción
    console.log("🔍 Verificando transacción:", transactionId);

    const transaccion = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaccion) {
      console.error("❌ Transacción no encontrada en BD");
      return res.status(404).json({ error: "Transacción no válida (No existe)" })
    }

    console.log("📄 Estado de transacción:", transaccion.status);

    if (transaccion.status !== "PENDING") {
      console.error("⚠️ Transacción ya procesada o cancelada:", transaccion.status);
      // Si ya está completada, devolvemos éxito para no confundir al usuario
      if (transaccion.status === "COMPLETED") {
        return res.json({ success: true, message: "Ya estaba completada" });
      }
      return res.status(400).json({ error: `Transacción inválida (Estado: ${transaccion.status})` })
    }

    // 2. Buscar usuario
    const user = await prisma.user.findUnique({ where: { id: transaccion.userId } })
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" })

    // 3. EJECUTAR LA LÓGICA SEGÚN EL TIPO
    if (transaccion.type === "SUBSCRIPTION" && transaccion.targetStreamerId) {
      // CASO A: SUSCRIPCIÓN
      await prisma.$transaction([
        // Crear la suscripción
        prisma.subscription.create({
          data: {
            subscriberId: user.id,
            streamerId: transaccion.targetStreamerId
          }
        }),
        // Dar puntos al usuario
        prisma.user.update({
          where: { id: user.id },
          data: { puntos: user.puntos + transaccion.points }
        }),
        // Marcar transacción como completada
        prisma.transaction.update({
          where: { id: transaccion.id },
          data: { status: "COMPLETED" }
        })
      ])

    } else {
      // CASO B: COMPRA DE MONEDAS NORMAL
      const nuevasMonedas = user.monedas + transaccion.amount
      const nuevosPuntos = user.puntos + transaccion.points

      await prisma.$transaction([
        // Actualizar saldo
        prisma.user.update({
          where: { id: user.id },
          data: { monedas: nuevasMonedas, puntos: nuevosPuntos }
        }),
        // Marcar transacción como completada
        prisma.transaction.update({
          where: { id: transaccion.id },
          data: { status: "COMPLETED" }
        })
      ])
    }

    // 4. RECUPERAR EL USUARIO FINAL ACTUALIZADO PARA DEVOLVERLO
    const finalUser = await prisma.user.findUnique({ where: { id: user.id } })

    if (!finalUser) return res.status(500).json({ error: "Error recuperando usuario" })

    const { password: _, ...userWithoutPassword } = finalUser

    // Devolvemos todo lo necesario para el frontend
    res.status(200).json({
      user: userWithoutPassword,
      transactionType: transaccion.type,
      streamerId: transaccion.targetStreamerId
    })

  } catch (error) {
    console.error("Error al completar pago:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})
// backend/index.ts

// ...

// ==================================================
// ¡NUEVA SECCIÓN: GESTIÓN DE REGALOS DEL STREAMER!
// ==================================================

// 1. Obtener todos los regalos disponibles y marcar cuáles tiene el streamer
app.get("/api/streamer/:userId/regalos", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // 1. Obtener TODOS los regalos disponibles (Default y Custom del usuario)
    const allGifts = await prisma.gift.findMany({
      where: {
        OR: [
          { ownerId: null }, // Regalos del sistema (Default)
          { ownerId: userId } // Regalos creados por él
        ]
      },
      // Traemos la info de StreamerGift para saber si está activo
      include: {
        streamers: {
          where: { streamerId: userId }
        }
      }
    });

    // 2. Mapeamos y determinamos el estado "isActive"
    const result = allGifts.map((gift) => {
      // Un regalo está activo si:
      // a) Es un regalo DEFAULT (ownerId: null) Y NO tiene una entrada de desactivación.
      // b) Es un regalo CUSTOM (ownerId: userId) Y tiene una entrada de activación (que se crea en el toggle).

      const isActive = gift.streamers.length > 0;

      return {
        ...gift,
        isActive: isActive, // Ya no forzamos, si existe en StreamerGift, está activo.
        isCustom: gift.ownerId === userId,
        // Eliminamos el array 'streamers' del objeto para el frontend
        streamers: undefined
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error al cargar regalos:", error);
    res.status(500).json({ error: "Error al cargar la configuración de regalos." });
  }
});

// ==========================================
// ¡NUEVO: CREAR REGALO PERSONALIZADO!
// ==========================================
app.post("/api/streamer/crear-regalo", async (req: Request, res: Response) => {
  try {
    const { userId, name, costo, emoji } = req.body

    // 1. Crear el regalo en la tabla maestra, marcando al dueño
    const newGift = await prisma.gift.create({
      data: {
        name,
        costo: parseInt(costo),
        emoji,
        ownerId: userId // ¡Importante! Este regalo le pertenece a él
      }
    })

    // 2. Automáticamente "activarlo" en su panel
    await prisma.streamerGift.create({
      data: {
        streamerId: userId,
        giftId: newGift.id
      }
    })

    res.status(201).json(newGift)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al crear regalo" })
  }
})

// ==========================================
// ¡NUEVO: SISTEMA DE SUSCRIPCIONES!
// ==========================================
app.post("/api/streamer/suscribirse", async (req: Request, res: Response) => {
  try {
    const { subscriberId, streamerId } = req.body

    // 1. Evitar auto-suscripción
    if (subscriberId === streamerId) {
      return res.status(400).json({ error: "No puedes suscribirte a ti mismo" })
    }

    // 2. Verificar si ya está suscrito
    const existingSub = await prisma.subscription.findFirst({
      where: { subscriberId, streamerId }
    })

    if (existingSub) {
      return res.status(400).json({ error: "Ya estás suscrito a este canal" })
    }

    // 3. Crear la suscripción
    await prisma.subscription.create({
      data: { subscriberId, streamerId }
    })

    // AQUÍ PODRÍAS RESTAR MONEDAS SI QUISIERAS (Lógica de pago)

    res.status(200).json({ message: "¡Suscripción exitosa!" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al suscribirse" })
  }
})

// OJO: Actualiza también el GET de regalos para que traiga los defaults + los propios
// En backend/index.ts, modifica el endpoint GET /api/streamer/:userId/regalos

app.get("/api/streamer/:userId/regalos", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    // Traer regalos del sistema Y del usuario
    const availableGifts = await prisma.gift.findMany({
      where: {
        OR: [{ ownerId: null }, { ownerId: userId }]
      }
    })

    // Traer cuáles activó el streamer
    const streamerGifts = await prisma.streamerGift.findMany({
      where: { streamerId: userId },
    })

    const result = availableGifts.map((gift) => {
      // LÓGICA MAESTRA:
      // Si ownerId es NULL (es default), SIEMPRE es active.
      // Si es custom, depende de si está en streamerGifts.
      const isDefault = gift.ownerId === null;
      const isActiveInPanel = streamerGifts.some((sg) => sg.giftId === gift.id);

      return {
        ...gift,
        isActive: isDefault ? true : isActiveInPanel, // Default siempre true
        isCustom: !isDefault
      }
    })

    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al cargar regalos" })
  }
})

// backend/index.ts

// ... (tus otras rutas) ...

// ==========================================
// ¡NUEVO: CONFIGURAR MENSAJE DE DESPEDIDA!
// ==========================================
app.post("/api/streamer/config", async (req: Request, res: Response) => {
  try {
    const { userId, message } = req.body
    await prisma.user.update({
      where: { id: userId },
      data: { goodbyeMessage: message }
    })
    res.json({ success: true })
  } catch (error) { res.status(500).json({ error: "Error al guardar" }) }
})

// ==========================================
// ¡NUEVO: CANCELAR SUSCRIPCIÓN (Con cálculo de tiempo)!
// ==========================================
app.post("/api/streamer/desuscribirse", async (req: Request, res: Response) => {
  try {
    const { subscriberId, streamerId } = req.body

    // 1. Buscar la suscripción para saber cuándo empezó
    const sub = await prisma.subscription.findFirst({
      where: { subscriberId, streamerId },
      include: { streamer: true } // Traemos datos del streamer para leer su mensaje
    })

    if (!sub) return res.status(404).json({ error: "No tienes suscripción activa" })

    // 2. Calcular tiempo (diferencia entre ahora y createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - sub.createdAt.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // 3. Borrar la suscripción
    await prisma.subscription.delete({ where: { id: sub.id } })

    // 4. Responder con el tiempo y el mensaje del streamer
    res.json({
      message: "Suscripción cancelada",
      daysSubscribed: diffDays,
      goodbyeMessage: sub.streamer.goodbyeMessage || "¡Hasta pronto!"
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al desuscribirse" })
  }
})

// ==========================================
// ¡NUEVO: ELIMINAR CUENTA (Delete Account)!
// ==========================================
app.delete("/api/auth/delete/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    // Gracias al "onDelete: Cascade" del schema, esto borrará TODO lo relacionado
    await prisma.user.delete({ where: { id: userId } })
    res.json({ message: "Cuenta eliminada permanentemente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "No se pudo eliminar la cuenta" })
  }
})

app.post("/api/streamer/check-sub", async (req, res) => {
  const { subscriberId, streamerId } = req.body
  const sub = await prisma.subscription.findFirst({ where: { subscriberId, streamerId } })
  res.json({ isSubscribed: !!sub })
})
// backend/index.ts

// ...

// ==========================================
// ¡NUEVO: ACTUALIZAR PERFIL (Nombre, Bio, Rol)!
// ==========================================
app.put("/api/user/update", async (req: Request, res: Response) => {
  try {
    console.log("🔵 Update User Endpoint Hit");
    console.log("📦 Body received:", req.body);

    const { userId, name, description, role } = req.body

    if (!userId) {
      console.error("🔴 Missing userId in body");
      return res.status(400).json({ error: "Falta el userId" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name,
        description: description,
        role: role
      }
    })

    console.log("✅ User updated successfully:", updatedUser.id);

    // Devolvemos el usuario limpio
    const { password: _, ...userWithoutPassword } = updatedUser
    res.json(userWithoutPassword)

  } catch (error) {
    console.error("❌ Error updating user:", error)
    res.status(500).json({ error: "Error al actualizar perfil" })
  }
})
// backend/index.ts (Añádelo al final)

// backend/index.ts

app.delete("/api/streamer/regalo/:giftId", async (req: Request, res: Response) => {
  try {
    const { giftId } = req.params;

    // --- CORRECCIÓN: Convertir a número ---
    const idToDelete = Number(giftId);
    if (isNaN(idToDelete)) {
      return res.status(400).json({ error: "ID de regalo inválido." });
    }
    // -------------------------------------

    await prisma.gift.delete({
      where: { id: idToDelete } // Usamos el ID convertido
    });
    res.json({ success: true, deletedId: idToDelete });

  } catch (error) {
    console.error("Error al eliminar:", error);
    res.status(500).json({ error: "No se pudo eliminar el regalo. Asegúrate de que exista." });
  }
});

// ==========================================
// ¡NUEVO: ENVIAR REGALO (Monedas -> XP)!
// ==========================================
app.post('/api/gifts/send', enviarRegalo);

// ==========================================


// ==========================================
// ¡NUEVO: PERFIL PÚBLICO (Hover Card)!
// ==========================================
// ==========================================
// ¡NUEVO: PERFIL PÚBLICO (Hover Card)!
// ==========================================
app.get("/api/users/public/:id", obtenerPerfilPublico);

// ==========================================
// ¡NUEVO: CONFIGURACIÓN DE STREAMER (Dificultad)!
// ==========================================
app.patch("/api/streamer/settings", updateStreamerSettings);

// ==========================================
// ¡NUEVO: PROGRESO DE COMUNIDAD (RF-30)!
// ==========================================
app.get("/api/users/community-progress", getCommunityProgress);

// ==========================================
// ¡NUEVO: HISTORIAL DE CHAT (GLOBAL)!
// ==========================================
app.get("/api/messages", async (req: Request, res: Response) => {
  try {
    const { streamId } = req.query; // <--- Leemos el parámetro opcional

    // Si hay streamId, filtramos. Si no, traemos todo (o lo que quieras)
    const whereClause = streamId ? { streamId: String(streamId) } : {};

    const messages = await prisma.message.findMany({
      where: whereClause, // <--- Aplicamos el filtro
      orderBy: { createdAt: 'asc' }, // Los más viejos primero
      include: {
        user: { select: { name: true } } // Traemos el nombre del usuario
      }
    });

    // Formateamos para el frontend
    const historial = messages.map((msg) => ({
      text: msg.text,
      userId: msg.userId,
      username: msg.user.name,
      // roomId: msg.streamId // Opcional
    }));

    res.json(historial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error cargando chat" });
  }
});

// --- Iniciar el Servidor ---
import http from 'http';
import { Server as SocketServer } from 'socket.io';

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ¡IMPORTANTE! Guardamos io en la app para usarlo en las rutas
app.set('io', io);


// Lógica de conexión de Socket.IO
io.on('connection', (socket) => {
  console.log('✅ Nuevo cliente conectado:', socket.id);

  // 1. EVENTO PARA ENTRAR A LA SALA
  socket.on('client:join_room', (roomId) => {
    socket.join(roomId);
    console.log(`🔌 Cliente ${socket.id} entró a la sala ${roomId} `);
  });

  // Cuando se recibe un mensaje del cliente
  socket.on('client:message', (data) => {
    console.log("📨 Mensaje recibido del cliente:", data);

    const { roomId, text, userId } = data;

    // A. ENVIAR SOLO A ESA SALA
    if (roomId) {
      io.to(roomId).emit('server:message', data);
    } else {
      io.emit('server:message', data);
    }

    // --- NUEVA FUNCIONALIDAD: SUMAR XP (Non-blocking) ---
    const idUsuario = userId || data.user_id || data.authorId;
    if (idUsuario) {
      prisma.user.update({
        where: { id: String(idUsuario) },
        data: { puntos: { increment: 1 } }
      })
        .then(() => console.log(`✨ +1 XP para ${idUsuario} `))
        .catch((err) => console.error("Error XP:", err));

      prisma.message.create({
        data: {
          text: text || data.text,
          userId: String(idUsuario),
          streamId: roomId
        }
      })
        .then(() => console.log("💾 Mensaje guardado en BD"))
        .catch((err) => console.error("Error guardando mensaje:", err));
    }
  });

  // Lógica para notificaciones en vivo (Legacy/Global)
  socket.on('gift_sent_notification', (data) => {
    io.emit('live_gift_alert', data);
  });

  // --- NUEVO: ALERTA DE REGALO PARA EL STREAMER (Premium) ---
  socket.on("client:gift_sent", (data) => {
    console.log("🎁 Regalo enviado:", data);

    if (data.roomId) {
      io.to(data.roomId).emit("server:gift_alert", data);
    } else {
      io.emit("server:gift_alert", data);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado');
  });
});

// ==========================================
// ¡NUEVO: ESTADO DE STREAM (TOLERANCIA A FALLOS)!
// ==========================================
app.post("/api/streams/status", updateStreamStatus);

// Arrancar el servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
  console.log(`🔓 Aceptando conexiones desde: ${FRONTEND_URL}`)
});

