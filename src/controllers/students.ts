import { db } from "@/db/db";
import { studentProps, TypedRequestBody, UserCreateProps } from "@/types/types";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { createUser } from "./users";

interface GetStudentsRequest extends Express.Request {
  params: {
    schoolId: string;
  };
}
// Helper function to convert date to ISO 8601 format
const convertDateToISO = (date: string | Date): Date => {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new Error("Invalid date format");
  }
  return parsedDate;
};

export async function createStudent(
  req: TypedRequestBody<studentProps>,
  res: Response
) {
  const data = req.body;

  const { admissionDate, birthCertificateNo, email, password, rollNo, dob } =
    data;
  data.admissionDate = convertDateToISO(admissionDate);
  data.dob = convertDateToISO(dob);

  try {
    // Check if the student already exists
    const existingEmail = await db.student.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return res.status(409).json({
        data: null,
        error: "student with this email already exists",
      });
    }

    const existingBCN = await db.student.findUnique({
      where: { birthCertificateNo },
    });
    if (existingBCN) {
      return res.status(409).json({
        data: null,
        error: "student with this birth certificate number already exists",
      });
    }

    const existingRollNo = await db.student.findUnique({
      where: { rollNo },
    });
    if (existingRollNo) {
      return res.status(409).json({
        data: null,
        error: "student with this roll number already exists",
      });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // First create the user account
    const userReq = {
      body: {
        email: data.email,
        password: data.password,
        role: "STUDENT",
        name: data.name,
        phone: data.phone,
        image: data.imgUrl,
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

    // Create new student with hashed password
    const newStudent = await db.student.create({
      data: {
        ...data,
        password: hashedPassword,
        userId: userRes.data?.id, // Link to the created user
      },
    });

    console.log(`Student created successfully`);

    return res.status(201).json({
      data: newStudent,
      error: null,
    });
  } catch (error) {
    console.error("Error creating student:", error);

    // More specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        return res.status(409).json({
          data: null,
          error: "A student with these details already exists",
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
      error: "An unexpected error occurred while creating the student",
    });
  }
}

export async function getNextSequence(req: GetStudentsRequest, res: Response) {
  const { schoolId } = req.params;
  try {
    const lastStudent = await db.student.findFirst({
      where: {
        schoolId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const stringSequence = lastStudent?.regNo.split("/")[3];
    const lastSequence = stringSequence ? parseInt(stringSequence) : 0;

    const nextSeq = lastSequence + 1;

    return res.status(200).json(nextSeq);
  } catch (error) {
    console.error("Error retrieving students:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}
export async function getStudents(
  req: TypedRequestBody<studentProps>,
  res: Response
) {
  try {
    const students = await db.student.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(students);
    // return res.status(200).json({
    //   data: students,
    //   error: null,
    // });
  } catch (error) {
    console.error("Error retrieving students:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}
export async function getStudentsBySchoolId(
  req: GetStudentsRequest,
  res: Response
) {
  const { schoolId } = req.params;
  try {
    const students = await db.student.findMany({
      where: {
        schoolId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(students);
    // return res.status(200).json({
    //   data: students,
    //   error: null,
    // });
  } catch (error) {
    console.error("Error retrieving students:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}
