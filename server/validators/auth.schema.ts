import { z } from 'zod';

// شمای اعتبارسنجی (Input Validation) برای داده‌های ورود
export const loginSchema = z.object({
  email: z.string()
    .min(1, { message: 'ایمیل یا نام کاربری الزامی است' }),
  password: z.string()
    .min(1, { message: 'رمز عبور الزامی است' })
    .max(100, { message: 'رمز عبور بیش از حد مجاز طولانی است' })
});

export type LoginInput = z.infer<typeof loginSchema>;

