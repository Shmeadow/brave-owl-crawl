"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
  FormDescription, // Added FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch"; // Import Switch
import Image from "next/image"; // Import Image component

const profileFormSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required." }).max(50, { message: "First name too long." }).optional().or(z.literal("")),
  last_name: z.string().min(1, { message: "Last name is required." }).max(50, { message: "Last name too long." }).optional().or(z.literal("")),
  profile_image_url: z.string().url({ message: "Invalid URL" }).optional().or(z.literal("")),
  time_format_24h: z.boolean().optional(), // New field
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  initialProfile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
    role: string | null;
    time_format_24h: boolean | null; // Include in initialProfile
  };
  onProfileUpdated: () => void;
}

export function ProfileForm({ initialProfile, onProfileUpdated }: ProfileFormProps) {
  const { supabase, session } = useSupabase();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: initialProfile.first_name || "",
      last_name: initialProfile.last_name || "",
      profile_image_url: initialProfile.profile_image_url || "",
      time_format_24h: initialProfile.time_format_24h ?? true, // Default to true (24h) if null
    },
    mode: "onChange",
  });

  // Update form defaults if initialProfile changes (e.g., after a refresh)
  useEffect(() => {
    form.reset({
      first_name: initialProfile.first_name || "",
      last_name: initialProfile.last_name || "",
      profile_image_url: initialProfile.profile_image_url || "",
      time_format_24h: initialProfile.time_format_24h ?? true,
    });
  }, [initialProfile, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase || !session) {
      toast.error("You must be logged in to upload an image.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite if file with same name exists
      });

    if (uploadError) {
      toast.error("Error uploading image: " + uploadError.message);
      console.error("Error uploading image:", uploadError);
      setIsUploading(false);
      return;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (publicUrlData?.publicUrl) {
      form.setValue("profile_image_url", publicUrlData.publicUrl, { shouldDirty: true, shouldValidate: true });
      toast.success("Profile image uploaded!");
    } else {
      toast.error("Failed to get public URL for image.");
    }
    setIsUploading(false);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!supabase || !session) {
      toast.error("You must be logged in to update your profile.");
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        profile_image_url: values.profile_image_url || null,
        time_format_24h: values.time_format_24h, // Save new field
      })
      .eq('id', session.user.id);

    if (error) {
      toast.error("Error updating profile: " + error.message);
      console.error("Error updating profile:", error);
    } else {
      toast.success("Profile updated successfully!");
      form.reset(values); // Reset form state to reflect saved changes
      onProfileUpdated(); // Notify parent to re-fetch session/profile
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) {
      toast.error("No user session found.");
      return;
    }

    setIsDeletingAccount(true);
    try {
      // Call the Edge Function to delete the user
      const response = await fetch('https://mrdupsekghsnbooyrdmj.supabase.co/functions/v1/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: session.user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Error deleting account: " + (data.error || "Unknown error"));
        console.error("Error deleting account:", data.error);
      } else {
        toast.success("Account deleted successfully. Redirecting...");
        // Supabase's onAuthStateChange will handle the sign out and redirect
      }
    } catch (error) {
      toast.error("Failed to delete account due to network error.");
      console.error("Network error during account deletion:", error);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const userInitials = (initialProfile.first_name?.charAt(0) || initialProfile.last_name?.charAt(0) || session?.user?.email?.charAt(0) || "G").toUpperCase();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6"> {/* Reduced space-y for mobile */}
        <div className="flex flex-col items-center gap-3 sm:gap-4"> {/* Reduced gap for mobile */}
          <div className="relative group">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24"> {/* Reduced size for mobile */}
              {form.watch("profile_image_url") ? (
                <Image
                  src={form.watch("profile_image_url")!}
                  alt="Profile Image"
                  fill
                  className="object-cover"
                  sizes="80px" // Adjusted sizes for mobile
                  priority={false}
                />
              ) : (
                <AvatarImage src={undefined} alt="Profile Image" />
              )}
              <AvatarFallback className="text-3xl sm:text-4xl font-bold"> {/* Reduced font size for mobile */}
                {isUploading ? <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" /> : userInitials} {/* Reduced icon size for mobile */}
              </AvatarFallback>
            </Avatar>
            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            <label
              htmlFor="profile-image-upload"
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" /> {/* Reduced icon size for mobile */}
              <span className="sr-only">Upload Profile Image</span>
            </label>
          </div>
          <p className="text-sm text-muted-foreground"> {/* Reduced font size for mobile */}
            Role: <span className="font-semibold capitalize">{initialProfile.role || 'user'}</span>
          </p>
        </div>

        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">First Name</FormLabel> {/* Reduced font size for mobile */}
              <FormControl>
                <Input placeholder="John" {...field} className="h-9 text-sm" /> {/* Reduced height and font size for mobile */}
              </FormControl>
              <FormMessage className="text-xs" /> {/* Reduced font size for mobile */}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Last Name</FormLabel> {/* Reduced font size for mobile */}
              <FormControl>
                <Input placeholder="Doe" {...field} className="h-9 text-sm" /> {/* Reduced height and font size for mobile */}
              </FormControl>
              <FormMessage className="text-xs" /> {/* Reduced font size for mobile */}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="profile_image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Profile Image URL (Optional)</FormLabel> {/* Reduced font size for mobile */}
              <FormControl>
                <Input placeholder="https://example.com/avatar.jpg" {...field} className="h-9 text-sm" /> {/* Reduced height and font size for mobile */}
              </FormControl>
              <FormMessage className="text-xs" /> {/* Reduced font size for mobile */}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time_format_24h"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:p-4"> {/* Reduced padding for mobile */}
              <div className="space-y-0.5">
                <FormLabel className="text-sm sm:text-base"> {/* Reduced font size for mobile */}
                  Use 24-hour time format
                </FormLabel>
                <FormDescription className="text-xs"> {/* Reduced font size for mobile */}
                  Toggle to switch between 24-hour (00:00) and 12-hour (AM/PM) time display.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-9 sm:h-10 text-sm sm:text-base" disabled={!form.formState.isDirty || isUploading}> {/* Reduced height and font size for mobile */}
          {isUploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4 animate-spin" /> : null} {/* Reduced icon size for mobile */}
          Save Profile
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full mt-2 sm:mt-4 h-9 sm:h-10 text-sm sm:text-base" disabled={isDeletingAccount}> {/* Reduced height and font size for mobile */}
              {isDeletingAccount ? <Loader2 className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />} {/* Reduced icon size for mobile */}
              Delete My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl">Are you absolutely sure?</AlertDialogTitle> {/* Reduced font size for mobile */}
              <AlertDialogDescription className="text-sm"> {/* Reduced font size for mobile */}
                This action cannot be undone. This will permanently delete your account
                and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-9 text-sm">Cancel</AlertDialogCancel> {/* Reduced height and font size for mobile */}
              <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeletingAccount} className="h-9 text-sm"> {/* Reduced height and font size for mobile */}
                {isDeletingAccount ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null} {/* Reduced icon size for mobile */}
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </Form>
  );
}