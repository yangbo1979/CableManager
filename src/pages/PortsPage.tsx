import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Server, Network, Monitor, Database, Filter } from 'lucide-react';

// 状态标签配置
const statusTabs = [
  { key: 'all', label: '全部', color: '#6B7280' },
  { key: 'free', label: '空闲', color: '#10B981' },
  { key: 'used', label: '已占用', color: '#EF4444' },
  { key: 'reserved', label: '待配置', color: '#6B7280' },
];

// 类型标签配置
const typeTabs = [
  { key: 'all', label: '全部', color: '#6B7280' },
  { key: 'server', label: '服务器', color: '#3B82F6' },
  { key: 'switch', label: '交换机', color: '#10B981' },
  { key: 'seat', label: '座位', color: '#F59E0B' },
  { key: 'rack', label: '机柜', color: '#8B5CF6' },
];

const typeIcons = {
  server: Server,
  switch: Network,
  seat: Monitor,
  rack: Database,
};

const typeLabels = {
  server: '服务器',
  switch: '交换机',
  seat: '座位',
  rack: '机柜',
};

export const PortsPage = () => {
  const { darkMode, ports, servers, switches, seats, racks } = useStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const getDeviceName = (deviceType: string, deviceId: string): string => {
    switch (deviceType) {
      case 'server':
        return servers.find((s) => s.id === deviceId)?.name || '未知服务器';
      case 'switch':
        return switches.find((s) => s.id === deviceId)?.name || '未知交换机';
      case 'seat':
        return seats.find((s) => s.id === deviceId)?.name || '未知座位';
      case 'rack':
        return racks.find((r) => r.id === deviceId)?.name || '未知机柜';
      default:
        return '未知设备';
    }
  };

  const getConnectedPort = (portId?: string) => {
    if (!portId) return null;
    const connectedPort = ports.find((p) => p.id === portId);
    if (!connectedPort) return null;
    
    const deviceType = connectedPort.deviceType;
    const deviceId = connectedPort.deviceId;
    const portName = connectedPort.name;
    
    switch (deviceType) {
      case 'server': {
        const server = servers.find((s) => s.id === deviceId);
        const rack = server ? racks.find((r) => r.id === server.rackId) : null;
        const rackName = rack ? rack.name : 'Unknown Rack';
        return `${rackName} > ${server?.name || '未知服务器'} (U${server?.uPosition}) - ${portName}`;
      }
      case 'switch': {
        const sw = switches.find((s) => s.id === deviceId);
        const rack = sw ? racks.find((r) => r.id === sw.rackId) : null;
        const rackName = rack ? rack.name : 'Unknown Rack';
        return `${rackName} > ${sw?.name || '未知交换机'} (U${sw?.uPosition}) - ${portName}`;
      }
      case 'seat': {
        const seat = seats.find((s) => s.id === deviceId);
        return `${seat?.name || '未知座位'} - ${portName}`;
      }
      case 'rack': {
        const rack = racks.find((r) => r.id === deviceId);
        return `${rack?.name || '未知机柜'} - ${portName}`;
      }
      default:
        return `${getDeviceName(deviceType, deviceId)} - ${portName}`;
    }
  };

  const filteredPorts = ports.filter((port) => {
    const statusMatch = statusFilter === 'all' || port.status === statusFilter;
    const typeMatch = typeFilter === 'all' || port.deviceType === typeFilter;
    return statusMatch && typeMatch;
  });

  const freeCount = ports.filter((p) => p.status === 'free').length;
  const usedCount = ports.filter((p) => p.status === 'used').length;
  const reservedCount = ports.filter((p) => p.status === 'reserved').length;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-bg-light'}`}>
      <Header title="端口管理" />
      <main className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>空闲端口</p>
                <p className={`text-xl font-bold mt-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {freeCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold">{Math.round((freeCount / ports.length) * 100)}%</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>已占用端口</p>
                <p className={`text-xl font-bold mt-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {usedCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 font-bold">{Math.round((usedCount / ports.length) * 100)}%</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>待配置端口</p>
                <p className={`text-xl font-bold mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {reservedCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-600 font-bold">{Math.round((reservedCount / ports.length) * 100)}%</span>
              </div>
            </div>
          </Card>
        </div>

        <Card className="mb-4">
          <div className="space-y-4">
            {/* 状态筛选标签 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Filter className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>状态筛选:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      statusFilter === tab.key
                        ? 'text-white shadow-md'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={statusFilter === tab.key ? { backgroundColor: tab.color } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tab.color }}
                    />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 类型筛选标签 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Filter className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>类型筛选:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {typeTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setTypeFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      typeFilter === tab.key
                        ? 'text-white shadow-md'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={typeFilter === tab.key ? { backgroundColor: tab.color } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tab.color }}
                    />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={darkMode ? 'border-gray-700' : 'border-gray-200'}>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'} border-b`}>
                    设备类型
                  </th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'} border-b`}>
                    所属设备
                  </th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'} border-b`}>
                    端口编号
                  </th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'} border-b`}>
                    连接对象
                  </th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'} border-b`}>
                    状态
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPorts.map((port) => {
                  const Icon = typeIcons[port.deviceType as keyof typeof typeIcons];
                  const connectedTo = getConnectedPort(port.connectedTo);
                  return (
                    <tr
                      key={port.id}
                      className={`hover:bg-gray-50 ${darkMode ? 'hover:bg-gray-700' : ''}`}
                    >
                      <td className={`px-4 py-3 ${darkMode ? 'text-gray-300 border-gray-700' : 'text-gray-900 border-gray-100'} border-b flex items-center gap-2`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{typeLabels[port.deviceType]}</span>
                      </td>
                      <td className={`px-4 py-3 ${darkMode ? 'text-gray-300 border-gray-700' : 'text-gray-900 border-gray-100'} border-b`}>
                        <span className="text-sm">{getDeviceName(port.deviceType, port.deviceId)}</span>
                      </td>
                      <td className={`px-4 py-3 ${darkMode ? 'text-gray-300 border-gray-700' : 'text-gray-900 border-gray-100'} border-b font-medium`}>
                        {port.name}
                      </td>
                      <td className={`px-4 py-3 ${darkMode ? 'text-gray-300 border-gray-700' : 'text-gray-900 border-gray-100'} border-b`}>
                        <span className="text-sm">{connectedTo || '-'}</span>
                      </td>
                      <td className={`px-4 py-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'} border-b`}>
                        <StatusBadge status={port.status as 'free' | 'used' | 'reserved'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredPorts.length === 0 && (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                暂无符合条件的端口数据
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};