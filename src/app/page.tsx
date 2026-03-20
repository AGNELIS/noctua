export default function Home() {
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

        <p className="text-sm tracking-[0.35em] mb-10"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: '#D4AF37' }}>
          by AGNÉLIS
        </p>

        <h1 className="text-plum mb-1"
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 'clamp(3.5rem, 8vw, 5.5rem)',
            fontWeight: 400,
            letterSpacing: '0.12em',
          }}>
          NOCTUA
        </h1>

        <div className="flex items-center justify-center gap-5 mt-5 mb-10">
          <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, #D4AF37)' }} />
          <span style={{ color: '#D4AF37', fontSize: '36px', fontWeight: 200, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>
            ∞
          </span>
          <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, #D4AF37)' }} />
        </div>

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
          <button className="bg-plum text-cream py-3.5 px-6 rounded-lg text-lg hover:bg-dark transition-all duration-500 hover:shadow-[0_4px_24px_rgba(74,37,69,0.25)]"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>
            Begin
          </button>
          <button className="border border-dusty-rose text-plum py-3.5 px-6 rounded-lg text-lg hover:border-plum transition-all duration-500"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            I already have an account
          </button>
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