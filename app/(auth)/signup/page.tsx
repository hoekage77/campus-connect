"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

const studentIdRegex = /^[Aa]\d{8}$/
const aunEmailRegex = /^[^\s@]+@aun\.edu\.ng$/i

const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or fewer"),
  identifier: z
    .string()
    .min(1, "Provide your AUN email or student ID")
    .refine(
      (value) => {
        const trimmed = value.trim()
        return studentIdRegex.test(trimmed) || aunEmailRegex.test(trimmed)
      },
      {
        message: "Use an ID like A00012345 or an @aun.edu.ng email",
      }
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type SignupValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      identifier: "",
      password: "",
    },
  })

  const onSubmit = async (values: SignupValues) => {
    setServerError(null)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const payload = await response.json()

      if (!response.ok) {
        setServerError(typeof payload?.error === "string" ? payload.error : "Unable to create account")
        return
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("userId", payload.userId)
        localStorage.setItem("userName", payload.name ?? values.username)
        if (payload.email) {
          localStorage.setItem("userEmail", payload.email)
        } else {
          localStorage.removeItem("userEmail")
        }
      }

      toast({
        title: "Account created",
        description: "Welcome aboard! Let's set up your profile.",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Signup failed", error)
      setServerError("Something went wrong. Please try again.")
    }
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Join your squad with your AUN credentials.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ada_lovelace" autoComplete="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AUN Email or Student ID</FormLabel>
                  <FormControl>
                    <Input placeholder="A00012345 or user@aun.edu.ng" autoComplete="email" {...field} />
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
                    <Input type="password" placeholder="********" autoComplete="new-password" {...field} />
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
                  Creating account...
                </span>
              ) : (
                "Sign up"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-medium text-primary hover:underline" href="/login">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
