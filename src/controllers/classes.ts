import { db } from "@/db/db";
import { ClassProps, SectionProps, TypedRequestBody } from "@/types/types";
import { generateSlug } from "@/utils/generateSlug";
import { Request, Response } from "express";

export async function createClasses(
  req: TypedRequestBody<ClassProps>,
  res: Response
) {
  const data = req.body;

  if (!data.title) {
    return res.status(400).json({
      data: null,
      error: "Title is required",
    });
  }

  const slug = generateSlug(data.title);
  data.slug = slug;
  try {
    const existingClass = await db.class.findUnique({
      where: {
        slug,
      },
    });

    if (existingClass) {
      return res.status(409).json({
        data: null,
        error: "Class Already Exists",
      });
    }

    // Create new class
    const newClass = await db.class.create({ data });

    console.log(`Class created successfully`);

    return res.status(201).json({
      data: newClass,
      error: null,
    });
  } catch (error) {
    console.error("Error creating class:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}

export async function getClasses(
  req: TypedRequestBody<ClassProps>,
  res: Response
) {
  try {
    const classes = await db.class.findMany({
      orderBy: {
        title: "asc",
      },
      include: {
        sections: {
          include: {
            students: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        students: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    const classesWithCounts = classes.map((cls) => ({
      ...cls,
      studentCount: cls._count.students,
      sections: cls.sections.map((section) => ({
        ...section,
        studentCount: section._count.students,
      })),
    }));

    return res.status(200).json(classesWithCounts);
  } catch (error) {
    console.error("Error retrieving classes:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}
export async function createSection(
  req: TypedRequestBody<SectionProps>,
  res: Response
) {
  const data = req.body;
  const { schoolId } = data;

  const slug = generateSlug(data.title);
  data.slug = slug;
  try {
    const existingSection = await db.section.findUnique({
      where: {
        slug,
      },
    });

    if (existingSection) {
      return res.status(409).json({
        data: null,
        error: "Section Already Exists",
      });
    }

    // Create new section
    // const newSection = await db.section.create({ data });

    const newSection = await db.section.create({
      data: {
        title: data.title,
        slug: data.slug,
        classId: data.classId, // Ensure this is included
        createdAt: new Date(),
        updatedAt: new Date(),
        schoolId,
      },
    });

    console.log(`Section created successfully`);

    return res.status(201).json({
      data: newSection,
      error: null,
    });
  } catch (error) {
    console.error("Error creating section:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}

export async function getSections(
  req: TypedRequestBody<SectionProps>,
  res: Response
) {
  try {
    const sections = await db.section.findMany({
      orderBy: {
        title: "asc",
      },
    });

    return res.status(200).json(sections);
  } catch (error) {
    console.error("Error retrieving sections:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}
