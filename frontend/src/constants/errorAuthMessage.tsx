// src/constants/errorAuthMessage.ts
export const AUTH_LOGIN_ERROR_MAP: Record<string, string> = {
    'Invalid email or password': 'The email or password you entered is incorrect',
    'User account is not active': 'Your account is not active, please contact support',
    'User account is locked': 'Your account has been locked. Please contact support.',
};

export const AUTH_REGISTER_ERROR_MAP: Record<string, string> = {
    // message từ backend
    'Email already exists': 'This email has already been registered',

    // message từ frontend (form validation)
    'Null fullname': 'Please enter your full name',
    'Null email': 'Please enter your email',
    'Invalid email': 'Email must have an @ symbol and a valid domain (e.g., example@domain.com)',
    'Null password': 'Please enter your password',
    'Invalid password': 'Password must be at least 6 characters',
    'Null confirm password': 'Please confirm your password',
    'Passwords not match': 'Passwords do not match, please check again',

    // message từ frontend (success)
    'Registration successful': 'Registration successful! Redirecting to login page...',
};

export const DEFAULT_AUTH_ERROR = 'An error occurred while processing your request. Please try again later.';