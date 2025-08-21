import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function Landing() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-white text-zinc-900">
      {/* Hero Section */}
      <section className="w-full max-w-3xl text-center py-20 px-6">
        <h1 className="text-5xl font-extrabold tracking-tight">
          CloudSAF
        </h1>
        <p className="mt-4 text-xl text-zinc-600">
          Cloud storage that’s <span className="font-semibold">simple AF</span>.  
          No clutter. No noise. Just your files, safe and accessible.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg" className="px-8" variant="outline">
            <Link href="/signin">Sign In</Link>
          </Button>
          <Button asChild size="lg" className="px-8" variant="outline">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </section>

      <Separator className="my-12 w-3/4 bg-zinc-200" />

      {/* Why Us Section */}
      <section className="w-full max-w-4xl px-6 py-12 text-center">
        <h2 className="text-3xl font-bold mb-6">Why CloudSAF?</h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Simple</CardTitle>
              <CardDescription>
                A clean, no frills interface that anyone can use.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Secure</CardTitle>
              <CardDescription>
                Built on Supabase, your files stay private and protected.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Fast</CardTitle>
              <CardDescription>
                Uploads and downloads that just work. No waiting, no drama.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Folders</CardTitle>
              <CardDescription>
                Keep everything organized with folders and structure.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Accessible</CardTitle>
              <CardDescription>
                Your files, from anywhere, on any device.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Free to Start</CardTitle>
              <CardDescription>
                Generous free tier to get you going right away.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <Separator className="my-12 w-3/4 bg-zinc-200" />

      {/* CTA Section */}
      <section className="w-full max-w-2xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold">Get Started Today</h2>
        <p className="mt-2 text-zinc-600">
          Join CloudSAF and experience cloud storage that’s simple, fast, and secure.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button asChild size="lg" variant="outline" className="px-8">
            <Link href="/signup">Create Your Free Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 py-6 mt-auto text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} CloudSAF. All rights reserved.
      </footer>
    </main>
  )
}
