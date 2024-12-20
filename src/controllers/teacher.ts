import { db } from "@/db/db";
import { TeacherProps, TypedRequestBody } from "@/types/types";
import { Request, Response } from "express";
import bcrypt from "bcrypt";

const convertDateToISO = (date: string | Date): Date => {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new Error("Invalid date format");
  }
  return parsedDate;
};

export async function createTeacher(
  req: TypedRequestBody<TeacherProps>,
  res: Response
) {
  const data = req.body;

  const { NIN, email, password, dob, joinDate, yearsOfExperience } = data;

  data.yearsOfExperience = Number(yearsOfExperience);

  if (dob) data.dob = convertDateToISO(dob);
  if (joinDate) data.joinDate = convertDateToISO(joinDate);

  try {
    // Check if the teacher already exists
    const existingEmail = await db.teacher.findUnique({
      where: { email },
    });

    const existingNIN = await db.teacher.findUnique({
      where: { NIN },
    });

    if (existingEmail || existingNIN) {
      return res.status(409).json({
        data: null,
        error: "Teacher with this email or NIN already exists",
      });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate a unique employeeId
    const employeeId = await generateUniqueEmployeeId();

    // Create new Teacher with hashed password and employeeId
    const newTeacher = await db.teacher.create({
      data: {
        ...data,
        password: hashedPassword,
        employeeId,
        isActive: true,
      },
    });

    console.log(`Teacher created successfully`);

    return res.status(201).json({
      data: newTeacher,
      error: null,
    });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}

export async function getTeachers(req: Request, res: Response) {
  try {
    const teachers = await db.teacher.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        department: true,
      },
    });

    return res.status(200).json(teachers);
  } catch (error) {
    console.error("Error retrieving teachers:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}

async function generateUniqueEmployeeId(): Promise<string> {
  const prefix = "TCH";
  let uniqueId = "";
  let isUnique = false;

  while (!isUnique) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    uniqueId = `${prefix}${randomNum}`;

    const existingTeacher = await db.teacher.findUnique({
      where: { employeeId: uniqueId },
    });

    if (!existingTeacher) {
      isUnique = true;
    }
  }

  return uniqueId;
}

type AllocationRequestBody = {
  teacherId: string;
  allocations: {
    subjectId: string; // Subject ID
    classId: string; // Class (e.g., "JSS 1")
    sectionId: string; // section (e.g., "A")
  }[];
  schoolId: string;
};

export async function allocateSubjectsToTeacher(req: Request, res: Response) {
  const { teacherId, allocations, schoolId }: AllocationRequestBody = req.body;

  try {
    // Validate the teacher exists
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return res.status(404).json({
        data: null,
        error: "Teacher not found",
      });
    }

    const createdAllocations = [];

    for (const allocation of allocations) {
      const { subjectId, classId, sectionId } = allocation;

      // Check if the subject exists
      const subject = await db.subject.findUnique({
        where: { id: subjectId },
      });

      if (!subject) {
        return res.status(404).json({
          data: null,
          error: `Subject with id ${subjectId} not found`,
        });
      }

      // Fetch class and section names
      const classInfo = await db.class.findUnique({
        where: { id: classId },
      });
      const sectionInfo = await db.section.findUnique({
        where: { id: sectionId },
      });

      // Check if any allocation for the same class and section exists
      const existingAllocations = await db.teacherSubjectAllocation.findMany({
        where: {
          teacherId,
          classId,
          sectionId,
        },
      });

      // Log existing allocations for debugging
      console.log("Existing Allocations:", existingAllocations);

      // Check if the current subject is already allocated in the same class and section
      const isSubjectAlreadyAllocated = existingAllocations.some(
        (allocation) => allocation.subjectId === subjectId
      );

      if (isSubjectAlreadyAllocated) {
        return res.status(409).json({
          data: null,
          error: `The subject "${subject.name}" has already been allocated to teacher "${teacher.firstName} ${teacher.lastName}" for class "${classInfo?.title}" and section "${sectionInfo?.title}".`,
        });
      }

      // Create new allocation
      const newAllocation = await db.teacherSubjectAllocation.create({
        data: {
          teacherId,
          subjectId,
          classId,
          sectionId,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
          teacherImg: teacher.imageUrl || "/images/empty-box.png",
          subjectName: subject.name,
          className: classInfo?.title || "",
          sectionName: sectionInfo?.title || "",
          schoolId,
        },
      });

      createdAllocations.push(newAllocation);
    }

    return res.status(200).json({
      data: createdAllocations,
      error: null,
    });
  } catch (error) {
    console.error("Error allocating subjects:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}

export async function getTeacherAllocations(req: Request, res: Response) {
  try {
    const allocations = await db.teacherSubjectAllocation.findMany({
      orderBy: [{ classId: "asc" }, { sectionId: "asc" }],
    });

    // Group allocations by class and section
    const groupedAllocations: Record<string, typeof allocations> = {};
    for (const allocation of allocations) {
      const key = `${allocation.classId}-${allocation.sectionId}`;
      if (!groupedAllocations[key]) {
        groupedAllocations[key] = [];
      }
      groupedAllocations[key].push(allocation);
    }

    return res.status(200).json({
      data: {
        groupedAllocations,
      },
      error: null,
    });
  } catch (error) {
    console.error("Error retrieving teacher allocations:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred while fetching allocations",
    });
  }
}
