import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clean existing seed data ──────────────────────────────────────────────
  await prisma.riderDelivery.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stream.deleteMany();
  await prisma.product.deleteMany();
  await prisma.smartAddress.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ─────────────────────────────────────────────────────────────────
  const buyer = await prisma.user.create({
    data: {
      phone: '+254700000001',
      name: 'Amara Osei',
      roles: ['BUYER', 'RESIDENT'],
      isVerified: true,
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
  });

  const seller = await prisma.user.create({
    data: {
      phone: '+254700000002',
      name: 'Fatima Diallo',
      roles: ['SELLER'],
      isVerified: true,
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
  });

  const rider = await prisma.user.create({
    data: {
      phone: '+254700000003',
      name: 'Kofi Mensah',
      roles: ['RIDER'],
      isVerified: true,
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
  });

  const admin = await prisma.user.create({
    data: {
      phone: '+254700000004',
      name: 'Admin User',
      roles: ['BUYER', 'SELLER', 'RESIDENT'],
      isVerified: true,
      avatar: 'https://i.pravatar.cc/150?img=4',
    },
  });

  console.log('✅ Users created:', buyer.name, seller.name, rider.name, admin.name);

  // ── SmartAddresses ────────────────────────────────────────────────────────
  const addr1 = await prisma.smartAddress.create({
    data: {
      userId: buyer.id,
      code: 'BXR-204-17',
      label: 'Home',
      lat: -1.2921,
      lng: 36.8219,
      landmark: 'Opposite KFC Junction, Westlands',
      gateColor: 'Blue',
      floor: 'Ground',
      arrivalInstructions: 'Call on arrival. Blue gate has intercom.',
      deliveryNotes: 'Leave with guard if not home',
      confidenceScore: 92,
      isPrimary: true,
      photos: [],
    },
  });

  const addr2 = await prisma.smartAddress.create({
    data: {
      userId: buyer.id,
      code: 'LGS-881-44',
      label: 'Office',
      lat: 6.4698,
      lng: 3.5852,
      landmark: 'Lekki Phase 1, after Chevron roundabout',
      gateColor: 'Black',
      floor: '3rd Floor',
      arrivalInstructions: 'Enter main gate, take elevator to 3rd floor.',
      deliveryNotes: 'Weekdays only, 9am–5pm',
      confidenceScore: 78,
      isPrimary: false,
      photos: [],
    },
  });

  const addr3 = await prisma.smartAddress.create({
    data: {
      userId: seller.id,
      code: 'ACC-552-09',
      label: 'Store',
      lat: 5.6037,
      lng: -0.187,
      landmark: 'Makola Market, Gate 4, stall B12',
      gateColor: 'Yellow',
      arrivalInstructions: 'Ask for Fatima at Gate 4 entrance',
      deliveryNotes: 'Pickup available Mon–Sat',
      confidenceScore: 88,
      isPrimary: true,
      photos: [],
    },
  });

  console.log('✅ SmartAddresses created:', addr1.code, addr2.code, addr3.code);

  // ── Products ──────────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sellerId: seller.id,
        name: 'Ankara Wrap Dress',
        description: 'Vibrant hand-cut Ankara fabric wrap dress. One size fits most.',
        price: 3500,
        currency: 'KES',
        category: 'Fashion',
        stockCount: 20,
        totalSold: 45,
        isActive: true,
        photos: [],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller.id,
        name: 'Shea Butter Moisturizer 200ml',
        description: 'Pure raw shea butter sourced from Northern Ghana. Unscented.',
        price: 1200,
        currency: 'KES',
        category: 'Beauty',
        stockCount: 100,
        totalSold: 210,
        isActive: true,
        photos: [],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller.id,
        name: 'Kente Tote Bag',
        description: 'Handwoven kente-strip tote, fully lined. Fits A4 + laptop.',
        price: 2200,
        currency: 'KES',
        category: 'Accessories',
        stockCount: 15,
        totalSold: 30,
        isActive: true,
        photos: [],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller.id,
        name: 'Moringa Powder 100g',
        description: 'Organic moringa leaf powder, air-dried. High in iron & vitamins.',
        price: 800,
        currency: 'KES',
        category: 'Health',
        stockCount: 200,
        totalSold: 150,
        isActive: true,
        photos: [],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller.id,
        name: 'Beaded Maasai Bracelet Set',
        description: 'Set of 3 hand-beaded Maasai bracelets. Adjustable sizing.',
        price: 650,
        currency: 'KES',
        category: 'Accessories',
        stockCount: 50,
        totalSold: 88,
        isActive: true,
        photos: [],
      },
    }),
  ]);

  console.log('✅ Products created:', products.length);

  // ── Stream ────────────────────────────────────────────────────────────────
  const stream = await prisma.stream.create({
    data: {
      sellerId: seller.id,
      title: 'Sunday Fashion Drop 🎉 New Ankara styles!',
      category: 'Fashion',
      status: 'ENDED',
      viewerCount: 340,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  });

  console.log('✅ Stream created:', stream.title);

  // ── Orders ────────────────────────────────────────────────────────────────
  const order1 = await prisma.order.create({
    data: {
      buyerId: buyer.id,
      sellerId: seller.id,
      productId: products[0].id,
      quantity: 1,
      totalAmount: 3500,
      currency: 'KES',
      smartAddressCode: addr1.code,
      deliveryFee: 200,
      status: OrderStatus.DELIVERED,
      streamId: stream.id,
      paymentStatus: PaymentStatus.PAID,
      paymentReference: 'FLW-MOCK-abc123',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      buyerId: buyer.id,
      sellerId: seller.id,
      productId: products[1].id,
      quantity: 2,
      totalAmount: 2400,
      currency: 'KES',
      smartAddressCode: addr1.code,
      deliveryFee: 200,
      status: OrderStatus.IN_TRANSIT,
      riderId: rider.id,
      streamId: stream.id,
      paymentStatus: PaymentStatus.PAID,
      paymentReference: 'FLW-MOCK-def456',
    },
  });

  console.log('✅ Orders created:', order1.id, order2.id);

  // ── RiderDelivery for order2 ──────────────────────────────────────────────
  await prisma.riderDelivery.create({
    data: {
      riderId: rider.id,
      orderId: order2.id,
      currentLat: -1.2864,
      currentLng: 36.8172,
      status: 'PICKED_UP',
      pickedUpAt: new Date(Date.now() - 20 * 60 * 1000),
    },
  });

  console.log('✅ RiderDelivery created for in-transit order');
  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('Test credentials:');
  console.log('  Buyer/Resident  → phone: +254700000001  roles: [BUYER, RESIDENT]');
  console.log('  Seller          → phone: +254700000002  roles: [SELLER]');
  console.log('  Rider           → phone: +254700000003  roles: [RIDER]');
  console.log('  Admin           → phone: +254700000004  roles: [BUYER, SELLER, RESIDENT]');
  console.log('  SmartAddress codes: BXR-204-17, LGS-881-44, ACC-552-09');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
