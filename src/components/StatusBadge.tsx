import React from 'react';

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
      <span className={`hidden dark:inline-block px-2 py-0.5 text-xs font-medium rounded-full ${darkConfig.bg} ${darkConfig.text}`}>
        {label || darkConfig.label}
      </span>
      <span className={`inline-block dark:hidden px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {label || config.label}
      </span>
    </>
  );
};