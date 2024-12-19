import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { generateSlug } from "../utils/generateSlug";
import { TypedRequestBody, DepartmentProps } from "../types/types";

const prisma = new PrismaClient();

export async function createDepartment(
  req: TypedRequestBody<DepartmentProps>,
  res: Response
) {
  const data = req.body;

  // const slug = generateSlug(data.name);
  const slug = data.name;
  data.slug = slug;

  try {
    const existingDepartment = await prisma.department.findUnique({
      where: {
        slug: slug,
      },
    });

    if (existingDepartment) {
      return res.status(409).json({
        data: null,
        error: "Department Already Exists",
      });
    }

    // Create new department
    const newDepartment = await prisma.department.create({
      data: {
        name: data.name,
        slug: slug,
        budget: data.budget,
        budgetYear: data.budgetYear,
      },
    });

    console.log(`Department created successfully`);

    return res.status(201).json({
      data: newDepartment,
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

export async function getDepartments(req: TypedRequestBody<{}>, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        teachers: true,
        subjects: true,
      },
    });

    return res.status(200).json(departments);
  } catch (error) {
    console.error("Error retrieving departments:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}
export async function getBriefDepartments(
  req: TypedRequestBody<{}>,
  res: Response
) {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
      },
    });

    return res.status(200).json(departments);
  } catch (error) {
    console.error("Error retrieving departments:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}
