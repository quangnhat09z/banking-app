// src/pages/RegisterPage.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';

interface FormState {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
  general?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field] || errors.general) {
        setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
      }
    };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const emailTrimmed = form.email.trim();

    if (!form.full_name.trim()) {
      newErrors.full_name = 'Please enter your full name';
    }
    if (!emailTrimmed) {
      newErrors.email = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = 'Invalid email format';
    }
    if (!form.password) {
      newErrors.password = 'Please enter your password';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!form.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (form.password !== form.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate() || loading || !!successMsg) return;

    setLoading(true);
    try {
      const res = await authService.register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      setSuccessMsg(
        `Registration successful! Your account number: ${res.account.account_number}. Redirecting to login page...`
      );

      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      const message = err.response?.data?.message;
      // Đồng bộ ngôn ngữ thông báo từ Backend sang Frontend
      if (message === 'Email đã được sử dụng' || message?.includes('already')) {
        setErrors({ email: 'This email has already been registered' });
      } else {
        setErrors({ general: message ?? 'An error occurred, please try again' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        {/* Header với Icon Ngân hàng */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4 text-white shadow-md shadow-blue-100">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>

          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">Sign up to use online banking services</p>
        </div>

        {/* Thông báo Đăng ký thành công */}
        {successMsg && (
          <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-start gap-2 animate-fade-in">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Thông báo lỗi tổng quát */}
        {errors.general && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2 animate-fade-in">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errors.general}</span>
          </div>
        )}

        {/* Thẻ Form chuẩn HTML5 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <InputField
            label="Full Name"
            placeholder="e.g. John Doe"
            value={form.full_name}
            onChange={handleChange('full_name')}
            error={errors.full_name}
            disabled={loading || !!successMsg}
          // autoComplete="name"
          />
          <InputField
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={handleChange('email')}
            error={errors.email}
            disabled={loading || !!successMsg}
          // autoComplete="email"
          />
          <InputField
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={handleChange('password')}
            error={errors.password}
            disabled={loading || !!successMsg}
          // autoComplete="new-password"
          />
          <InputField
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            value={form.confirm_password}
            onChange={handleChange('confirm_password')}
            error={errors.confirm_password}
            disabled={loading || !!successMsg}
          // autoComplete="new-password"
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading || !!successMsg}
          // className="mt-2"
          >
            Register Account
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}