import { db } from "@/db/db";
import { studentProps, TypedRequestBody } from "@/types/types";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
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
      where: {
        email,
      },
    });
    if (existingEmail) {
      return res.status(409).json({
        data: null,
        error: "student with this email already exists",
      });
    }

    const existingBCN = await db.student.findUnique({
      where: {
        birthCertificateNo,
      },
    });

    if (existingBCN) {
      return res.status(409).json({
        data: null,
        error: "student with this birth certificate number already exists",
      });
    }
    const existingRollNo = await db.student.findUnique({
      where: {
        rollNo,
      },
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

    // Create new student with hashed password
    const newstudent = await db.student.create({
      data: {
        ...data,
        password: hashedPassword, // Replace plain text password with hashed version
      },
    });

    console.log(`student created successfully`);

    return res.status(201).json(newstudent);
  } catch (error) {
    console.error("Error creating student:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}

export async function getNextSequence(
  req: TypedRequestBody<studentProps>,
  res: Response
) {
  try {
    const lastStudent = await db.student.findFirst({
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
