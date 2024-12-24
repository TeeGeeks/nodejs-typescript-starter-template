import { db } from "@/db/db";
import { ContactProps, TypedRequestBody } from "@/types/types";
import { Request, Response } from "express";

interface GetStudentsRequest extends Express.Request {
  params: {
    schoolId: string;
  };
}

export async function getAnalyticsBySchoolId(
  req: GetStudentsRequest,
  res: Response
) {
  const { schoolId } = req.params;
  try {
    const students = await db.user.count({
      where: {
        schoolId,
        role: "STUDENT",
      },
    });
    const teachers = await db.user.count({
      where: {
        schoolId,
        role: "TEACHER",
      },
    });
    const parents = await db.user.count({
      where: {
        schoolId,
        role: "PARENT",
      },
    });
    const classes = await db.class.count({
      where: {
        schoolId,
      },
    });
    const results = [
      {
        title: "Students",
        count: students,
      },
      {
        title: "Teachers",
        count: teachers,
      },
      {
        title: "Parents",
        count: parents,
      },
      {
        title: "Classes",
        count: classes,
      },
    ];
    // return res.status(200).json({ contacts });
    return res.status(200).json(results);
  } catch (error) {
    console.error("Error retrieving contacts:", error);
    return res.status(500).json({
      data: null,
      error: "An unexpected error occurred",
    });
  }
}
