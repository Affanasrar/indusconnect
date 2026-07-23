import { PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      name: RoleName.SUPER_ADMIN,
      description: "Full system access",
    },
    {
      name: RoleName.EMPLOYEE,
      description: "Can book shuttle, request travel, and submit expenses",
    },
    {
      name: RoleName.MANAGER,
      description: "Can approve or reject employee requests",
    },
    {
      name: RoleName.TRANSPORT_ADMIN,
      description: "Can manage vehicles, drivers, routes, and shuttle bookings",
    },
    {
      name: RoleName.ACCOMMODATION_ADMIN,
      description: "Can manage rooms and accommodation reservations",
    },
    {
      name: RoleName.DRIVER,
      description: "Can view manifest, complete checklist, and update trip status",
    },
    {
      name: RoleName.FINANCE_OFFICER,
      description: "Can review and approve expense claims",
    },
    {
      name: RoleName.SECURITY_OFFICER,
      description: "Can receive emergency and SOS alerts",
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.SUPER_ADMIN },
  });

  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  await prisma.user.upsert({
    where: { email: "admin@indusconnect.com" },
    update: {},
    create: {
      fullName: "System Admin",
      email: "admin@indusconnect.com",
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  const demoPassword = await bcrypt.hash("Demo@123", 10);

  const demoUsers = [
    { email: "employee@indusconnect.com", fullName: "Demo Employee", roleName: RoleName.EMPLOYEE },
    { email: "manager@indusconnect.com", fullName: "Demo Manager", roleName: RoleName.MANAGER },
    { email: "transport@indusconnect.com", fullName: "Demo Transport Admin", roleName: RoleName.TRANSPORT_ADMIN },
    { email: "accommodation@indusconnect.com", fullName: "Demo Accommodation Admin", roleName: RoleName.ACCOMMODATION_ADMIN },
    { email: "finance@indusconnect.com", fullName: "Demo Finance Officer", roleName: RoleName.FINANCE_OFFICER },
    { email: "driver@indusconnect.com", fullName: "Demo Driver", roleName: RoleName.DRIVER },
    { email: "security@indusconnect.com", fullName: "Demo Security Officer", roleName: RoleName.SECURITY_OFFICER },
  ];

  for (const user of demoUsers) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: user.roleName } });
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        fullName: user.fullName,
        email: user.email,
        password: demoPassword,
        roleId: role.id,
      },
    });
  }

  console.log("Database seeded successfully.");
  console.log("Admin Email: admin@indusconnect.com");
  console.log("Admin Password: Admin@123");
  console.log("Demo Users created with password: Demo@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });