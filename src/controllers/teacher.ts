import { db } from "@/db/db";
import { TeacherProps, TypedRequestBody, UserCreateProps } from "@/types/types";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { createUser } from "./users";

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

  // Convert and validate data
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

    // First create the user account
    const userReq = {
      body: {
        email: data.email,
        password: data.password,
        role: "TEACHER",
        name: `${data.lastName} ${data.firstName}`,
        phone: data.phone,
        image: data.imageUrl,
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

    // Generate a unique employeeId
    const employeeId = await generateUniqueEmployeeId();

    // Create new Teacher with hashed password and employeeId
    const newTeacher = await db.teacher.create({
      data: {
        ...data,
        password: hashedPassword,
        employeeId,
        isActive: true,
        userId: userRes.data?.id, // Link to the created user
      },
    });

    console.log(`Teacher created successfully`);

    return res.status(201).json({
      data: newTeacher,
      error: null,
    });
  } catch (error) {
    console.error("Error creating teacher:", error);

    // More specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        return res.status(409).json({
          data: null,
          error: "A teacher with these details already exists",
        });
      }

      if (error.message.includes("Foreign key constraint failed")) {
        return res.status(400).json({
          data: null,
          error: "Invalid school or user reference",
        });
      }

      if (error.message.includes("Invalid input data")) {
        return res.status(400).json({
          data: null,
          error:
            "Invalid input data. Please check the date formats and numeric values.",
        });
      }
    }

    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred while creating the teacher",
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
export async function getTeachersBySchoolId(req: Request, res: Response) {
  try {
    const { schoolId } = req.params;
    const teachers = await db.teacher.findMany({
      orderBy: {
        createdAt: "desc",
      },
      where: {
        schoolId,
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
    subjectId: string;
    classId: string;
    sectionId: string;
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

      // Check if any allocation for the same class and section exists in the same school
      const existingAllocations = await db.teacherSubjectAllocation.findMany({
        where: {
          teacherId,
          classId,
          sectionId,
          schoolId,
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
          error: `The subject "${subject.name}" has already been allocated to teacher "${teacher.firstName} ${teacher.lastName}" for class "${classInfo?.title}" and section "${sectionInfo?.title}" in this school.`,
        });
      }

      // Create new allocation
      const newAllocation = await db.teacherSubjectAllocation.create({
        data: {
          teacher: {
            connect: { id: teacherId },
          },
          subject: {
            connect: { id: subjectId },
          },
          classId,
          sectionId,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
          teacherImg: teacher.imageUrl || "/images/empty-box.png",
          subjectName: subject.name,
          className: classInfo?.title || "",
          sectionName: sectionInfo?.title || "",
          school: {
            connect: { id: schoolId },
          },
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
export async function getTeacherAllocationsBySchoolId(
  req: Request,
  res: Response
) {
  try {
    const { schoolId } = req.params;
    const allocations = await db.teacherSubjectAllocation.findMany({
      where: { schoolId },
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
