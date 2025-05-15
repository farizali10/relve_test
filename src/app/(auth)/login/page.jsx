"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginUser } from "@/redux/action/user";
import Link from "next/link";
import { redirect } from "next/navigation";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const { isAuth, btnLoading, error } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  if (isAuth) return redirect("/chatbot");

  const submitHandler = (e) => {
    e.preventDefault();
    setLocalError("");
    if (!email || !password) {
      setLocalError("Please enter both email and password.");
      return;
    }
    dispatch(loginUser(email, password));
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="flex flex-col items-center gap-y-10">
        <h1
          className="text-5xl font-[550] text-center"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Welcome To Reeorg
        </h1>
        <div className="w-[420px] p-8 shadow-xl rounded-2xl bg-background">
          <div className="mb-6">
            <h2
              className="text-xl font-[550]"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              Login
            </h2>
          </div>
          <form className="flex flex-col gap-4" onSubmit={submitHandler}>
            <div>
              <Label
                htmlFor="email"
                className="mb-1 block text-sm font-medium"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mb-2"
              />
            </div>
            <div>
              <Label
                htmlFor="password"
                className="mb-1 block text-sm font-medium"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full mb-2"
              />
            </div>
            {/* <div className="mb-2">
              <Link
                href="/forgot-password"
                className="text-xs text-foreground underline"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                forgot password?
              </Link>
            </div> */}
            {(localError || error) && (
              <div className="text-red-600 text-sm">{localError || error}</div>
            )}
            <Button
              type="submit"
              className="w-full mt-2 font-[550]"
              disabled={btnLoading}
            >
              {btnLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <div
            className="mt-4 text-sm text-center"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-foreground font-medium underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
