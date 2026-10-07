import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { useAuth } from "@/hooks/context/authContext";
import { loginUser } from "@/services/authServices";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await loginUser({
        email,
        password,
      });

      if (data.user?.role !== "admin") {
        throw new Error(
          "Only admin can access this page"
        );
      }

      login(data.user, data.accessToken);

      navigate("/admin/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">

      <Card className="w-full max-w-md shadow-lg">

        <CardHeader className="text-center">

          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <LockKeyhole className="h-7 w-7 text-primary" />
          </div>

          <CardTitle className="text-2xl">
            Admin Login
          </CardTitle>

          <CardDescription>
            Login to manage your catalogue
          </CardDescription>

        </CardHeader>

        <CardContent>

          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>

              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />
            </div>


            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Password
              </label>

              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />
            </div>


            {/* Error */}
            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}


            {/* Login Button */}
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={loading}
            >
              <LogIn className="h-4 w-4" />

              {loading
                ? "Logging in..."
                : "Login"}
            </Button>

          </form>

        </CardContent>

      </Card>

    </div>
  );
};

export default AdminLogin;
