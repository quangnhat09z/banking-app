// src/components/admin/EditEmailModal.tsx
import { useState } from 'react';
import Modal from '../../common/Modal';
import InputField from '../../common/InputField';
import Button from '../../common/Button';
import adminService from '../../../services/admin.service';
import type { AdminUser } from '../../../types/admin.types';
import { ERROR_UPDATE_USER_MESSAGE } from '../../../constants/errorUpdateUserMessage';

interface Props {
  user: AdminUser;
  onClose: () => void;
  onSuccess: (userId: string, newEmail: string) => void;
}

export default function EditEmailModal({ user, onClose, onSuccess }: Props) {
  const [email, setEmail]   = useState(user.email);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (!email.trim()) { setError(ERROR_UPDATE_USER_MESSAGE.EMAIL_EMPTY); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(ERROR_UPDATE_USER_MESSAGE.EMAIL_INVALID); return false; }
    if (email === user.email) { setError(ERROR_UPDATE_USER_MESSAGE.EMAIL_SAME_AS_CURRENT); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      await adminService.updateEmail(user.id, email.trim());
      onSuccess(user.id, email.trim());
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(msg === 'Email is already taken' ? ERROR_UPDATE_USER_MESSAGE.EMAIL_ALREADY_USED : ERROR_UPDATE_USER_MESSAGE.UPDATE_FAILED);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open title={`Update Email — ${user.full_name}`} onClose={onClose}>
      <div className="flex flex-col gap-1">
        <p className="text-xs text-gray-400">Current Email</p>
        <p className="text-sm font-medium text-gray-700 font-mono">{user.email}</p>
      </div>

      <InputField
        label="New Email"
        type="email"
        placeholder="new@example.com"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setError(''); }}
        error={error}
        disabled={loading}
      />

      <div className="flex gap-3 justify-end pt-1">
        <Button variant="outline" disabled={loading} onClick={onClose}>Cancel</Button>
        <Button loading={loading} onClick={handleSubmit}>Update</Button>
      </div>
    </Modal>
  );
}