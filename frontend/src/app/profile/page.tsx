'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Loader2, User, Lock } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useProfile, useUpdateProfile, useChangePassword, useUploadAvatar } from '@/hooks/useProfile';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUser } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';
import { getInitials } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  bio: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const uploadAvatar = useUploadAvatar();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? { firstName: profile.firstName, lastName: profile.lastName, bio: profile.bio ?? '', phone: profile.phone ?? '', timezone: profile.timezone ?? '' }
      : undefined,
  });

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = (values: ProfileForm) => {
    updateProfile.mutate(values, {
      onSuccess: (res) => {
        dispatch(setUser(res.data));
        dispatch(addToast({ title: 'Profile updated', variant: 'success' }));
      },
      onError: (err: any) => {
        dispatch(addToast({ title: 'Update failed', description: err.response?.data?.message, variant: 'destructive' }));
      },
    });
  };

  const onPasswordSubmit = (values: PasswordForm) => {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          passwordForm.reset();
          dispatch(addToast({ title: 'Password changed', variant: 'success' }));
        },
        onError: (err: any) => {
          dispatch(addToast({ title: 'Failed', description: err.response?.data?.message, variant: 'destructive' }));
        },
      },
    );
  };

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar.mutate(file, {
      onSuccess: (res) => {
        dispatch(setUser({ ...user!, avatarUrl: res.data.avatarUrl }));
        dispatch(addToast({ title: 'Avatar updated', variant: 'success' }));
      },
      onError: () => {
        dispatch(addToast({ title: 'Upload failed', variant: 'destructive' }));
      },
    });
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>

        {/* Avatar */}
        <Card className="mb-6">
          <CardContent className="flex items-center gap-6 p-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.firstName} />}
                <AvatarFallback className="text-2xl">
                  {getInitials(profile?.firstName ?? '', profile?.lastName ?? '')}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
              >
                {uploadAvatar.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
            </div>
            <div>
              <p className="font-semibold text-lg">{profile?.firstName} {profile?.lastName}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>First name</Label>
                    <Input {...profileForm.register('firstName')} />
                    {profileForm.formState.errors.firstName && (
                      <p className="text-xs text-destructive">{profileForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last name</Label>
                    <Input {...profileForm.register('lastName')} />
                    {profileForm.formState.errors.lastName && (
                      <p className="text-xs text-destructive">{profileForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Bio</Label>
                  <Textarea {...profileForm.register('bio')} rows={3} placeholder="Tell students about yourself…" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input {...profileForm.register('phone')} placeholder="+1 555 000 0000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Timezone</Label>
                    <Input {...profileForm.register('timezone')} placeholder="UTC" />
                  </div>
                </div>
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Password form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Current password</Label>
                <Input type="password" {...passwordForm.register('currentPassword')} />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>New password</Label>
                <Input type="password" {...passwordForm.register('newPassword')} />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Confirm new password</Label>
                <Input type="password" {...passwordForm.register('confirmPassword')} />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" variant="outline" disabled={changePassword.isPending}>
                {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
