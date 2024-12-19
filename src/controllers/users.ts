import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import {
  TypedRequestBody,
  UserCreateProps,
  UserLoginProps,
} from "../types/types";
import {
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
} from "@/utils/tokens";

const prisma = new PrismaClient();

export async function createUser(
  req: TypedRequestBody<UserCreateProps>,
  res: Response
) {
  const data = req.body;

  const { email, password, role, name, phone, image, schoolId, schoolName } =
    data;

  try {
    const existingEmail = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingEmail) {
      return res.status(409).json({
        data: null,
        error: "Email Already Exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new department
    const newUser = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    console.log(`User created successfully`);

    return res.status(201).json({
      data: newUser,
      error: null,
    });
  } catch (error) {
    console.error("Error creating department:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}

export async function loginUser(
  req: TypedRequestBody<UserLoginProps>,
  res: Response
) {
  const data = req.body;

  const { email, password } = data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!existingUser) {
      return res.status(409).json({
        data: null,
        error: "Invalid Credentials",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
        data: null,
      });
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: existingUser.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = existingUser;

    return res.status(200).json({
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      },
      error: null,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "An error occurred during login",
      data: null,
    });
  }
}

// export async function getDepartments(req: TypedRequestBody<{}>, res: Response) {
//   try {
//     const departments = await prisma.department.findMany({
//       include: {
//         teachers: true,
//         subjects: true,
//       },
//     });

//     return res.status(200).json(departments);
//   } catch (error) {
//     console.error("Error retrieving departments:", error);
//     return res.status(500).json({
//       data: null,
//       error: "An unexpected error occurred",
//     });
//   }
// }
// export async function getBriefDepartments(
//   req: TypedRequestBody<{}>,
//   res: Response
// ) {
//   try {
//     const departments = await prisma.department.findMany({
//       orderBy: {
//         createdAt: "desc",
//       },
//       select: {
//         id: true,
//         name: true,
//       },
//     });

//     return res.status(200).json(departments);
//   } catch (error) {
//     console.error("Error retrieving departments:", error);
//     return res.status(500).json({
//       data: null,
//       error: "An unexpected error occurred",
//     });
//   }
// }
