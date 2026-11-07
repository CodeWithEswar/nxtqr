"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
} from "@nxtqr/ui";
import { LoginSchema } from "@nxtqr/validation";
import { ChevronLeftIcon } from "@nxtqr/icons";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === "email") fieldErrors.email = issue.message;
        if (issue.path[0] === "password") fieldErrors.password = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    // Client auth verification simulation
    setTimeout(() => {
      setIsSubmitting(false);
      toast.info("Auth client foundation active. Supabase instance ready.");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" />
          Back to Overview
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Studio Authentication</CardTitle>
            <CardDescription>Sign in with your workspace credentials or SSO</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="engineer@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                {errors.password && (
                  <p className="text-[11px] text-destructive">{errors.password}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
