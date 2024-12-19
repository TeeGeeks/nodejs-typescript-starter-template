import { db } from "@/db/db";
import { ParentProps, TypedRequestBody } from "@/types/types";
import { Request, Response } from "express";

import bcrypt from "bcrypt";

export async function createParent(
  req: TypedRequestBody<ParentProps>,
  res: Response
) {
  const data = req.body;

  const { NIN, email, password } = data;

  try {
    // Check if the parent already exists
    const existingEmail = await db.parent.findUnique({
      where: {
        email,
      },
    });

    const existingNIN = await db.parent.findUnique({
      where: {
        NIN,
      },
    });

    if (existingEmail || existingNIN) {
      return res.status(409).json({
        data: null,
        error: "Parent with this email or NIN already exists",
      });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new Parent with hashed password
    const newParent = await db.parent.create({
      data: {
        ...data,
        password: hashedPassword, // Replace plain text password with hashed version
      },
    });

    console.log(`Parent created successfully`);

    return res.status(201).json({
      data: newParent,
      error: null,
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
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
