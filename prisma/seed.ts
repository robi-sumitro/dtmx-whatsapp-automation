import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed minimal: placeholder untuk bukti bahwa koneksi DB & schema berjalan.
  console.log('Seed WA-CS dimulai. Tidak ada data wajib di v0.1.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });