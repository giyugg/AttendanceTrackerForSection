export type AccountNameParts = {
  firstName: string;
  middleInitial: string;
  lastName: string;
};

export type AccountProfileName = {
  first_name?: unknown;
  middle_initial?: unknown;
  last_name?: unknown;
  full_name?: unknown;
};

function normalizeNameText(value: unknown): string | null {
  if (typeof value !== "string" || /\p{Cc}/u.test(value)) return null;
  return value.trim().replace(/\s+/gu, " ");
}

/** Profile names are display text only; they never determine account access. */
export function normalizeNameParts({ firstName, middleInitial, lastName }: {
  firstName: unknown;
  middleInitial: unknown;
  lastName: unknown;
}): AccountNameParts | null {
  const first = normalizeNameText(firstName);
  const last = normalizeNameText(lastName);
  const middle = middleInitial == null ? "" : normalizeNameText(middleInitial);
  if (!first || first.length > 80 || !last || last.length > 80 || middle === null) return null;

  const initial = middle.toUpperCase().replace(/\.$/, "");
  if (initial !== "" && !/^[A-Z]$/.test(initial)) return null;

  const parts = { firstName: first, middleInitial: initial, lastName: last };
  return formatAccountName(parts).length <= 120 ? parts : null;
}

export function formatAccountName({ firstName, middleInitial, lastName }: AccountNameParts): string {
  return [firstName, middleInitial ? `${middleInitial}.` : "", lastName].filter(Boolean).join(" ");
}

export function accountDisplayName(profile: AccountProfileName | null | undefined, email?: string | null): string {
  if (profile) {
    const parts = normalizeNameParts({ firstName: profile.first_name, middleInitial: profile.middle_initial, lastName: profile.last_name });
    if (parts) return formatAccountName(parts);

    const legacyName = normalizeNameText(profile.full_name);
    if (legacyName && legacyName.length <= 120) return legacyName;
  }
  return email?.trim() || "Account";
}
