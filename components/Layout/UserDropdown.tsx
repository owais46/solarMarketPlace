'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  ChevronDownIcon,
  UserIcon,
  LifebuoyIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline';

export default function UserDropdown() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!profile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileLink = () => {
    switch (profile.role) {
      case 'seller':
        return '/seller/profile';
      case 'admin':
        return '/admin/profile';
      default:
        return '/profile';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
          <AvatarFallback className="bg-gradient-to-r from-orange-400 to-orange-600 text-white text-sm font-semibold">
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {profile.full_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {profile.role}
          </p>
        </div>
        <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href={getProfileLink()} className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/support" className="flex items-center">
            <LifebuoyIcon className="mr-2 h-4 w-4" />
            <span>Contact Support</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="flex items-center justify-between">
          <div className="flex items-center">
            {theme === 'dark' ? (
              <MoonIcon className="mr-2 h-4 w-4" />
            ) : (
              <SunIcon className="mr-2 h-4 w-4" />
            )}
            <span>Dark Mode</span>
          </div>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
            className="ml-2"
          />
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={signOut}
          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}