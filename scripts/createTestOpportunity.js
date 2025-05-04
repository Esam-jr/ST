const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['error']
});

async function main() {
  try {
    // Find a startup call to use
    const startupCall = await prisma.startupCall.findFirst();
    if (!startupCall) {
      console.log('No startup calls found.');
      return;
    }
    
    // Find an admin user to use
    const admin = await prisma.user.findFirst({ 
      where: { role: 'ADMIN' } 
    });
    if (!admin) {
      console.log('No admin users found.');
      return;
    }
    
    console.log('Using startup call:', startupCall.id);
    console.log('Using admin user:', admin.id);
    
    // Create opportunity 1: ACTIVE with future deadline
    const opportunity1 = await prisma.sponsorshipOpportunity.create({
      data: {
        title: 'Active Future Opportunity',
        description: 'This is an active opportunity with a future deadline',
        benefits: ['Visibility', 'Network access', 'Marketing', 'Product demos'],
        minAmount: 5000,
        maxAmount: 10000,
        currency: 'USD',
        status: 'ACTIVE',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        startupCallId: startupCall.id,
        createdById: admin.id
      }
    });
    
    // Create opportunity 2: ACTIVE with passed deadline
    const opportunity2 = await prisma.sponsorshipOpportunity.create({
      data: {
        title: 'Active Passed Deadline',
        description: 'This is an active opportunity with a passed deadline',
        benefits: ['Visibility', 'Network access', 'Marketing'],
        minAmount: 8000,
        maxAmount: 15000,
        currency: 'EUR',
        status: 'ACTIVE',
        deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        startupCallId: startupCall.id,
        createdById: admin.id
      }
    });
    
    // Create opportunity 3: INACTIVE with future deadline
    const opportunity3 = await prisma.sponsorshipOpportunity.create({
      data: {
        title: 'Inactive Opportunity',
        description: 'This is an inactive opportunity with a future deadline',
        benefits: ['Visibility', 'Marketing'],
        minAmount: 3000,
        maxAmount: 7000,
        currency: 'USD',
        status: 'INACTIVE',
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        startupCallId: startupCall.id,
        createdById: admin.id
      }
    });
    
    console.log('Created test opportunities:', {
      active_future: opportunity1,
      active_passed: opportunity2,
      inactive: opportunity3
    });
    
  } catch (error) {
    console.error('Error creating opportunities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 