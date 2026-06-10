import { LoginForm } from "@/components/LoginForm";

// The login screen. Middleware already bounces authenticated users to "/".
export default function LoginPage() {
  return (
    <div id="app" style={{ overflowY: "auto" }}>
      <LoginForm />
    </div>
  );
}
