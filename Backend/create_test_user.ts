import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.create({
        data: {
            email: "teststreamer@example.com",
            name: "Test Streamer",
            password: "password123",
            role: "streamer",
            isVerified: true,
            verificationToken: "dummy-token",
            monedas: 1000,
            puntos: 0
        }
    });
    console.log(`User created: ${user.id}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
