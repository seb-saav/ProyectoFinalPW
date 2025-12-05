import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];

    if (!email) {
        console.error('❌ Por favor proporciona un email. Ejemplo: npx ts-node verify_user.ts usuario@email.com');
        process.exit(1);
    }

    console.log(`🔍 Buscando usuario con email: ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error('❌ Usuario no encontrado.');
        process.exit(1);
    }

    if (user.isVerified) {
        console.log('✅ El usuario YA estaba verificado.');
        process.exit(0);
    }

    await prisma.user.update({
        where: { email },
        data: {
            isVerified: true,
            verificationToken: null, // Limpiamos el token
        },
    });

    console.log(`✅ ¡ÉXITO! Usuario ${email} verificado manualmente.`);
    console.log('🚀 Ahora puedes iniciar sesión en la web.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
