import RolePlaceholder from "@/components/role-placeholder";
import { requireRole } from "@/lib/access";

export default async function OfficerPage() {
  const { role } = await requireRole(["admin", "president", "secretary"]);

  return <RolePlaceholder role={role} workspace="officer" showAttendanceTools />;
}
