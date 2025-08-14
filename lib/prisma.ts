// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Réutiliser l'instance en développement
// Évite de créer trop d'instances en mode hot reload
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;