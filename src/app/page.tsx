export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] px-6 py-10 text-[#1e211d]">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-3 border-b border-[#d9d8cf] pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#657064]">
            Next.js / Prisma / PostgreSQL
          </p>
          <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
            my-vercel-project
          </h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Local", "Docker Compose", "make up / make down"],
            ["Database", "PostgreSQL", "Prisma schema and migrations"],
            ["Deploy", "Vercel", "GitHub main branch"],
          ].map(([label, title, detail]) => (
            <div
              className="rounded-lg border border-[#d9d8cf] bg-white p-5 shadow-sm"
              key={label}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#657064]">
                {label}
              </p>
              <h2 className="mt-3 text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#5f645d]">{detail}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[#d9d8cf] bg-[#20251f] p-5 font-mono text-sm text-[#e8eadf]">
          <p>GET /api/health</p>
          <p className="mt-2 text-[#b7c2b0]">PostgreSQL connectivity check</p>
        </div>
      </section>
    </main>
  );
}
