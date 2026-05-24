import React, { useState, useEffect } from 'react';
import { Monitor, Settings, Link2, Archive, Palette, Save, Database, Wifi, CheckCircle, XCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { useStore } from '../store/StoreContext';

interface HeaderProps {
  title: string;
  showSave?: boolean;
}

const navItems = [
  { path: '/', label: '首页', icon: Monitor },
  { path: '/config', label: '资源配置', icon: Settings },
  { path: '/rack', label: '机柜可视化', icon: Database },
  { path: '/link', label: '链路连接', icon: Link2 },
  { path: '/ports', label: '端口管理', icon: Wifi },
  { path: '/backup', label: '数据备份', icon: Archive },
];

export const Header = ({ title, showSave = false }: HeaderProps) => {
  const { darkMode, toggleDarkMode, saveConfig, currentPage, setCurrentPage, addToast, datacenters, racks, servers, switches, seats, ports, links } = useStore();
  const [saveModal, setSaveModal] = useState<{ isOpen: boolean; success: boolean; message: string }>({
    isOpen: false,
    success: false,
    message: '',
  });
  const [helpModal, setHelpModal] = useState(false);
  const [countdown, setCountdown] = useState(2);

  // 倒计时自动关闭
  useEffect(() => {
    if (saveModal.isOpen && saveModal.success) {
      setCountdown(2);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setSaveModal({ ...saveModal, isOpen: false });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [saveModal.isOpen, saveModal.success]);

  const handleSaveConfig = async () => {
    try {
      const config = JSON.stringify({ datacenters, racks, servers, switches, seats, ports, links }, null, 2);
      
      if (config.length > 5 * 1024 * 1024) {
        setSaveModal({ isOpen: true, success: false, message: '保存失败：配置数据过大，请清理不需要的数据' });
        return;
      }

      localStorage.setItem('networkConfig', config);
      
      const savedConfig = localStorage.getItem('networkConfig');
      if (!savedConfig) {
        setSaveModal({ isOpen: true, success: false, message: '保存失败：数据未写入浏览器存储' });
        return;
      }

      setSaveModal({ isOpen: true, success: true, message: '配置保存成功！' });
      addToast('success', '配置已保存');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setSaveModal({ isOpen: true, success: false, message: '保存失败：' + errorMessage });
      addToast('error', '保存失败：' + errorMessage);
    }
  };

  return (
    <header className={`sticky top-0 z-50 ${darkMode ? 'bg-dark border-gray-700' : 'bg-white border-gray-200'} border-b`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-primary' : 'bg-primary'}`}>
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>机房网线可视化管理</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showSave && (
            <button
              onClick={handleSaveConfig}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              保存配置
            </button>
          )}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
          >
            <Palette className="w-5 h-5" />
          </button>
          <button
            onClick={() => setHelpModal(true)}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-blue-400' : 'bg-gray-100 hover:bg-gray-200 text-blue-600'}`}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
      <nav className="flex border-t overflow-x-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.path;
          return (
            <button
              key={item.path}
              onClick={() => setCurrentPage(item.path)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      {saveModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className={`bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl ${darkMode ? 'bg-gray-800' : ''}`}>
            <div className="flex items-center gap-4">
              {saveModal.success ? (
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
              )}
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {saveModal.success ? '保存成功' : '保存失败'}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {saveModal.message}
                </p>
                {saveModal.success && (
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {countdown > 0 ? `${countdown}秒后自动关闭` : '即将关闭...'}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSaveModal({ ...saveModal, isOpen: false })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  saveModal.success
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {saveModal.success ? `${countdown > 0 ? `确定 (${countdown})` : '确定'}` : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {helpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className={`bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl ${darkMode ? 'bg-gray-800' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                帮助文档
              </h3>
              <button
                onClick={() => setHelpModal(false)}
                className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className={`space-y-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <p>
                <a
                  href="https://cablemanager.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1 text-blue-400 hover:underline ${darkMode ? '' : 'text-blue-600'}`}
                >
                  https://cablemanager.vercel.app/
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <p className="whitespace-pre-line">
                面向机房运维人员、网络管理员的可视化网线连接管理工具，核心实现机房网络物理链路的可视化配置、端口占用管控、配置持久化存储与备份恢复，解决机房网线杂乱、端口复用、链路追溯困难的运维痛点，全程本地操作，无云端依赖，数据安全可控。
              </p>
              <p className="whitespace-pre-line">
                本地数据导出后，可以在任意其它设备上访问上面网页并导入数据即可以实现同步。数据完全自主可控。
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setHelpModal(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};