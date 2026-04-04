@echo off
echo.
echo ========================================
echo    Seeding Database
echo ========================================
echo.

echo Waiting for services to be ready...
timeout /t 5 /nobreak >nul

echo Running seed script...
docker exec gr1-backend-1 sh -c "cd /app && node -e \"
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const hashedPassword = bcrypt.hashSync('demo123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@advisor.ai' },
    update: {},
    create: {
      email: 'demo@advisor.ai',
      password: hashedPassword,
      name: 'Demo User'
    }
  });
  
  console.log('Created user:', user.email);
  
  await prisma.campaign.upsert({
    where: { id: 'demo-campaign-1' },
    update: {},
    create: {
      id: 'demo-campaign-1',
      name: 'My First Campaign',
      description: 'E-commerce marketing strategy',
      status: 'ACTIVE',
      userId: user.id
    }
  });
  
  console.log('Seed complete!');
  console.log('');
  console.log('Demo credentials:');
  console.log('Email: demo@advisor.ai');
  console.log('Password: demo123');
}

main()
  .catch(console.error)
  .finally(() => prisma.\$disconnect());
\""

echo.
echo Done!
pause
