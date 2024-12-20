import { db } from "@/db/db";
import { ContactProps, TypedRequestBody } from "@/types/types";
import { Request, Response } from "express";

export async function createContact(
  req: TypedRequestBody<ContactProps>,
  res: Response
) {
  const data = req.body;

  const { email, schoolName } = data;

  try {
    // Check if the contact already exists
    const existingEmail = await db.contact.findUnique({
      where: {
        email,
      },
    });

    const existingSchool = await db.contact.findUnique({
      where: {
        schoolName,
      },
    });

    if (existingEmail || existingSchool) {
      return res.status(409).json({
        data: null,
        error: "A contact with this email or school already exists!",
      });
    }

    // Create new contact
    const newContact = await db.contact.create({ data });

    console.log(`Contact created successfully!`);
    return res.status(201).json({
      data: newContact,
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

export async function getContacts(
  req: TypedRequestBody<ContactProps>,
  res: Response
) {
  try {
    const contacts = await db.contact.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // return res.status(200).json({ contacts });
    return res.status(200).json({
      data: contacts,
      error: null,
    });
  } catch (error) {
    console.error("Error retrieving contacts:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}
