import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create default tenant
  console.log('📊 Creating default tenant...');
  const defaultTenant = await prisma.tenant.upsert({
    where: { code: 'eitek' },
    update: {},
    create: {
      name: 'EITEK Corporation',
      code: 'eitek',
      description: 'Default EITEK tenant',
      settings: {
        timezone: 'Asia/Ho_Chi_Minh',
        dateFormat: 'DD/MM/YYYY',
        language: 'vi',
      },
      isActive: true,
    },
  });
  console.log(`✓ Tenant created: ${defaultTenant.name}`);

  // 2. Create default roles
  console.log('👥 Creating default roles...');

  const systemAdminRole = await prisma.role.upsert({
    where: { name: 'System Administrator' },
    update: {},
    create: {
      name: 'System Administrator',
      description: 'Full system access',
      permissions: [
        'tenant.manage', 'tenant.view',
        'project.create', 'project.manage', 'project.view', 'project.delete',
        'site.create', 'site.manage', 'site.view',
        'area.create', 'area.manage', 'area.view',
        'device.create', 'device.manage', 'device.view', 'device.control', 'device.telemetry',
        'scada.create', 'scada.edit', 'scada.view', 'scada.control',
        'widget.create', 'widget.manage', 'widget.use',
        'user.create', 'user.manage', 'user.view',
      ],
      isActive: true,
    },
  });

  await prisma.role.upsert({
    where: { name: 'Tenant Administrator' },
    update: {},
    create: {
      name: 'Tenant Administrator',
      description: 'Tenant level administration',
      permissions: [
        'tenant.view',
        'project.create', 'project.manage', 'project.view',
        'site.create', 'site.manage', 'site.view',
        'area.create', 'area.manage', 'area.view',
        'device.create', 'device.manage', 'device.view', 'device.control',
        'scada.create', 'scada.edit', 'scada.view', 'scada.control',
        'widget.create', 'widget.manage', 'widget.use',
        'user.create', 'user.manage', 'user.view',
      ],
      isActive: true,
    },
  });

  await prisma.role.upsert({
    where: { name: 'Project Manager' },
    update: {},
    create: {
      name: 'Project Manager',
      description: 'Project level management',
      permissions: [
        'project.view',
        'site.create', 'site.manage', 'site.view',
        'area.create', 'area.manage', 'area.view',
        'device.create', 'device.manage', 'device.view', 'device.control',
        'scada.create', 'scada.edit', 'scada.view',
        'widget.use',
      ],
      isActive: true,
    },
  });

  await prisma.role.upsert({
    where: { name: 'Operator' },
    update: {},
    create: {
      name: 'Operator',
      description: 'Operations and monitoring',
      permissions: [
        'area.view',
        'device.view', 'device.telemetry', 'device.control',
        'scada.view', 'scada.control',
        'widget.use',
      ],
      isActive: true,
    },
  });

  await prisma.role.upsert({
    where: { name: 'Viewer' },
    update: {},
    create: {
      name: 'Viewer',
      description: 'Read-only access',
      permissions: [
        'area.view',
        'device.view', 'device.telemetry',
        'scada.view',
      ],
      isActive: true,
    },
  });

  console.log('✓ Roles created successfully');

  // 3. Create default admin user
  console.log('👤 Creating default admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@eitek.com' },
    update: {},
    create: {
      email: 'admin@eitek.com',
      firstName: 'System',
      lastName: 'Administrator',
      password: hashedPassword,
      tenantId: defaultTenant.id,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // Assign system admin role
  await prisma.userRoleMapping.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: systemAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: systemAdminRole.id,
    },
  });

  console.log(`✓ Admin user created: ${adminUser.email}`);

  // 4. Create default device types
  console.log('🔧 Creating default device types...');

  await prisma.deviceType.upsert({
    where: { name: 'Temperature Sensor' },
    update: {},
    create: {
      name: 'Temperature Sensor',
      description: 'Environmental temperature monitoring sensor',
      category: 'sensor',
      metadata: {
        telemetryKeys: ['temperature', 'humidity'],
        attributeKeys: ['firmwareVersion', 'batteryLevel'],
        rpcMethods: ['reset', 'calibrate'],
      },
      isActive: true,
    },
  });

  await prisma.deviceType.upsert({
    where: { name: 'Motor Controller' },
    update: {},
    create: {
      name: 'Motor Controller',
      description: 'Industrial motor controller',
      category: 'actuator',
      metadata: {
        telemetryKeys: ['speed', 'torque', 'power'],
        attributeKeys: ['motorType', 'maxSpeed'],
        rpcMethods: ['start', 'stop', 'setSpeed'],
      },
      isActive: true,
    },
  });

  await prisma.deviceType.upsert({
    where: { name: 'IoT Gateway' },
    update: {},
    create: {
      name: 'IoT Gateway',
      description: 'IoT communication gateway',
      category: 'gateway',
      metadata: {
        telemetryKeys: ['uptime', 'memoryUsage', 'cpuUsage'],
        attributeKeys: ['firmwareVersion', 'ipAddress'],
        rpcMethods: ['reboot', 'updateFirmware'],
      },
      isActive: true,
    },
  });

  console.log('✓ Device types created successfully');

  // 5. Create widget categories
  console.log('🎨 Creating widget categories...');

  await prisma.widgetCategory.createMany({
    data: [
      { name: 'Charts & Graphs', description: 'Data visualization widgets', icon: 'chart-line', order: 1, isActive: true },
      { name: 'Gauges & Meters', description: 'Gauge and meter widgets', icon: 'gauge', order: 2, isActive: true },
      { name: 'Controls', description: 'Control widgets (buttons, switches)', icon: 'toggle-switch', order: 3, isActive: true },
      { name: 'Indicators', description: 'Status and alarm indicators', icon: 'lightbulb', order: 4, isActive: true },
      { name: 'SCADA Symbols', description: 'Industrial SCADA symbols', icon: 'industry', order: 5, isActive: true },
    ],
    skipDuplicates: true,
  });

  console.log('✓ Widget categories created successfully');

  // 6. Create sample project structure
  console.log('🏗️ Creating sample project structure...');

  const sampleProject = await prisma.project.upsert({
    where: { tenantId_name: { tenantId: defaultTenant.id, name: 'Factory Demo' } },
    update: {},
    create: {
      name: 'Factory Demo',
      description: 'Demo factory project',
      settings: { type: 'manufacturing', industry: 'automotive' },
      tenantId: defaultTenant.id,
      isActive: true,
    },
  });

  const sampleSite = await prisma.site.upsert({
    where: { projectId_name: { projectId: sampleProject.id, name: 'Main Factory' } },
    update: {},
    create: {
      name: 'Main Factory',
      description: 'Main production facility',
      address: '123 Industrial Street, Ho Chi Minh City',
      coordinates: { lat: 10.8231, lng: 106.6297 },
      projectId: sampleProject.id,
      isActive: true,
    },
  });

  await prisma.area.upsert({
    where: { siteId_name: { siteId: sampleSite.id, name: 'Production Line 1' } },
    update: {},
    create: {
      name: 'Production Line 1',
      description: 'Main production line',
      metadata: { capacity: 1000, operatingHours: '24/7' },
      siteId: sampleSite.id,
      isActive: true,
    },
  });

  console.log('✓ Sample project structure created');

  console.log('');
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📋 Summary:');
  console.log(`   • Tenant: ${defaultTenant.name} (${defaultTenant.code})`);
  console.log(`   • Admin user: ${adminUser.email} / admin123`);
  console.log(`   • Roles: 5 default roles created`);
  console.log(`   • Device types: 3 sample types created`);
  console.log(`   • Project structure: Factory Demo created`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
