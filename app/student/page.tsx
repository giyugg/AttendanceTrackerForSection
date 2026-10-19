import RolePlaceholder from "@/components/role-placeholder";
import { requireRole } from "@/lib/access";

export default async function StudentPage() {
  const { role } = await requireRole(["admin", "student"]);

  return <RolePlaceholder role={role} workspace="student" />;
}
