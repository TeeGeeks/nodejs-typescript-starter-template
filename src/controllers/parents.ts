import { db } from "@/db/db";
import { ParentProps, TypedRequestBody, UserCreateProps } from "@/types/types";
import { Request, Response } from "express";

import bcrypt from "bcrypt";
import { createUser } from "./users";

export async function createParent(
  req: TypedRequestBody<ParentProps>,
  res: Response
) {
  const data = req.body;
  const { NIN, email, password } = data;

  try {
    // Check if the parent already exists
    const existingEmail = await db.parent.findUnique({
      where: { email },
    });

    const existingNIN = await db.parent.findUnique({
      where: { NIN },
    });

    if (existingEmail || existingNIN) {
      return res.status(409).json({
        data: null,
        error: "Parent with this email or NIN already exists",
      });
    }

    // First create the user account
    const userReq = {
      body: {
        email: data.email,
        password: data.password,
        role: "PARENT",
        name: `${data.lastName} ${data.firstName}`,
        phone: data.phone,
        image: data.parentImgUrl,
        schoolId: data.schoolId,
        schoolName: data.schoolName,
      },
    } as TypedRequestBody<UserCreateProps>;

    let userRes: any = {};
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          userRes = { ...data, statusCode: code };
          return data;
        },
      }),
    } as Response;

    // Create user first
    await createUser(userReq, mockRes);

    // Check if user creation was successful
    if (userRes.statusCode !== 201) {
      return res.status(400).json({
        data: null,
        error: userRes.error || "Failed to create user account",
      });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new Parent with hashed password
    const newParent = await db.parent.create({
      data: {
        ...data,
        password: hashedPassword,
        userId: userRes.data?.id, // Link to the created user
      },
    });

    console.log(`Parent created successfully`);

    return res.status(201).json({
      data: newParent,
      error: null,
    });
  } catch (error) {
    console.error("Error creating parent:", error);

    // More specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        return res.status(409).json({
          data: null,
          error: "A parent with these details already exists",
        });
      }

      if (error.message.includes("Foreign key constraint failed")) {
        return res.status(400).json({
          data: null,
          error: "Invalid school or user reference",
        });
      }
    }

    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred while creating the parent",
    });
  }
}

export async function getParents(
  req: TypedRequestBody<ParentProps>,
  res: Response
) {
  try {
    const parents = await db.parent.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(parents);
  } catch (error) {
    console.error("Error retrieving parents:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}
export async function getParentsBySchoolId(
  req: TypedRequestBody<ParentProps>,
  res: Response
) {
  try {
    const { schoolId } = req.params;
    const parents = await db.parent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      where: {
        schoolId,
      },
    });

    return res.status(200).json(parents);
  } catch (error) {
    console.error("Error retrieving parents:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}
