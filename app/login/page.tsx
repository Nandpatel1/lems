import { Rocket, ArrowRight } from "lucide-react";
import { getProfiles } from "@/lib/data";
import { signIn } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const profiles = await getProfiles();

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="grid h-11 w-11 place-items-center rounded-hero bg-accent">
            <Rocket className="h-6 w-6 text-white" />
          </span>
          <h1 className="mt-3 text-[21px] font-medium text-ink">Launchpad</h1>
          <p className="mt-1 text-[13px] text-ink-2">Who&apos;s building today?</p>
        </div>

        <div className="flex flex-col gap-2">
          {profiles.map((p) => (
            <form key={p.id} action={signIn}>
              <input type="hidden" name="id" value={p.id} />
              <button
                type="submit"
                className="group flex w-full items-center gap-3 rounded-card border border-hair bg-surface px-4 py-3 text-left transition-colors duration-quick hover:border-accent hover:bg-accent-tint"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-tint text-[13px] font-medium text-accent-ink">
                  {p.initial}
                </span>
                <span className="flex-1 text-[14px] font-medium text-ink">{p.name}</span>
                <ArrowRight className="h-4 w-4 text-ink-3 transition-colors duration-quick group-hover:text-accent-ink" />
              </button>
            </form>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-ink-3">
          Internal team sign-in · password login comes later
        </p>
      </div>
    </div>
  );
}
