"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

// Loading fallback for Suspense boundary
function LoginPageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🏀 Basketball Stats</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main login form component (uses useSearchParams)
function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { signIn, user, devLogin, isDevMode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const error = searchParams.get("error");

  // Redirect if already authenticated
  if (user) {
    router.push("/games");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await signIn(email);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Check your email for a magic link to sign in!");
    }

    setLoading(false);
  };

  const handleDevLogin = (role: "coach" | "scorer" | "viewer") => {
    const email =
      role === "coach"
        ? "coach@dev.local"
        : role === "scorer"
        ? "scorer@dev.local"
        : "viewer@dev.local";
    devLogin(email, role);
    router.push("/games");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🏀 Basketball Stats</CardTitle>
          <CardDescription>
            Sign in with your email to access the stats platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {error === "callback_failed" &&
                "Authentication failed. Please try again."}
              {error === "unexpected" &&
                "An unexpected error occurred. Please try again."}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="coach@team.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Use &apos;coach@&apos; for coach role, &apos;scorer@&apos; for
                scorer role, or any other email for viewer role
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email}
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 text-sm rounded ${
                message.includes("Error")
                  ? "text-red-600 bg-red-50 border border-red-200"
                  : "text-green-600 bg-green-50 border border-green-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* Development Mode Quick Login */}
          {isDevMode && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs font-semibold text-yellow-800 mb-2">
                Development Mode - Quick Login
              </p>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDevLogin("coach")}
                >
                  Login as Coach
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDevLogin("scorer")}
                >
                  Login as Scorer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDevLogin("viewer")}
                >
                  Login as Viewer
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Button asChild variant="outline" size="sm">
              <Link href="/">← Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Page wrapper with Suspense boundary (Next.js 15 requirement)
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
