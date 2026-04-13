"use client";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
      <div className="text-center space-y-4 px-6">
        <p className="text-6xl" style={{ color: "var(--color-dusty-rose)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>404</p>
        <p className="text-lg" style={{ color: "var(--color-dark)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          This page does not exist.
        </p>
        <button onClick={() => router.push("/dashboard")}
          className="px-6 py-2 rounded-xl text-sm"
          style={{ background: "linear-gradient(135deg, var(--color-plum), var(--color-mauve))", color: "var(--color-cream)", fontWeight: 600 }}>
          Go home
        </button>
      </div>
    </div>
  );
}