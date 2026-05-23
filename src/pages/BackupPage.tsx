import React, { useState, useRef } from 'react';
import { useStore } from '../store/StoreContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Download, Upload, FileJson, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const BackupPage = () => {
  const { darkMode, exportConfig, importConfig, saveConfig, addToast } = useStore();
  const [exportName, setExportName] = useState('network_config');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [importWarning, setImportWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const config = exportConfig();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportName}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('success', '配置导出成功');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      addToast('error', '请选择JSON格式的配置文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (importWarning) {
        setIsConfirmModalOpen(true);
        localStorage.setItem('tempConfig', content);
      } else {
        try {
          importConfig(content);
          addToast('success', '配置导入成功');
        } catch (error) {
          addToast('error', '配置导入失败：' + (error as Error).message);
        }
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    const config = localStorage.getItem('tempConfig');
    if (config) {
      try {
        importConfig(config);
        localStorage.removeItem('tempConfig');
        addToast('success', '配置导入成功');
      } catch (error) {
        addToast('error', '配置导入失败：' + (error as Error).message);
      }
    }
    setIsConfirmModalOpen(false);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleSaveToLocal = () => {
    saveConfig();
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-bg-light'}`}>
      <Header title="数据备份" />
      <main className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${darkMode ? 'bg-primary' : 'bg-primary'}`}>
                <Upload className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  导出配置
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  将当前配置导出为JSON文件
                </p>
              </div>
            </div>

            <Input
              label="导出文件名"
              name="exportName"
              value={exportName}
              onChange={setExportName}
              placeholder="network_config"
            />

            <Button className="w-full" onClick={handleExport}>
              <FileJson className="w-4 h-4 mr-2" />
              导出配置文件
            </Button>
          </Card>

          <Card>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${darkMode ? 'bg-green-600' : 'bg-green-500'}`}>
                <Download className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  导入配置
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  从JSON文件导入配置
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="importWarning"
                checked={importWarning}
                onChange={(e) => setImportWarning(e.target.checked)}
                className={`w-4 h-4 rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} focus:ring-primary`}
              />
              <label htmlFor="importWarning" className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                导入前备份当前配置
              </label>
            </div>

            <Button variant="secondary" className="w-full" onClick={handleImport}>
              <Download className="w-4 h-4 mr-2" />
              选择配置文件
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </Card>
        </div>

        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${darkMode ? 'bg-yellow-600' : 'bg-yellow-500'}`}>
              <Clock className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                自动保存
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                将当前配置保存到本地存储
              </p>
            </div>
          </div>

          <Button variant="secondary" className="w-full" onClick={handleSaveToLocal}>
            <CheckCircle className="w-4 h-4 mr-2" />
            立即保存配置
          </Button>

          <p className={`text-xs mt-4 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            配置将自动保存到浏览器本地存储，刷新页面后数据不会丢失
          </p>
        </Card>
      </main>

      <Modal
        isOpen={isConfirmModalOpen}
        title="确认导入"
        onClose={() => setIsConfirmModalOpen(false)}
        confirmText="确认导入"
        cancelText="取消"
        onConfirm={confirmImport}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">导入配置将覆盖当前所有数据</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              确定要继续吗？此操作无法撤销。
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};