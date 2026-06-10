import { AuthForm } from '@/components/openauth/auth-form';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <AuthForm mode="signin" />
    </div>
  );
}
