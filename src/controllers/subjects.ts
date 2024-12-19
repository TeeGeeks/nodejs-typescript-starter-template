import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { generateSlug } from "../utils/generateSlug";
import { TypedRequestBody, SubjectProps } from "../types/types";

const prisma = new PrismaClient();

export async function createSubject(
  req: TypedRequestBody<SubjectProps>,
  res: Response
) {
  const data = req.body;

  const slug = generateSlug(data.name);
  data.slug = slug;

  try {
    const existingSubject = await prisma.subject.findUnique({
      where: {
        slug: slug,
      },
    });

    if (existingSubject) {
      return res.status(409).json({
        data: null,
        error: "Subject Already Exists",
      });
    }

    // Create new Subject
    const newSubject = await prisma.subject.create({
      data,
    });

    console.log(`Subject created successfully`);

    return res.status(201).json({
      data: newSubject,
      error: null,
    });
  } catch (error) {
    console.error("Error creating Subject:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}

export async function getSubjects(req: TypedRequestBody<{}>, res: Response) {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.status(200).json(subjects);
  } catch (error) {
    console.error("Error retrieving subjects:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}
export async function getBriefSubjects(
  req: TypedRequestBody<{}>,
  res: Response
) {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
      },
    });

    return res.status(200).json(subjects);
  } catch (error) {
    console.error("Error retrieving subjects:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}
