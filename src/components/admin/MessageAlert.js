import {
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function MessageAlert({ message }) {
  if (!message?.text) return null;

  const success = message.type === 'success';

  return (
    <div
      className={`mb-6 rounded-xl border p-4 flex items-center gap-3 ${
        success
          ? 'border-green-600 bg-green-500/10 text-green-400'
          : 'border-red-600 bg-red-500/10 text-red-400'
      }`}
    >
      {success ? (
        <CheckCircle2 className="w-5 h-5" />
      ) : (
        <AlertTriangle className="w-5 h-5" />
      )}

      <p>{message.text}</p>
    </div>
  );
}