import Link from "next/link";

/** On-brand 404 with the two real paths back. */
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-start justify-center bg-canvas px-clamp text-ink">
      <p className="label-mono text-mute">404 / NOT FOUND</p>
      <h1 className="h2 mt-4 max-w-[16ch]">This page never shipped.</h1>
      <p className="body-copy mt-4 max-w-[40ch] text-mute">
        The story lives on the home page; the facts live in Quick View.
      </p>
      <div className="mt-8 flex gap-6">
        <Link href="/" className="label-mono underline decoration-amber underline-offset-4">
          ← Watch the story
        </Link>
        <Link href="/?view=quick" className="label-mono underline decoration-line underline-offset-4">
          Quick view →
        </Link>
      </div>
    </main>
  );
}
