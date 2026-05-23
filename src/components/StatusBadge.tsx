import React from 'react';
import { Network } from 'lucide-react';

interface StatusBadgeProps {
  status: 'free' | 'used' | 'reserved' | 'online' | 'offline';
  label?: string;
}

const statusConfig = {
  free: { bg: 'bg-green-100', text: 'text-green-700', label: '空闲' },
  used: { bg: 'bg-red-100', text: 'text-red-700', label: '已占用' },
  reserved: { bg: 'bg-gray-100', text: 'text-gray-600', label: '待配置' },
  online: { bg: 'bg-green-100', text: 'text-green-700', label: '在线' },
  offline: { bg: 'bg-red-100', text: 'text-red-700', label: '离线' },
};

const darkStatusConfig = {
  free: { bg: 'bg-green-900', text: 'text-green-400', label: '空闲' },
  used: { bg: 'bg-red-900', text: 'text-red-400', label: '已占用' },
  reserved: { bg: 'bg-gray-700', text: 'text-gray-400', label: '待配置' },
  online: { bg: 'bg-green-900', text: 'text-green-400', label: '在线' },
  offline: { bg: 'bg-red-900', text: 'text-red-400', label: '离线' },
};

export const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  const config = statusConfig[status];
  const darkConfig = darkStatusConfig[status];

  return (
    <>
      <span className={`hidden dark:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${darkConfig.bg} ${darkConfig.text}`}>
        {status === 'used' && <Network className="w-3 h-3" />}
        {label || darkConfig.label}
      </span>
      <span className={`inline-flex dark:hidden items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {status === 'used' && <Network className="w-3 h-3" />}
        {label || config.label}
      </span>
    </>
  );
};