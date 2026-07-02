// src/pages/LoginPage.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import InputField from '../components/InputField';
import Button from '../components/Button';

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      // Xóa lỗi của field tương ứng và lỗi chung ngay khi user gõ lại
      if (errors[field] || errors.general) {
        setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
      }
    };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const emailTrimmed = form.email.trim();

    if (!emailTrimmed) {
      newErrors.email = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = 'Invalid email format';
    }

    if (!form.password) {
      newErrors.password = 'Please enter your password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Ngăn trình duyệt reload trang
    if (!validate() || loading) return;

    setLoading(true);
    try {
      const res = await authService.login({
        email: form.email.trim(),
        password: form.password,
      });

      setAuth(res.user, res.access_token);
      navigate('/dashboard', { replace: true }); // Dùng replace để tránh việc bấm nút Back quay lại trang Login
    } catch (err: any) {
      const message = err.response?.data?.message;
      setErrors({
        general: message ?? 'An error occurred, please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        {/* Header với Icon Ngân hàng  */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4 text-white shadow-md shadow-blue-100">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your banking account</p>
        </div>

        {/* Thông báo lỗi tổng quát */}
        {errors.general && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2 animate-fade-in">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errors.general}</span>
          </div>
        )}

        {/* Chuyển thành thẻ Form chuẩn HTML5 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <InputField
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={handleChange('email')}
            error={errors.email}
            disabled={loading}
          // autoComplete="email"
          />
          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange('password')}
            error={errors.password}
            disabled={loading}
          // autoComplete="current-password"
          />

          <Button
            type="submit" fullWidth loading={loading} disabled={loading}
            // className="mt-2"
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-semibold">
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}