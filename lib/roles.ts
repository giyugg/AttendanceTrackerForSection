export type AppRole = "admin" | "president" | "secretary" | "student";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrator",
  president: "President",
  secretary: "Secretary",
  student: "Student",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: "Manage accounts, user roles, students, subjects, and attendance.",
  president: "View the class roster and reports, and manage attendance.",
  secretary: "View the class roster and reports, and manage attendance.",
  student: "Access the student dashboard while student features are being built.",
};

export function isAppRole(value: unknown): value is AppRole {
  return (
    value === "admin" ||
    value === "president" ||
    value === "secretary" ||
    value === "student"
  );
}

export function roleHome(role: AppRole): string {
  if (role === "admin") return "/dashboard";
  if (role === "president" || role === "secretary") return "/officer";
  return "/student";
}
