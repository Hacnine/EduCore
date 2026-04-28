'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Loader2, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import { useCourseCoupons, useCreateCoupon, useDeactivateCoupon, useDeleteCoupon } from '@/hooks/useCoupons';
import { formatPrice } from '@/lib/utils';

const schema = z.object({
  code: z.string().min(3).max(30).regex(/^[A-Z0-9_-]+$/, 'Uppercase letters, numbers, _ and - only'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.coerce.number().positive(),
  maxUses: z.coerce.number().int().positive().optional().or(z.literal('')),
  expiresAt: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function CouponsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { data: coupons, isLoading } = useCourseCoupons(courseId);
  const createCoupon = useCreateCoupon();
  const deactivateCoupon = useDeactivateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { discountType: 'PERCENTAGE' },
  });

  const discountType = watch('discountType');

  const onSubmit = (values: FormValues) => {
    createCoupon.mutate(
      {
        courseId,
        code: values.code.toUpperCase(),
        discountType: values.discountType,
        discountValue: values.discountValue,
        maxUses: values.maxUses ? Number(values.maxUses) : undefined,
        expiresAt: values.expiresAt || undefined,
      },
      {
        onSuccess: () => {
          reset();
          setShowForm(false);
          dispatch(addToast({ title: 'Coupon created', variant: 'success' }));
        },
        onError: (err: any) => dispatch(addToast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' })),
      },
    );
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/dashboard/instructor/courses/${courseId}/curriculum`}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-2xl font-bold">Coupons</h1>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Coupon
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base">Create Coupon</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Coupon Code</Label>
                    <Input {...register('code')} placeholder="SAVE20" style={{ textTransform: 'uppercase' }} />
                    {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Discount Type</Label>
                    <Select value={discountType} onValueChange={(v) => setValue('discountType', v as 'PERCENTAGE' | 'FIXED')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                        <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Discount Value</Label>
                    <Input type="number" min={1} step={0.01} {...register('discountValue')} placeholder={discountType === 'PERCENTAGE' ? '20' : '10.00'} />
                    {errors.discountValue && <p className="text-xs text-destructive">{errors.discountValue.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max Uses <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input type="number" min={1} {...register('maxUses')} placeholder="100" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expires At <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input type="date" {...register('expiresAt')} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={createCoupon.isPending}>
                    {createCoupon.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Create
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); reset(); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : !coupons?.length ? (
          <div className="text-center py-20">
            <Tag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No coupons yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {coupons.map((coupon) => (
              <Card key={coupon.id} className={!coupon.isActive ? 'opacity-60' : ''}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="font-mono font-bold text-sm">{coupon.code}</code>
                      <Badge variant={coupon.isActive ? 'default' : 'secondary'} className="text-xs">
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-sm font-medium text-primary">
                        {coupon.discountType === 'PERCENTAGE'
                          ? `${coupon.discountValue}% off`
                          : `${formatPrice(coupon.discountValue)} off`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{coupon.usedCount} / {coupon.maxUses ?? '∞'} uses</span>
                      {coupon.expiresAt && <span>Expires {format(new Date(coupon.expiresAt), 'MMM d, yyyy')}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {coupon.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => deactivateCoupon.mutate({ id: coupon.id, courseId })}
                        disabled={deactivateCoupon.isPending}
                      >
                        Deactivate
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        if (confirm('Delete this coupon?'))
                          deleteCoupon.mutate({ id: coupon.id, courseId });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
