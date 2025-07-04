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
import { User, Camera, Trash2, Loader2, Ban, UserCheck } from "lucide-react"; // Added Ban, UserCheck
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { useBlockedUsers } from "@/hooks/use-blocked-users"; // Import useBlockedUsers
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const { blockedUsers, loading: loadingBlockedUsers, fetchBlockedUsers, blockUser, unblockUser } = useBlockedUsers(); // Use blocked users hook
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [userIdToBlock, setUserIdToBlock] = useState('');

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

  const handleBlockUserById = async () => {
    if (!userIdToBlock.trim()) {
      toast.error("Please enter a User ID to block.");
      return;
    }
    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userIdToBlock.trim())) {
      toast.error("Invalid User ID format. Please enter a valid UUID.");
      return;
    }
    await blockUser(userIdToBlock.trim(), 'block');
    setUserIdToBlock('');
  };

  const userInitials = (initialProfile.first_name?.charAt(0) || initialProfile.last_name?.charAt(0) || session?.user?.email?.charAt(0) || "G").toUpperCase();

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="blocked-users">Blocked Users</TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="mt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={form.watch("profile_image_url") || undefined} alt="Profile Image" />
                  <AvatarFallback className="text-4xl font-bold">
                    {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : userInitials}
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
                  <Camera className="h-8 w-8 text-white" />
                  <span className="sr-only">Upload Profile Image</span>
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                Role: <span className="font-semibold capitalize">{initialProfile.role || 'user'}</span>
              </p>
            </div>

            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profile_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/avatar.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time_format_24h"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Use 24-hour time format
                    </FormLabel>
                    <FormDescription>
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

            <Button type="submit" className="w-full" disabled={!form.formState.isDirty || isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Profile
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full mt-4" disabled={isDeletingAccount}>
                  {isDeletingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeletingAccount}>
                    {isDeletingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </form>
        </Form>
      </TabsContent>
      <TabsContent value="blocked-users" className="mt-4">
        <h2 className="text-xl font-bold mb-4">Blocked & Muted Users</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Enter User ID to block"
              value={userIdToBlock}
              onChange={(e) => setUserIdToBlock(e.target.value)}
            />
            <Button onClick={handleBlockUserById} disabled={!userIdToBlock.trim()}>
              <Ban className="mr-2 h-4 w-4" /> Block
            </Button>
          </div>
          {loadingBlockedUsers ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading blocked users...
            </div>
          ) : blockedUsers.length === 0 ? (
            <p className="text-muted-foreground text-center">No users blocked or muted.</p>
          ) : (
            <ScrollArea className="h-60 border rounded-md p-2">
              <div className="space-y-2">
                {blockedUsers.map((blockedUser) => (
                  <div key={blockedUser.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={blockedUser.blocked_profile?.[0]?.profile_image_url || undefined} />
                        <AvatarFallback>
                          {blockedUser.blocked_profile?.[0]?.first_name?.charAt(0) || blockedUser.blocked_profile?.[0]?.last_name?.charAt(0) || blockedUser.blocked_id.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {blockedUser.blocked_profile?.[0]?.first_name || blockedUser.blocked_profile?.[0]?.last_name || `User (${blockedUser.blocked_id.substring(0, 8)}...)`}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {blockedUser.type}ed
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unblockUser(blockedUser.blocked_id)}
                    >
                      <UserCheck className="mr-2 h-4 w-4" /> Unblock
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}