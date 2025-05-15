import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="flex flex-col items-center gap-y-8">
        <div className="text-center">
          <h1
            className="text-5xl font-[550]"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            ReeOrg
          </h1>
          <p
            className="text-xl font-[400] leading-none mt-2"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            A PROTOTYPE FOR FYP
          </p>
        </div>
        <Card className="w-[420px] p-8 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">Welcome</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
