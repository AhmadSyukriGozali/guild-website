import { Loader2 } from 'lucide-react';

export default function LoadingScreen({
  text = 'Memuat...'
}) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <p className="text-slate-300">{text}</p>
      </div>
    </div>
  );
}