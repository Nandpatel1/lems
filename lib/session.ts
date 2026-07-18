import { cookies } from "next/headers";

export const UID_COOKIE = "lems_uid";

/** The signed-in founder's id, or null if not signed in. */
export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get(UID_COOKIE)?.value ?? null;
}
