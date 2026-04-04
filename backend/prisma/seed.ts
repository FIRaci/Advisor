import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@advisor.ai' },
    update: {},
    create: {
      email: 'demo@advisor.ai',
      password: hashedPassword,
      name: 'Demo User'
    }
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create sample campaign
  const campaign = await prisma.campaign.upsert({
    where: { id: 'demo-campaign-1' },
    update: {},
    create: {
      id: 'demo-campaign-1',
      name: 'My First Campaign',
      description: 'E-commerce marketing strategy for fashion brand',
      status: 'ACTIVE',
      userId: demoUser.id,
      quizData: {
        business: 'ecommerce',
        audience: 'b2c',
        goal: 'sales',
        budget: 'medium'
      }
    }
  });

  console.log('✅ Created sample campaign:', campaign.name);

  // Create sample chat messages
  await prisma.chat.createMany({
    skipDuplicates: true,
    data: [
      {
        role: 'USER',
        content: 'How can I improve my social media presence?',
        userId: demoUser.id,
        campaignId: campaign.id
      },
      {
        role: 'ASSISTANT', 
        content: `Great question! Here are my top recommendations for improving your social media presence:

## 1. Content Strategy
- Post consistently (3-5 times per week)
- Mix content types: images, videos, stories, reels
- Use trending audio and hashtags

## 2. Engagement
- Respond to comments within 2 hours
- Ask questions in your captions
- Run polls and Q&A sessions

## 3. Paid Advertising
- Start with $10-20/day on Instagram/Facebook ads
- Target lookalike audiences
- A/B test your creatives

Would you like me to create a detailed content calendar for you?`,
        userId: demoUser.id,
        campaignId: campaign.id
      }
    ]
  });

  console.log('✅ Created sample chat messages');
  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('📝 Demo credentials:');
  console.log('   Email: demo@advisor.ai');
  console.log('   Password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
