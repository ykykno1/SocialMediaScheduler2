import React, { useState } from 'react';
import { LogOut, User, Crown, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email?: string;
  username?: string;
  accountType: 'free' | 'youtube_pro' | 'premium';
  createdAt: string;
}

interface UserProfileProps {
  onShowSettings?: () => void;
}

export default function UserProfile({ onShowSettings }: UserProfileProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user']
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/logout');
      return response;
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/auth';
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "שגיאה בהתנתקות",
        variant: "destructive"
      });
    }
  });

  if (isLoading || !user) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
      </div>
    );
  }

  // Get user initials
  const getInitials = (email?: string, username?: string) => {
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'US';
  };

  // Get account type display
  const getAccountTypeDisplay = (accountType: string) => {
    switch (accountType) {
      case 'premium':
        return { label: 'פרימיום', variant: 'default' as const };
      case 'youtube_pro':
        return { label: 'יוטיוב פרו', variant: 'secondary' as const };
      default:
        return { label: 'חינם', variant: 'outline' as const };
    }
  };

  const accountDisplay = getAccountTypeDisplay(user.accountType);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 p-2 h-auto hover:bg-blue-600/20">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-blue-200 text-blue-800 text-xs font-medium">
              {getInitials(user.email, user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex items-center gap-1">
            <span className="text-sm font-medium text-white">
              {user.username || user.email?.split('@')[0] || 'משתמש'}
            </span>
            <ChevronDown className="w-4 h-4 text-white/70" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <div className="font-normal text-sm">
            {user.email || 'משתמש לא מזוהה'}
          </div>
          <Badge variant={accountDisplay.variant} className="w-fit text-xs">
            {user.accountType === 'premium' && <Crown className="w-3 h-3 mr-1" />}
            {accountDisplay.label}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {onShowSettings && (
          <DropdownMenuItem onClick={onShowSettings}>
            <Settings className="mr-2 h-4 w-4" />
            <span>הגדרות</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => window.location.href = '/pricing'}>
          <Crown className="mr-2 h-4 w-4" />
          <span>שדרג חשבון</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => logoutMutation.mutate()}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>התנתק</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}