import React from 'react';
import { useStore } from '../store/StoreContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Database, Cpu, Monitor, Settings, Link2, Archive, Wifi, Server } from 'lucide-react';

const statCards = [
  { label: '机房总数', icon: Database, key: 'datacenters' },
  { label: '机柜总数', icon: Server, key: 'racks' },
  { label: '设备总数', icon: Cpu, key: 'devices' },
  { label: '端口占用率', icon: Wifi, key: 'portUsage' },
];

const quickActions = [
  { label: '资源配置', icon: Settings, path: '/config' },
  { label: '机柜可视化', icon: Server, path: '/rack' },
  { label: '链路连接', icon: Link2, path: '/link' },
  { label: '数据备份', icon: Archive, path: '/backup' },
];

export const HomePage = () => {
  const { darkMode, datacenters, racks, servers, switches, seats, ports, setCurrentPage } = useStore();

  const deviceCount = servers.length + switches.length;
  const usedPorts = ports.filter((p) => p.status === 'used').length;
  const totalPorts = ports.length;
  const portUsageRate = totalPorts > 0 ? Math.round((usedPorts / totalPorts) * 100) : 0;

  const getStatValue = (key: string) => {
    switch (key) {
      case 'datacenters':
        return datacenters.length;
      case 'racks':
        return racks.length;
      case 'devices':
        return deviceCount;
      case 'portUsage':
        return `${portUsageRate}%`;
      default:
        return 0;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-bg-light'}`}>
      <Header title="数据总览" />
      <main className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.key}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {card.label}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {getStatValue(card.key)}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      darkMode ? 'bg-gray-700' : 'bg-primary/10'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${darkMode ? 'text-secondary' : 'text-primary'}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.path}
                onClick={() => setCurrentPage(action.path)}
                className="text-center py-6 cursor-pointer"
              >
                <div
                  className={`w-14 h-14 rounded-xl mx-auto flex items-center justify-center mb-3 ${
                    darkMode ? 'bg-gray-700' : 'bg-primary/10'
                  }`}
                >
                  <Icon className={`w-7 h-7 ${darkMode ? 'text-secondary' : 'text-primary'}`} />
                </div>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {action.label}
                </p>
              </Card>
            );
          })}
        </div>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              机房列表
            </h2>
            <button
              onClick={() => setCurrentPage('/config')}
              className={`text-sm font-medium ${darkMode ? 'text-secondary' : 'text-primary'}`}
            >
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {datacenters.slice(0, 3).map((dc) => (
              <div
                key={dc.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      darkMode ? 'bg-primary' : 'bg-primary'
                    }`}
                  >
                    <Monitor className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {dc.name}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {dc.location}
                    </p>
                  </div>
                </div>
                <StatusBadge status="online" />
              </div>
            ))}
            {datacenters.length === 0 && (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                暂无机房数据
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              端口状态概览
            </h2>
            <button
              onClick={() => setCurrentPage('/ports')}
              className={`text-sm font-medium ${darkMode ? 'text-secondary' : 'text-primary'}`}
            >
              详细查看
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
              <div className="w-10 h-10 rounded-full mx-auto mb-2 bg-green-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {ports.filter((p) => p.status === 'free').length}
                </span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>空闲端口</p>
            </div>
            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
              <div className="w-10 h-10 rounded-full mx-auto mb-2 bg-red-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {ports.filter((p) => p.status === 'used').length}
                </span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>已占用端口</p>
            </div>
            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="w-10 h-10 rounded-full mx-auto mb-2 bg-gray-400 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {ports.filter((p) => p.status === 'reserved').length}
                </span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>待配置端口</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};