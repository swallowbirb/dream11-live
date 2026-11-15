import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EV, type Notify } from '@d11/shared';
import { getSocket } from '@/lib/socket';
import { useSession } from '@/lib/session';

/** Go-live toasts from followed creators. Opening the socket here is what makes the user "online". */
export function useNotify() {
  const token = useSession((s) => s.token);
  const navigate = useNavigate();
  const qc = useQueryClient();
  useEffect(() => {
    if (!token) return;
    const s = getSocket();
    const onNotify = (n: Notify) => {
      if (n.type !== 'live') return;
      qc.invalidateQueries({ queryKey: ['following'] });
      toast(`${n.stream.channel.displayName} is live`, {
        description: n.stream.title,
        icon: '🔴',
        duration: 10000,
        action: { label: 'Watch', onClick: () => navigate(`/watch/${n.stream.id}`) },
      });
    };
    s.on(EV.notify, onNotify);
    return () => {
      s.off(EV.notify, onNotify);
    };
  }, [token, navigate, qc]);
}
