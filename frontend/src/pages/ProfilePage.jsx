import { useRef, useState } from 'react';
import { Camera, UserRound } from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../contexts/useAuth.js';
import { errorMessage } from '../lib/utils.js';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { ErrorMessage } from '../components/ui/feedback.jsx';

export default function ProfilePage() {
  const { user, updateProfilePicture } = useAuth();
  const fileInput = useRef(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  async function uploadPicture(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload/profile-picture', formData);
      updateProfilePicture(data.profilePictureUrl);
      setSuccess('Your profile picture has been updated.');
    } catch (requestError) {
      setError(errorMessage(requestError, 'Your picture could not be uploaded.'));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <p className="text-sm font-semibold text-indigo-600">YOUR ACCOUNT</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your account information and profile picture.</p>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Profile picture</CardTitle>
          <CardDescription>JPEG, PNG, or WebP up to 5 MB.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {user?.profilePictureUrl
            ? <img src={user.profilePictureUrl} alt="Your profile" className="size-24 rounded-2xl object-cover ring-4 ring-slate-100" />
            : <span className="grid size-24 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><UserRound size={36} /></span>}
          <div>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={uploadPicture} />
            <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading}><Camera size={16} /> {uploading ? 'Uploading…' : 'Upload a new picture'}</Button>
            <p className="mt-2 text-xs text-slate-500">The server checks image type and size before upload.</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Account details</CardTitle><CardDescription>These details are read-only because the existing API does not include an update-profile endpoint.</CardDescription></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Name</p><p className="mt-1 font-medium text-slate-800">{user?.name}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email address</p><p className="mt-1 font-medium text-slate-800">{user?.email}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Account role</p><p className="mt-1 font-medium capitalize text-slate-800">{user?.role}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
