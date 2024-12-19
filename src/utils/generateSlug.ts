export function generateSlug(title: string | undefined): string {
  if (!title || typeof title !== "string") {
    throw new Error("Invalid title provided to generateSlug");
  }

  const slug = title.toLowerCase().replace(/\s+/g, "-");
  const cleanedSlug = slug.replace(/[^\w\-]/g, "");
  return cleanedSlug;
}
