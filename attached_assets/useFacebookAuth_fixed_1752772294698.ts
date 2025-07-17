import { useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

export function useFacebookAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/facebook-config'],
    queryFn: () => fetch('/api/facebook-config').then((res) => res.json()),
  });

  const mutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch('/api/facebook/auth-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה לא ידועה');
      return data;
    },
    onSuccess: () => {
      toast({ title: 'התחברת בהצלחה לפייסבוק' });
      queryClient.invalidateQueries({ queryKey: ['/api/auth-status'] });
    },
    onError: (err: any) => {
      toast({ title: 'שגיאה בהתחברות לפייסבוק', description: err.message });
    },
  });

  const handleFacebookLogin = useCallback(() => {
    if (!data?.appId || !data?.redirectUri) {
      toast({ title: 'פרטי פייסבוק חסרים' });
      return;
    }

    const authUrl = \`https://www.facebook.com/v19.0/dialog/oauth?client_id=\${data.appId}&redirect_uri=\${encodeURIComponent(data.redirectUri)}&response_type=code&scope=pages_show_list,pages_read_engagement,pages_manage_posts\`;
    window.open(authUrl, '_blank', 'width=500,height=600');
  }, [data]);

  function handleMessage(event: MessageEvent) {
    if (event.origin !== window.location.origin) return;
    if (event.data?.platform !== 'facebook') return;

    const code = event.data.code;
    if (!code) return;

    mutation.mutate(code);
  }

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return { handleFacebookLogin, isLoading };
}
