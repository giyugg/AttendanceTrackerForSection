"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DeleteSubjectState = {
    success: boolean;
    message: string;
};

export async function deleteSubjectPermanently(
    _previousState: DeleteSubjectState,
    formData: FormData
): Promise<DeleteSubjectState> {
    const fail = (message: string): DeleteSubjectState => ({
        success: false,
        message,
    });

    // 1. Retrieve submitted information.
    const subjectId = String(
        formData.get("subject_id") ?? ""
    ).trim();

    const confirmation = String(
        formData.get("confirm_subject_code") ?? ""
    ).trim();

    // 2. Validate the subject ID.
    const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(subjectId)) {
        return fail("Invalid subject record.");
    }

    if (!confirmation) {
        return fail(
            "Please enter the subject code to confirm deletion."
        );
    }

    // 3. Connect to Supabase.
    const supabase = await createClient();

    // 4. Verify authentication.
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return fail("Please sign in again.");
    }

    // 5. Verify administrator permissions.
    const { data: admin, error: adminError } = await supabase
        .from("app_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (adminError || !admin) {
        return fail("Administrator access required.");
    }

    // 6. Execute secure database deletion.
    const { error: deleteError } = await supabase.rpc(
        "delete_g2_subject",
        {
            p_subject_id: subjectId,
            p_confirm_subject_code: confirmation,
        }
    );

    if (deleteError) {
        if (
            deleteError.message.includes(
                "Subject code confirmation does not match"
            )
        ) {
            return fail(
                "Subject code does not match. Deletion cancelled."
            );
        }

        if (
            deleteError.message.includes(
                "Cannot delete subject with existing attendance sessions"
            ) ||
            deleteError.code === "23503"
        ) {
            return fail(
                "This subject has existing attendance sessions. Deactivate it instead to preserve attendance history."
            );
        }

        if (deleteError.message.includes("Subject not found")) {
            return fail("Subject not found or already deleted.");
        }

        return fail(
            "Unable to delete subject. No changes were saved."
        );
    }

    // 7. Refresh affected pages.
    revalidatePath("/attendance/subjects");
    revalidatePath("/attendance");

    return {
        success: true,
        message: "Subject permanently deleted.",
    };
}
