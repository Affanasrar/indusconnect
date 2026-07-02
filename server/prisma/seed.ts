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

  console.log("Database seeded successfully.");
  console.log("Admin Email: admin@indusconnect.com");
  console.log("Admin Password: Admin@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });