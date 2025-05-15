"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/redux/action/user";
import Link from "next/link";
import { redirect } from "next/navigation";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const { isAuth, btnLoading, error } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  if (isAuth) return redirect("/chatbot");

  const submitHandler = (e) => {
    e.preventDefault();
    setLocalError("");
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    const formdata = new FormData();
    formdata.append("name", name);
    formdata.append("email", email);
    formdata.append("password", password);
    formdata.append("confirmPassword", confirmPassword);
    dispatch(registerUser(formdata));
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
              Signup
            </h2>
          </div>
          <form className="flex flex-col gap-4" onSubmit={submitHandler}>
            <div>
              <Label
                htmlFor="name"
                className="mb-1 block text-sm font-medium"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full mb-2"
              />
            </div>
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
                minLength={8}
                required
                className="w-full mb-2"
              />
            </div>
            <div>
              <Label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
                className="w-full mb-2"
              />
            </div>
            {(localError || error) && (
              <div className="text-red-600 text-sm">{localError || error}</div>
            )}
            <Button
              type="submit"
              className="w-full mt-2 font-[550]"
              disabled={btnLoading}
            >
              {btnLoading ? "Registering..." : "Sign up"}
            </Button>
          </form>
          <div
            className="mt-4 text-sm text-center"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-foreground font-medium underline"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Signup;
