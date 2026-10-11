"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DeleteSessionState = {
    success: boolean;
    message: string;
};

export async function deleteSessionPermanently(
    _previousState: DeleteSessionState,
    formData: FormData
): Promise<DeleteSessionState> {
    const fail = (message: string): DeleteSessionState => ({
        success: false,
        message,
    });

    // 1. Read submitted values.
    const sessionId = String(
        formData.get("session_id") ?? ""
    ).trim();

    const confirmation = String(
        formData.get("confirmation") ?? ""
    ).trim();

    // 2. Validate the session ID.
    const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(sessionId)) {
        return fail("Invalid attendance session.");
    }

    // 3. Require exact confirmation.
    if (confirmation !== "DELETE") {
        return fail('Type "DELETE" to confirm permanent deletion.');
    }

    // 4. Connect to Supabase.
    const supabase = await createClient();

    // 5. Verify authentication.
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return fail("Please sign in again.");
    }

    // 6. Verify administrator permissions.
    const { data: admin, error: adminError } = await supabase
        .from("app_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (adminError || !admin) {
        return fail("Administrator access required.");
    }

    // 7. Execute atomic database deletion.
    const { error: deleteError } = await supabase.rpc(
        "delete_g2_attendance_session",
        {
            p_session_id: sessionId,
            p_confirmation: confirmation,
        }
    );

    if (deleteError) {
        if (
            deleteError.message.includes(
                "Attendance session not found"
            )
        ) {
            return fail("Session not found or already deleted.");
        }

        return fail(
            "Unable to delete attendance session. No changes were saved."
        );
    }

    // 8. Refresh affected pages.
    revalidatePath("/attendance");
    revalidatePath("/attendance/history");
    revalidatePath("/dashboard");
    revalidatePath("/students");
    revalidatePath("/students/[id]/attendance", "page");

    return {
        success: true,
        message: "Attendance session permanently deleted.",
    };
}