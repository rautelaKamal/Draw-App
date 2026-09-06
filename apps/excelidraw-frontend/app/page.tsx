import Link from "next/link";
import { HeroCanvas } from "@/components/HeroCanvas";

const tools = [
  ["Rectangle", "Drag to place a box."],
  ["Circle", "Drag out from where you start."],
  ["Pencil", "Freehand, kept as the path your cursor took."],
  ["Eraser", "Click or drag across anything to remove it."],
];

export default function Home() {
  return (
    <main className="bg-[#FBFAF7] text-[#1C1B1A]">
      {/* The page is the whiteboard: warm paper, marker strokes, and the
          app's own primitives sketched behind the text. */}
      <section className="relative min-h-[90vh] overflow-hidden">
        <HeroCanvas />

        <div className="relative mx-auto flex min-h-[90vh] max-w-6xl flex-col px-6">
          <header className="flex items-center justify-between py-7">
            <span className="text-[15px] font-semibold tracking-tight">Draw App</span>
            <Link
              href="/signin"
              className="rounded-sm px-1 text-[15px] text-[#6B6862] underline-offset-4 transition-colors hover:text-[#1C1B1A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1C1B1A]"
            >
              Sign in
            </Link>
          </header>

          <div className="flex flex-1 items-center">
            <div className="w-full pb-24">
              <h1 className="max-w-[13ch] text-[clamp(2.75rem,6.4vw,5rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
                Draw together in a room.
              </h1>

              <p className="mt-7 max-w-[44ch] text-[1.0625rem] leading-relaxed text-[#5F5C56]">
                Shapes appear on everyone&apos;s screen as they&apos;re drawn. Close the tab,
                come back, and the board is exactly where you left it.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-md bg-[#1C1B1A] px-5 py-3 text-[15px] font-medium text-[#FBFAF7] transition-colors hover:bg-[#35322E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1C1B1A]"
                >
                  Create an account
                </Link>
                <a
                  href="https://github.com/rautelaKamal/Draw-App"
                  className="rounded-md border border-[#D8D4CB] px-5 py-3 text-[15px] font-medium text-[#4A4741] transition-colors hover:border-[#1C1B1A] hover:text-[#1C1B1A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1C1B1A]"
                >
                  Read the source
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#E4E1DA]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
          <div className="grid gap-14 md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] md:gap-20">
            <h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
              Four tools, one shared board
            </h2>

            <div>
              <dl className="border-t border-[#E4E1DA]">
                {tools.map(([name, what]) => (
                  <div key={name} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-6 border-b border-[#E4E1DA] py-4">
                    <dt className="font-medium">{name}</dt>
                    <dd className="text-[#5F5C56]">{what}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-8 max-w-[62ch] leading-relaxed text-[#5F5C56]">
                Rooms are named, not numbered. Tell someone the name and they can open
                the same board — anyone signed in who knows it can join.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#E4E1DA]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
          <div className="grid gap-14 md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] md:gap-20">
            <h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
              How it holds a drawing
            </h2>

            <div className="max-w-[62ch] space-y-5 leading-relaxed text-[#3B3833]">
              <p>
                Nothing here stores a picture. Every shape you draw is appended to a log,
                and the board you see is what you get by replaying that log from the
                beginning.
              </p>
              <p>
                Two people drawing at once never overwrite each other — both strokes are
                just appended. Erasing doesn&apos;t delete anything either: it adds a note
                saying a shape is gone, so erasing the same shape twice is harmless.
              </p>
              <p className="text-[#5F5C56]">
                The cost is that a long-lived board replays every stroke to load. Past a
                few thousand shapes it would need snapshots.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E4E1DA] pt-8 text-[14px] text-[#6B6862]">
            <span>Built by Kamal Singh Rautela</span>
            <a
              href="https://github.com/rautelaKamal/Draw-App"
              className="rounded-sm px-1 underline underline-offset-4 transition-colors hover:text-[#1C1B1A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C1B1A]"
            >
              github.com/rautelaKamal/Draw-App
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
