"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getCurrentUser, User } from '../utils/auth';

type Role = 'SUPER_ADMIN' | 'WAREHOUSE_USER';

interface WithRoleBasedAccessProps {
  allowedRoles: Role[];
  children: React.ReactNode | (() => React.ReactNode);
}

export function withRoleBasedAccess({ allowedRoles, children }: WithRoleBasedAccessProps) {
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const user = await getCurrentUser();

        if (!user || !allowedRoles.includes(user.role as Role)) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Role-based access check failed:', error);
        router.push('/login');
      }
    };

    checkUserRole();
  }, [allowedRoles, router]);

  // If children is a function, call it to get the React node
  const renderChildren = typeof children === 'function' ? children() : children;

  return renderChildren;
}

export function filterDataByUserRole<T extends { warehouseId?: number }>(
  data: T[], 
  user: User | null, 
  warehouseIdKey: keyof T = 'warehouseId' as keyof T
): T[] {
  // If no user or user is SUPER_ADMIN, return all data
  if (!user || user.role === 'SUPER_ADMIN') {
    return data;
  }

  // Filter data based on user's warehouse
  return data.filter(item => {
    const warehouseId = item[warehouseIdKey];
    return warehouseId === user.warehouse?.id;
  });
}
