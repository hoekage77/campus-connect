"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

const adminLoginSchema = z.object({
  identifier: z.string().min(1, "Enter admin email or student ID"),
  password: z.string().min(1, "Password is required"),
})

type AdminLoginValues = z.infer<typeof adminLoginSchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { identifier: "", password: "" },
  })

  const onSubmit = async (values: AdminLoginValues) => {
    setServerError(null)
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const payload = await res.json()
      if (!res.ok) {
        setServerError(typeof payload?.error === "string" ? payload.error : "Unable to sign in as admin")
        return
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("adminId", payload.userId)
        localStorage.setItem("adminName", payload.name ?? values.identifier)
        if (payload.email) localStorage.setItem("adminEmail", payload.email)
        else localStorage.removeItem("adminEmail")

        // Mirror admin session into main app user session so navigation keeps you signed in
        localStorage.setItem("userId", payload.userId)
        localStorage.setItem("userName", payload.name ?? values.identifier)
        if (payload.email) localStorage.setItem("userEmail", payload.email)
        else localStorage.removeItem("userEmail")
      }

      toast({ title: "Admin access granted", description: "Welcome to the Admin Dashboard." })

      const next = searchParams?.get("next")
      if (next && next.startsWith("/")) router.push(next)
      else router.push("/admin")
    } catch (e) {
      setServerError("Something went wrong. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-2xl">Admin Sign In</CardTitle>
          </div>
          <CardDescription>Enter your admin credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email or Student ID</FormLabel>
                    <FormControl>
                      <Input placeholder="A00012345 or admin@aun.edu.ng" autoComplete="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          You’re on the secure admin portal.
        </CardFooter>
      </Card>
    </div>
  )
}
