import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🧹 Limpiando transacciones inválidas...");

    // 1. Obtener todos los IDs de usuarios válidos
    const users = await prisma.user.findMany({ select: { id: true } });
    const validUserIds = new Set(users.map(u => u.id));

    // 2. Buscar transacciones con targetStreamerId que NO estén en la lista de usuarios
    // Nota: Prisma no tiene un "where not in" fácil para esto sin raw query o lógica manual si la relación no existe aún.
    // Como la relación falló, el campo es solo un String por ahora.

    const transactions = await prisma.transaction.findMany({
        where: { targetStreamerId: { not: null } }
    });

    let deletedCount = 0;

    for (const tx of transactions) {
        if (tx.targetStreamerId && !validUserIds.has(tx.targetStreamerId)) {
            console.log(`🗑️ Eliminando transacción ${tx.id} con targetStreamerId inválido: ${tx.targetStreamerId}`);
            await prisma.transaction.delete({ where: { id: tx.id } });
            deletedCount++;
        }
    }

    console.log(`✅ Limpieza completada. ${deletedCount} transacciones eliminadas.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
