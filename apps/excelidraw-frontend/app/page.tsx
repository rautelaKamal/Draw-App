import Link from "next/link";
import { HeroCanvas } from "@/components/HeroCanvas";

const tools = [
  ["Rectangle", "Drag to place a box."],
  ["Circle", "Drag out from where you start."],
  ["Pencil", "Freehand, captured as a path of points."],
  ["Eraser", "Click or drag across anything to remove it."],
];

export default function Home() {
  return (
    <main className="bg-[#0A0A0A] text-white">
      {/* Hero: the app's own canvas — black ground, white strokes — sketching
          its own primitives while you read. */}
      <section className="relative min-h-[92vh] overflow-hidden border-b border-[#212121]">
        <HeroCanvas />

        <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col px-6">
          <header className="flex items-center justify-between py-7">
            <span className="text-[15px] font-semibold tracking-tight">Draw App</span>
            <Link
              href="/signin"
              className="rounded-sm px-1 text-[15px] text-[#8A8A8A] underline-offset-4 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Sign in
            </Link>
          </header>

          <div className="flex flex-1 items-center">
            <div className="w-full pb-24">
              <h1 className="max-w-[13ch] text-[clamp(2.75rem,6.4vw,5rem)] font-semibold leading-[0.94] tracking-[-0.035em]">
                Draw together in a room.
              </h1>

              <p className="mt-7 max-w-[46ch] text-[1.0625rem] leading-relaxed text-[#9A9A9A]">
                Shapes appear on everyone&apos;s screen as they&apos;re drawn. Close the tab,
                come back, and the board is exactly where you left it.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-md bg-white px-5 py-3 text-[15px] font-medium text-[#0A0A0A] transition-colors hover:bg-[#E4E4E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Create an account
                </Link>
                <a
                  href="https://github.com/rautelaKamal/Draw-App"
                  className="rounded-md border border-[#2C2C2C] px-5 py-3 text-[15px] font-medium text-[#C4C4C4] transition-colors hover:border-[#4A4A4A] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Read the source
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The page inverts here: dark is the product, light is the explanation. */}
      <section className="bg-[#F7F7F5] text-[#151515]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
          <div className="grid gap-14 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-20">
            <h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
              Four tools, one shared board
            </h2>

            <div>
              <dl className="border-t border-[#DEDDD8]">
                {tools.map(([name, what]) => (
                  <div key={name} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-6 border-b border-[#DEDDD8] py-4">
                    <dt className="font-medium">{name}</dt>
                    <dd className="text-[#5C5C58]">{what}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-8 max-w-[62ch] leading-relaxed text-[#5C5C58]">
                Rooms are named, not numbered. Tell someone the name and they can open
                the same board — anyone signed in who knows it can join.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#E4E3DE] bg-[#F7F7F5] text-[#151515]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
          <div className="grid gap-14 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-20">
            <h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
              How it holds a drawing
            </h2>

            <div className="max-w-[62ch] space-y-5 leading-relaxed text-[#3C3C39]">
              <p>
                Nothing here stores a picture. Every shape you draw is appended to a log,
                and the board you see is what you get by replaying that log from the
                beginning.
              </p>
              <p>
                It means two people drawing at once never overwrite each other — both
                strokes are just appended. Erasing doesn&apos;t delete anything either: it
                adds a note saying a shape is gone, so erasing the same shape twice is
                harmless.
              </p>
              <p className="text-[#5C5C58]">
                The cost is that a long-lived board replays every stroke to load. Past a
                few thousand shapes it would need snapshots.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#F7F7F5] pb-16 text-[#151515]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#DEDDD8] pt-8 text-[14px] text-[#6C6C68]">
            <span>Built by Kamal Singh Rautela</span>
            <a
              href="https://github.com/rautelaKamal/Draw-App"
              className="rounded-sm px-1 underline underline-offset-4 transition-colors hover:text-[#151515] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#151515]"
            >
              github.com/rautelaKamal/Draw-App
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
