"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UID_COOKIE } from "@/lib/session";

export async function signIn(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const store = await cookies();
  store.set(UID_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/today");
}

export async function signOut() {
  const store = await cookies();
  store.delete(UID_COOKIE);
  redirect("/login");
}
