import Image from "next/image";
import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col justify-center bg-warm-bg px-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image src="/logo.png" alt="" width={64} height={64} className="mb-3 rounded-2xl" />
        <h1 className="font-heading text-3xl font-semibold text-ink">nevi</h1>
        <p className="mt-1 text-sm text-ink/60">Crea tu cuenta familiar</p>
      </div>
      <AuthForm mode="signup" />
    </div>
  );
}
