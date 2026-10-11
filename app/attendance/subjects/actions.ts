
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SubjectState = {
    success: boolean;
    message: string;
};

async function getAdminClass() {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return null;

    const { data: admin, error: adminError } = await supabase
        .from("app_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (adminError) {
        throw new Error("Unable to verify administrator access.");
    }

    if (!admin) return null;

    const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id")
        .eq("code", "BSIS 2B-G2")
        .eq("academic_year", "2026-2027")
        .eq("term", "1st Semester")
        .maybeSingle();

    if (classError || !classData) {
        throw new Error("BSIS 2B-G2 could not be found.");
    }

    return {
        supabase,
        classId: classData.id,
    };
}

export async function addSubject(
    _previousState: SubjectState,
    formData: FormData
): Promise<SubjectState> {
    const fail = (message: string): SubjectState => ({
        success: false,
        message,
    });

    const code = String(formData.get("code") ?? "")
        .trim()
        .toUpperCase();

    const name = String(formData.get("name") ?? "").trim();

    if (code.length < 2 || code.length > 30) {
        return fail("Subject code must contain 2–30 characters.");
    }

    if (name.length < 2 || name.length > 120) {
        return fail("Subject name must contain 2–120 characters.");
    }

    const context = await getAdminClass();

    if (!context) {
        return fail("Only application administrators can add subjects.");
    }

    const { error } = await context.supabase
        .from("subjects")
        .insert({
            class_id: context.classId,
            code,
            name,
        });

    if (error) {
        if (error.code === "23505") {
            return fail("This subject code already exists for your class.");
        }

        return fail("Unable to save subject. Please try again.");
    }

    revalidatePath("/attendance/subjects");
    revalidatePath("/attendance");

    return {
        success: true,
        message: "Subject added successfully!",
    };
}

export async function setSubjectActive(
    formData: FormData
): Promise<void> {
    const subjectId = String(
        formData.get("subject_id") ?? ""
    );

    const status = String(
        formData.get("next_active") ?? ""
    );

    if (
        !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(subjectId) ||
        !["true", "false"].includes(status)
    ) {
        throw new Error("Invalid subject update request.");
    }

    const context = await getAdminClass();

    if (!context) {
        throw new Error("Administrator access required.");
    }

    const { data, error } = await context.supabase
        .from("subjects")
        .update({
            is_active: status === "true",
        })
        .eq("id", subjectId)
        .eq("class_id", context.classId)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        throw new Error("Unable to update subject status.");
    }

    revalidatePath("/attendance/subjects");
    revalidatePath("/attendance");
}