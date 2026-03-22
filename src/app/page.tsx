import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6 py-16"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(74, 37, 69, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(74, 37, 69, 0.1) 0%, transparent 40%),
          radial-gradient(ellipse at 10% 60%, rgba(155, 107, 141, 0.08) 0%, transparent 35%),
          radial-gradient(ellipse at 60% 100%, rgba(42, 26, 40, 0.12) 0%, transparent 30%),
          linear-gradient(to bottom, #FAF7F5, #F5EBE8, #FAF7F5)
        `
      }}
    >

      <div className="relative z-10 max-w-lg text-center">

        <p className="tracking-[0.35em] mb-8"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1rem",
            fontWeight: 500,
            background: "linear-gradient(135deg, #B8860B, #D4AF37, #E8C860, #D4AF37, #B8860B)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
          by AGNÉLIS
        </p>
        
        <img
          src="/noctua-logo.png"
          alt="Noctua"
          className="mx-auto mb-8"
          style={{ width: "clamp(200px, 40vw, 300px)", height: "auto" }}
        />

        <p className="text-plum text-2xl leading-relaxed mb-4 italic"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
          You are here because something brought you.
        </p>
        <p className="text-plum/70 text-lg leading-relaxed mb-12"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          A pattern you cannot break. A wound that will not close.<br />
          A question you keep asking.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs mx-auto mb-16">
          <Link href="/register" className="bg-plum text-cream py-3.5 px-6 rounded-lg text-lg hover:bg-dark transition-all duration-500 hover:shadow-[0_4px_24px_rgba(74,37,69,0.25)] text-center"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>
            Begin
          </Link>
          <Link href="/login" className="border border-dusty-rose text-plum py-3.5 px-6 rounded-lg text-lg hover:border-plum transition-all duration-500 text-center"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            I already have an account
          </Link>
        </div>

        <p className="text-plum/70 text-sm tracking-wider leading-relaxed"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Dreams speak in symbols.<br />
          Your unconscious knows what your conscious mind avoids.
        </p>

      </div>
    </main>
  );
}