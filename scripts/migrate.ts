import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function migrateData() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    let cleanedPhone = user.phone.replace(/[\s.-]/g, '').trim();
    if (!cleanedPhone.startsWith('+228')) {
      cleanedPhone = `+228${cleanedPhone.replace(/^\+?228/, '')}`;
    }

    const phoneRegex = /^\+228[1-9]\d{7}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      console.log(`Numéro invalide: ${user.phone}`);
      continue;
    }

    let updatedData: { phone?: string; password?: string } = {};
    if (cleanedPhone !== user.phone) {
      updatedData.phone = cleanedPhone;
    }

    if (!user.password.startsWith('$2a$')) {
      const hashedPassword = await bcrypt.hash('temp123', 10);
      updatedData.password = hashedPassword;
    }

    if (Object.keys(updatedData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updatedData,
      });
      console.log(`Mis à jour: ${user.phone} -> ${cleanedPhone}`);
    }
  }

  await prisma.$disconnect();
}

migrateData().catch(console.error);