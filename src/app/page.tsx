import Portfolio from "@/features/Portfolio";

/**
 * The single user-visible route (sandbox gateway exposes `/` only — ADR-002).
 * `?view=quick` opens the Quick View overlay; `?mode=static|lite|story`
 * pins the experience mode. Both are honored at SSR so there is no flash.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const view = typeof sp.view === "string" ? sp.view : undefined;
  const mode = typeof sp.mode === "string" ? sp.mode : undefined;
  return (
    <Portfolio
      initialQuick={view === "quick"}
      initialMode={mode ?? null}
    />
  );
}
