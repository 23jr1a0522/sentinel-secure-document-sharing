import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const users = [
    ['pranavi@sentinel.local', 'Pranavi', 'ADMIN', 'IT', 'Pranavi123'],
    ['admin@sentinel.local', 'Admin', 'MANAGER', 'Finance', 'Admin123'],
    ['pranu@sentinel.local', 'Pranu', 'EMPLOYEE', 'Finance', 'Pranu123'],
    ['harshi@sentinel.local', 'Harshi', 'EMPLOYEE', 'Engineering', 'Harshi123']
  ] as const;

  for (const [email, name, role, department, password] of users) {
    await prisma.user.upsert({
      where: { email },
      update: {
        name,
        role,
        department,
        passwordHash: await argon2.hash(password)
      },
      create: {
        email,
        name,
        role,
        department,
        passwordHash: await argon2.hash(password)
      }
    });
  }

  console.log('Development accounts seeded.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());