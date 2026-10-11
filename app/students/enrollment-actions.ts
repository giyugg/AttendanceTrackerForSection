
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type EnrollmentState = {
    success: boolean;
    message: string;
};

export async function changeEnrollmentStatus(
    _previousState: EnrollmentState,
    formData: FormData
): Promise<EnrollmentState> {
    const studentId = String(
        formData.get("student_id") ?? ""
    );

    const nextStatus = String(
        formData.get("next_status") ?? ""
    );

    const fail = (message: string): EnrollmentState => ({
        success: false,
        message,
    });

    // Validate the submitted information.
    const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(studentId)) {
        return fail("Invalid student record.");
    }

    if (!["active", "inactive"].includes(nextStatus)) {
        return fail("Invalid enrollment status.");
    }

    const supabase = await createClient();

    // 1. Verify authentication.
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return fail("Please sign in again.");
    }

    // 2. Verify administrator permissions.
    const { data: admin, error: adminError } =
        await supabase
            .from("app_admins")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();

    if (adminError || !admin) {
        return fail("Administrator access required.");
    }

    // 3. Find BSIS 2B-G2.
    const { data: classData, error: classError } =
        await supabase
            .from("classes")
            .select("id")
            .eq("code", "BSIS 2B-G2")
            .eq("academic_year", "2026-2027")
            .eq("term", "1st Semester")
            .maybeSingle();

    if (classError || !classData) {
        return fail("BSIS 2B-G2 not found.");
    }

    // 4. Update the existing enrollment.
    const { data: updated, error: updateError } =
        await supabase
            .from("class_enrollments")
            .update({
                is_active: nextStatus === "active",
            })
            .eq("class_id", classData.id)
            .eq("student_id", studentId)
            .select("student_id")
            .maybeSingle();

    if (updateError) {
        return fail(
            `Unable to update enrollment: ${updateError.message}`
        );
    }

    if (!updated) {
        return fail("Student enrollment not found.");
    }

    // 5. Refresh affected pages.
    revalidatePath("/students");
    revalidatePath("/dashboard");

    return {
        success: true,
        message:
            nextStatus === "active"
                ? "Student reactivated successfully!"
                : "Student deactivated successfully!",
    };
}