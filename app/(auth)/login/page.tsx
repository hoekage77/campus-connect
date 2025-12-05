"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your student ID or AUN email"),
  password: z.string().min(1, "Password is required"),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginValues) => {
    setServerError(null)
    try {
      // Try Supabase Auth sign in first (preferred)
      try {
        const supabase = createClient()
        const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
          email: values.identifier.includes('@') ? values.identifier : undefined,
          password: values.password,
        })
        if (!supabaseError && data?.session) {
          // Supabase session created; user will be picked up by useAuth hook
          // Redirect to dashboard
          router.push('/dashboard')
          return
        }
      } catch (err) {
        // ignore and try fallback login
      }
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const payload = await response.json()

      if (!response.ok) {
        setServerError(typeof payload?.error === "string" ? payload.error : "Unable to sign in")
        return
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("userId", payload.userId)
        localStorage.setItem("userName", payload.name ?? values.identifier)
        if (payload.email) {
          localStorage.setItem("userEmail", payload.email)
        } else {
          localStorage.removeItem("userEmail")
        }
      }

      toast({
        title: "Welcome back",
        description: "You're signed in and ready to go.",
      })

      // Redirect to intended destination if provided
      const next = searchParams?.get("next")
      if (next && next.startsWith("/")) {
        router.push(next)
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Login failed", error)
      setServerError("Something went wrong. Please try again.")
    }
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Log in</CardTitle>
        <CardDescription>Access your Campus Connect dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AUN Email or Student ID</FormLabel>
                  <FormControl>
                    <Input placeholder="A00012345 or user@aun.edu.ng" autoComplete="username" {...field} />
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

            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Log in"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Need an account?{" "}
          <Link className="font-medium text-primary hover:underline" href="/signup">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
