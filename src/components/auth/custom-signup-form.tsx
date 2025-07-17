"use client";

import React, { useState } from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator"; // Import Separator
import { Chrome, Github } from "lucide-react"; // Import icons

// Basic profanity list for demonstration. In a real application, this would be more comprehensive
// and potentially managed server-side or via a dedicated library.
const profanityList = ['fuck', 'shit', 'asshole', 'bitch', 'cunt', 'damn', 'bastard', 'dick', 'pussy', 'whore'];

const signupFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  username: z.string()
    .min(2, { message: "Username must be at least 2 characters." })
    .max(30, { message: "Username cannot exceed 30 characters." })
    .refine((name: string) => !profanityList.some(word => name.toLowerCase().includes(word)), {
      message: "Username contains profanity. Please choose a different one.",
    }),
});

interface CustomSignupFormProps {
  supabase: SupabaseClient;
  onSuccess: () => void;
  onSwitchToSignIn: () => void;
}

export function CustomSignupForm({ supabase, onSuccess, onSwitchToSignIn }: CustomSignupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
  });

  async function onSubmit(values: z.infer<typeof signupFormSchema>) {
    setIsLoading(true);
    const { email, password, username } = values;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: username, // Map username to first_name in user metadata
        },
        emailRedirectTo: `${window.location.origin}/dashboard`, // Redirect after email confirmation
      },
    });

    if (error) {
      toast.error(error.message);
      console.error("Signup error:", error);
    } else if (data.user) {
      toast.success("Account created! Please check your email to confirm your account.");
      onSuccess(); // Call the success callback to potentially redirect or update UI
    } else {
      toast.info("Signup initiated. Check your email for a confirmation link.");
      onSuccess();
    }
    setIsLoading(false);
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      console.error(`Error signing in with ${provider}:`, error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        <FormField
          control={form.control}
          name="email"
          render={({ field }: { field: ControllerRenderProps<z.infer<typeof signupFormSchema>, "email"> }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" {...field} type="email" disabled={isLoading} className="bg-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }: { field: ControllerRenderProps<z.infer<typeof signupFormSchema>, "password"> }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" {...field} type="password" disabled={isLoading} className="bg-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }: { field: ControllerRenderProps<z.infer<typeof signupFormSchema>, "username"> }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Your display name" {...field} disabled={isLoading} className="bg-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign Up
        </Button>

        <Separator className="my-3" />
        <p className="text-sm text-muted-foreground text-center mb-1">Or connect with</p>
        <div className="flex gap-3 w-full justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleOAuthSignIn('google')}
            className="flex-1"
          >
            <Chrome className="mr-2 h-5 w-5" /> Google
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleOAuthSignIn('github')}
            className="flex-1"
          >
            <Github className="mr-2 h-5 w-5" /> GitHub
          </Button>
        </div>

        <Button type="button" variant="link" onClick={onSwitchToSignIn} className="w-full mt-3">
          Already have an account? Sign In
        </Button>
      </form>
    </Form>
  );
}