export function isEducationalEmail(email: string) {
  if (email.length > 254) return false;

  const parts = email.split("@");
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  if (
    !local ||
    local.length > 64 ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local) ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..")
  ) {
    return false;
  }

  // Match complete education-domain suffixes, including .edu.ph and .edu.au.
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+edu(?:\.[a-z]{2})?$/i.test(
    domain,
  );
}
