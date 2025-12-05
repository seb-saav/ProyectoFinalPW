// backend/prisma/seed.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

const regalos = [
  { name: "Rosa", costo: 5, emoji: "🌹" },
  { name: "Aplauso", costo: 10, emoji: "👏" },
  { name: "Corazón", costo: 25, emoji: "❤️" },
  { name: "Fuego", costo: 50, emoji: "🔥" },
  { name: "ULIMA GOAT", costo: 100, emoji: "🐐" },
  { name: "Diamante", costo: 250, emoji: "💎" },
  { name: "Cohete", costo: 500, emoji: "🚀" },
  { name: "Trofeo", costo: 750, emoji: "🏆" },
  { name: "Castillo", costo: 1000, emoji: "🏰" },
  { name: "León", costo: 2500, emoji: "🦁" },
]

const coinPacks = [
  { amount: 100, price: "S/ 5.00", pointsAwarded: 10 },
  { amount: 550, price: "S/ 25.00", pointsAwarded: 60 },
  { amount: 1200, price: "S/ 50.00", pointsAwarded: 150 },
]

async function main() {
  console.log(`Iniciando la creación de regalos...`)

  for (const regalo of regalos) {
    // Verificamos si ya existe para no duplicar
    const existingGift = await prisma.gift.findFirst({
      where: { name: regalo.name }
    })

    if (!existingGift) {
      const gift = await prisma.gift.create({
        data: regalo,
      })
      console.log(`Regalo creado: ${gift.name}`)
    } else {
      console.log(`Regalo ya existe: ${existingGift.name}`)
    }
  }

  console.log(`Iniciando la creación de CoinPacks...`)
  const existingPacks = await prisma.coinPack.count();
  if (existingPacks === 0) {
    await prisma.coinPack.createMany({
      data: coinPacks
    });
    console.log(`CoinPacks creados.`);
  } else {
    console.log(`CoinPacks ya existen, saltando.`);
  }

  console.log(`¡Seeding completado!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })