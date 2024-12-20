import { Department, UserRole } from "@prisma/client";
import { Request, Response } from "express";

export interface TypedRequestBody<T> extends Request {
  body: T;
}

// Types for the User creation properties
export type UserCreateProps = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone?: string | null;
  gender?: string | null;
  image?: string | null;
  schoolId?: string | null;
  schoolName?: string | null;
};
export type UserLoginProps = {
  email: string;
  password: string;
};

export type ContactProps = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  schoolName: string;
  schoolWebsite: string;
  students: number;
  role: string;
  media: string;
  message: string;
};

export type ClassProps = {
  title: string;
  slug: string;
  schoolId: string;
  userId: string;
};

export type SectionProps = {
  title: string;
  slug: string;
  classId: string; // Foreign key to Class
};

export type ParentProps = {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  relationship: string;
  NIN: string;
  phone: string;
  nationality: string;
  state: string;
  whatsappNo: string;
  religion: string;
  password: string;
  contactMethod: string;
  occupation: string;
  address: string;
  parentImgUrl: string;
  schoolId: string;
  userId: string;
};
export type studentProps = {
  name: string;
  surname: string;
  otherNames: string;
  email: string;
  parentId: string;
  classId: string;
  sectionId: string;
  parentName?: string;
  classTitle?: string;
  sessionTitle?: string;
  gender: string;
  dob: Date;
  regNo: string;
  phone: string;
  password: string;
  nationality: string;
  state: string;
  birthCertificateNo: string;
  religion: string;
  rollNo: string;
  admissionDate: Date;
  address: string;
  imgUrl: string;
  schoolId: string;
  userId: string;
};
export interface DepartmentProps {
  name: string;
  slug: string;
  budget?: number;
  budgetYear?: string;
  schoolId: string;
  userId: string;
}
export type SubjectProps = {
  slug: string;
  name: string;
  code: string;
  category: string;
  shortname: string;
  type: string;
  departmentId: string;
  departmentName: string;
  schoolId: string;
  userId: string;
};

export type TeacherProps = {
  firstName: string; // String
  lastName: string; // String
  email: string; // String (unique)
  phone?: string; // String
  gender: string; // String
  dob?: Date; // Optional DateTime
  country: string; // String (default "Nigeria")
  joinDate?: Date; // Optional DateTime
  employmentStatus?: string; // Optional String
  qualification?: string; // Optional String
  specialization?: string; // Optional String
  yearsOfExperience: number; // Int (default 0)
  NIN?: string;
  emergencyContact?: string; // Optional String
  religion?: string; // Optional String
  departmentId?: string | null;
  departmentName: string;
  //department?: Department; // Optional Department relation
  password: string; // String
  address?: string; // Optional String
  imageUrl?: string; // Optional String
  schoolId: string;
  userId: string;
};
