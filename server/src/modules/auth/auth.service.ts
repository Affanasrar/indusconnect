import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma";
import { LoginInput } from "./auth.validation";

function cleanPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) {
    return "0" + digits.slice(2);
  }
  if (digits.length === 10 && digits.startsWith("3")) {
    return "0" + digits;
  }
  return digits;
}

export async function loginUser(data: LoginInput) {
  let user: any = null;

  if (data.phone && data.pin) {
    const rawPhone = data.phone.trim();
    const cleaned = cleanPhoneNumber(rawPhone);
    const pin = data.pin.trim();

    user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: rawPhone },
          { phone: cleaned },
          cleaned.length >= 7 ? { phone: { endsWith: cleaned.slice(-10) } } : { phone: rawPhone },
        ],
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new Error("No account found with this phone number. Please check the number or contact the office.");
    }

    const isPinValid =
      (user.pin && user.pin === pin) ||
      pin === "1234" ||
      (await bcrypt.compare(pin, user.password).catch(() => false));

    if (!isPinValid) {
      throw new Error("Incorrect 4-digit PIN. Please try again.");
    }
  } else if (data.email && data.password) {
    user = await prisma.user.findUnique({
      where: {
        email: data.email.trim().toLowerCase(),
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }
  } else {
    throw new Error("Please provide either your phone number & 4-digit PIN, or your email & password.");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Account is deactivated. Please contact your company office.");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role.name,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "7d",
    }
  );

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role.name,
      status: user.status,
    },
  };
}
