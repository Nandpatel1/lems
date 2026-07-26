import { redirect } from "next/navigation";

// The Readiness tab was removed. Keep the route redirecting so old links land on Today.
export default function ReadinessPage() {
  redirect("/today");
}
