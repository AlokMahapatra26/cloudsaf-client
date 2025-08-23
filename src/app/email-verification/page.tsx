"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function EmailVerifiedPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-6">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-3">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verified</CardTitle>
          <CardDescription>
            Your email has been successfully verified. You can now sign in and start using CloudSAF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Secure, reliable cloud storage is just a click away.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="https://cloudsaf-client.vercel.app/signin" passHref>
            <Button className="px-6 py-2">Go to Sign In</Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
