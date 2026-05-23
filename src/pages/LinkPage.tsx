import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/StoreContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { Port, Link } from '../types';
import { Plus, X, Server, Network, Monitor, Cpu, RefreshCw } from 'lucide-react';

const portTypeLabels: Record<string, string> = {
  server: '服务器端口',
  switch: '交换机端口',
  seat: '座位端口',
  rack: '机柜端口',
};

const portTypeIcons: Record<string, typeof Server> = {
  server: Server,
  switch: Network,
  seat: Monitor,
  rack: Server,
};

export const LinkPage = () => {
  const { darkMode, ports, links, servers, switches, seats, addLink, deleteLink, datacenters, racks, saveConfig } = useStore();
  const [selectedDatacenterId, setSelectedDatacenterId] = useState<string>('');
  const [selectedRackId, setSelectedRackId] = useState<string>('');
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // 端口类型标签配置
  const typeTabs = [
    { key: 'all', label: '全部', color: '#6B7280' },
    { key: 'server', label: '服务器端口', color: '#3B82F6' },
    { key: 'switch', label: '交换机端口', color: '#10B981' },
    { key: 'seat', label: '座位端口', color: '#F59E0B' },
    { key: 'rack', label: '机柜端口', color: '#8B5CF6' },
  ];

  // 初始化选择
  useEffect(() => {
    if (datacenters.length > 0 && !selectedDatacenterId) {
      setSelectedDatacenterId(datacenters[0].id);
    }
  }, [datacenters, selectedDatacenterId]);

  useEffect(() => {
    if (datacenters.length > 0 && selectedDatacenterId) {
      const datacenterRacks = racks.filter((r) => r.datacenterId === selectedDatacenterId);
      if (datacenterRacks.length > 0 && !selectedRackId) {
        setSelectedRackId(datacenterRacks[0].id);
      } else if (datacenterRacks.length === 0) {
        setSelectedRackId('');
      }
    }
  }, [datacenters, selectedDatacenterId, racks, selectedRackId]);



  // 根据选择的机房和机柜过滤端口
  const filteredPorts = ports.filter((port) => {
    // 类型筛选
    if (selectedType !== 'all' && port.deviceType !== selectedType) {
      return false;
    }

    if (port.deviceType === 'server') {
      const server = servers.find((s) => s.id === port.deviceId);
      if (!server) return false;
      const rack = racks.find((r) => r.id === server.rackId);
      if (!rack) return false;
      if (selectedRackId && rack.id !== selectedRackId) return false;
      if (selectedDatacenterId && rack.datacenterId !== selectedDatacenterId) return false;
    } else if (port.deviceType === 'switch') {
      const sw = switches.find((s) => s.id === port.deviceId);
      if (!sw) return false;
      const rack = racks.find((r) => r.id === sw.rackId);
      if (!rack) return false;
      if (selectedRackId && rack.id !== selectedRackId) return false;
      if (selectedDatacenterId && rack.datacenterId !== selectedDatacenterId) return false;
    } else if (port.deviceType === 'seat') {
      const seat = seats.find((s) => s.id === port.deviceId);
      if (!seat) return false;
      if (selectedDatacenterId && seat.datacenterId !== selectedDatacenterId) return false;
    } else if (port.deviceType === 'rack') {
      const rack = racks.find((r) => r.id === port.deviceId);
      if (!rack) return false;
      if (selectedRackId && rack.id !== selectedRackId) return false;
      if (selectedDatacenterId && rack.datacenterId !== selectedDatacenterId) return false;
    }

    return true;
  });

  // 根据选择的机房和机柜过滤链路（只显示与当前选择相关的链路）
  const filteredLinks = links.filter((link) => {
    const fromPort = ports.find((p) => p.id === link.fromPortId);
    const toPort = ports.find((p) => p.id === link.toPortId);
    
    if (!fromPort || !toPort) return false;

    // 检查源端口是否在当前选择范围内
    const isFromPortInScope = isPortInScope(fromPort);
    // 检查目标端口是否在当前选择范围内
    const isToPortInScope = isPortInScope(toPort);

    // 只要有一个端口在范围内就显示
    return isFromPortInScope || isToPortInScope;
  });

  // 检查端口是否在当前选择的范围内
  function isPortInScope(port: Port): boolean {
    if (port.deviceType === 'server') {
      const server = servers.find((s) => s.id === port.deviceId);
      if (!server) return false;
      const rack = racks.find((r) => r.id === server.rackId);
      if (!rack) return false;
      if (selectedRackId && rack.id !== selectedRackId) return false;
      if (selectedDatacenterId && rack.datacenterId !== selectedDatacenterId) return false;
    } else if (port.deviceType === 'switch') {
      const sw = switches.find((s) => s.id === port.deviceId);
      if (!sw) return false;
      const rack = racks.find((r) => r.id === sw.rackId);
      if (!rack) return false;
      if (selectedRackId && rack.id !== selectedRackId) return false;
      if (selectedDatacenterId && rack.datacenterId !== selectedDatacenterId) return false;
    } else if (port.deviceType === 'seat') {
      const seat = seats.find((s) => s.id === port.deviceId);
      if (!seat) return false;
      if (selectedDatacenterId && seat.datacenterId !== selectedDatacenterId) return false;
    } else if (port.deviceType === 'rack') {
      const rack = racks.find((r) => r.id === port.deviceId);
      if (!rack) return false;
      if (selectedRackId && rack.id !== selectedRackId) return false;
      if (selectedDatacenterId && rack.datacenterId !== selectedDatacenterId) return false;
    }
    return true;
  }

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement;
        if (container) {
          setCanvasSize({ width: container.clientWidth, height: container.clientHeight });
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    console.log('链路画布刷新 - filteredLinks数量:', filteredLinks.length);
    drawLinks();
  }, [filteredLinks, ports, canvasSize, selectedDatacenterId, selectedRackId]);

  const drawLinks = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 计算布局参数 - 增加文字区域，缩短连接线
    const padding = 40;
    const textAreaWidth = 180; // 增加文字区域宽度
    const leftX = padding + textAreaWidth; // 左侧端口位置（文字区域后）
    const rightX = canvas.width - padding - textAreaWidth; // 右侧端口位置（文字区域前）
    const centerX = (leftX + rightX) / 2;
    const startY = 60;
    const rowHeight = 40;

    // 获取端口的设备信息
    const getDeviceInfo = (port: Port) => {
      switch (port.deviceType) {
        case 'server':
          return { name: servers.find((s) => s.id === port.deviceId)?.name || 'Unknown', type: 'server' };
        case 'switch':
          return { name: switches.find((s) => s.id === port.deviceId)?.name || 'Unknown', type: 'switch' };
        case 'seat':
          return { name: seats.find((s) => s.id === port.deviceId)?.name || 'Unknown', type: 'seat' };
        case 'rack':
          return { name: racks.find((r) => r.id === port.deviceId)?.name || 'Unknown', type: 'rack' };
        default:
          return { name: 'Unknown', type: 'unknown' };
      }
    };

    // 获取端口的X位置
    const getPortX = (deviceType: string) => {
      switch (deviceType) {
        case 'server':
        case 'rack':
          return leftX;
        case 'switch':
          return rightX;
        case 'seat':
        default:
          return centerX;
      }
    };

    // 获取端口颜色
    const getPortColor = (deviceType: string) => {
      switch (deviceType) {
        case 'server':
          return '#3B82F6';
        case 'switch':
          return '#10B981';
        case 'seat':
          return '#F59E0B';
        case 'rack':
          return '#8B5CF6';
        default:
          return '#6B7280';
      }
    };

    // 获取端口的完整标签信息（包含机柜名）
    const getPortLabel = (port: Port) => {
      const device = getDeviceInfo(port);
      switch (device.type) {
        case 'server': {
          const server = servers.find((s) => s.id === port.deviceId);
          const rack = server ? racks.find((r) => r.id === server.rackId) : null;
          const rackName = rack ? rack.name : 'Unknown Rack';
          return `${rackName} > ${device.name} (U${server?.uPosition}) ${port.name}`;
        }
        case 'switch': {
          const sw = switches.find((s) => s.id === port.deviceId);
          const rack = sw ? racks.find((r) => r.id === sw.rackId) : null;
          const rackName = rack ? rack.name : 'Unknown Rack';
          return `${rackName} > ${device.name} (U${sw?.uPosition}) ${port.name}`;
        }
        case 'seat': {
          return `${device.name} ${port.name}`;
        }
        case 'rack': {
          return `${device.name} ${port.name}`;
        }
        default:
          return port.name;
      }
    };

    // 按链路分组绘制，确保同一条链路在同一水平线上，起始端在左侧，结束端在右侧（只绘制过滤后的链路）
    filteredLinks.forEach((link, index) => {
      const fromPort = ports.find((p) => p.id === link.fromPortId);
      const toPort = ports.find((p) => p.id === link.toPortId);
      
      if (!fromPort || !toPort) return;
      
      const fromDevice = getDeviceInfo(fromPort);
      const toDevice = getDeviceInfo(toPort);
      
      // 起始端始终在左侧，结束端始终在右侧
      const startX = leftX;
      const endX = rightX;
      const rowY = startY + index * rowHeight;
      
      // 绘制起始端口（左侧）
      ctx.beginPath();
      ctx.arc(startX, rowY, 6, 0, Math.PI * 2);
      ctx.fillStyle = getPortColor(fromDevice.type);
      ctx.fill();
      
      // 起始端口标签（显示丰富信息）
      ctx.fillStyle = darkMode ? '#E5E7EB' : '#374151';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(getPortLabel(fromPort), startX - 10, rowY + 4);
      
      // 绘制结束端口（右侧）
      ctx.beginPath();
      ctx.arc(endX, rowY, 6, 0, Math.PI * 2);
      ctx.fillStyle = getPortColor(toDevice.type);
      ctx.fill();
      
      // 结束端口标签（显示丰富信息）
      ctx.fillStyle = darkMode ? '#E5E7EB' : '#374151';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(getPortLabel(toPort), endX + 10, rowY + 4);
      
      // 绘制水平连接线（从左到右，离开圆点边缘）
      const portRadius = 6; // 端口圆点半径
      const lineStartX = startX + portRadius + 4; // 离开圆点边缘4像素
      const lineEndX = endX - portRadius - 4; // 离开圆点边缘4像素
      
      ctx.beginPath();
      ctx.moveTo(lineStartX, rowY);
      ctx.lineTo(lineEndX, rowY);
      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 绘制箭头（指向右侧，靠近终点圆点）
      const arrowSize = 8;
      ctx.beginPath();
      ctx.moveTo(lineEndX - arrowSize * Math.cos(-Math.PI / 6), rowY - arrowSize * Math.sin(-Math.PI / 6));
      ctx.lineTo(lineEndX, rowY);
      ctx.lineTo(lineEndX - arrowSize * Math.cos(Math.PI / 6), rowY - arrowSize * Math.sin(Math.PI / 6));
      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 绘制图例（放在顶部）
    const legendY = startY - 20; // 图例放在链路上方
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    
    // 服务器端口
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(padding + 6, legendY - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = darkMode ? '#9CA3AF' : '#6B7280';
    ctx.fillText('服务器端口', padding + 16, legendY);
    
    // 交换机端口
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(padding + 100 + 6, legendY - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = darkMode ? '#9CA3AF' : '#6B7280';
    ctx.fillText('交换机端口', padding + 100 + 16, legendY);
    
    // 座位端口
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(padding + 200 + 6, legendY - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = darkMode ? '#9CA3AF' : '#6B7280';
    ctx.fillText('座位端口', padding + 200 + 16, legendY);
    
    // 机柜端口
    ctx.fillStyle = '#8B5CF6';
    ctx.beginPath();
    ctx.arc(padding + 290 + 6, legendY - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = darkMode ? '#9CA3AF' : '#6B7280';
    ctx.fillText('机柜端口', padding + 290 + 16, legendY);
  };

  const getLinkByPort = (portId: string): Link | undefined => {
    return links.find((l) => l.fromPortId === portId || l.toPortId === portId);
  };

  const clearPortLink = useCallback((port: Port) => {
    const link = getLinkByPort(port.id);
    if (link) {
      deleteLink(link.id);
    }
    setSelectedPort(null);
    setIsConnecting(false);
  }, [links, deleteLink]);

  const handlePortClick = (port: Port) => {
    if (!isConnecting) {
      setSelectedPort(port);
      setIsConnecting(true);
    } else if (selectedPort && selectedPort.id !== port.id) {
      addLink({
        fromPortId: selectedPort.id,
        toPortId: port.id,
        note: `${getPortLabel(selectedPort)} -> ${getPortLabel(port)}`,
      });
      setSelectedPort(null);
      setIsConnecting(false);
    }
  };

  const getPortLabel = (port: Port): string => {
    let deviceName: string | undefined;
    switch (port.deviceType) {
      case 'server':
        deviceName = servers.find((s) => s.id === port.deviceId)?.name;
        break;
      case 'switch':
        deviceName = switches.find((s) => s.id === port.deviceId)?.name;
        break;
      case 'seat':
        deviceName = seats.find((s) => s.id === port.deviceId)?.name;
        break;
      case 'rack':
        deviceName = racks.find((r) => r.id === port.deviceId)?.name;
        break;
    }
    return `${deviceName || 'Unknown'} - ${port.name}`;
  };

  const handleDeleteLink = () => {
    if (selectedLink) {
      deleteLink(selectedLink.id);
      setSelectedLink(null);
      setIsModalOpen(false);
    }
  };

  // 获取当前筛选类型的标签信息
  const getCurrentTypeLabel = () => {
    const tab = typeTabs.find((t) => t.key === selectedType);
    return tab ? tab.label : '全部';
  };

  // 获取当前筛选类型的颜色
  const getCurrentTypeColor = () => {
    const tab = typeTabs.find((t) => t.key === selectedType);
    return tab ? tab.color : '#6B7280';
  };

  // 获取当前机房下的机柜列表
  const datacenterRacks = racks.filter((r) => r.datacenterId === selectedDatacenterId);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-bg-light'}`}>
      <Header title="链路连接" />
      <main className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              端口列表
            </h2>
            
            {/* 机房选择 */}
            <div className="mb-3">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                选择机房
              </label>
              <select
                value={selectedDatacenterId}
                onChange={(e) => {
                  setSelectedDatacenterId(e.target.value);
                  setSelectedRackId('');
                }}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-primary`}
              >
                <option value="">全部机房</option>
                {datacenters.map((dc) => (
                  <option key={dc.id} value={dc.id}>
                    {dc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 机柜选择 */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                选择机柜
              </label>
              <select
                value={selectedRackId}
                onChange={(e) => setSelectedRackId(e.target.value)}
                disabled={!selectedDatacenterId}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white disabled:opacity-50'
                    : 'bg-white border-gray-300 text-gray-900 disabled:opacity-50'
                } focus:outline-none focus:ring-2 focus:ring-primary`}
              >
                <option value="">全部机柜</option>
                {datacenterRacks.map((rack) => (
                  <option key={rack.id} value={rack.id}>
                    {rack.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              {/* 类型标签筛选 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {typeTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedType(tab.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedType === tab.key
                        ? 'text-white shadow-md'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={selectedType === tab.key ? { backgroundColor: tab.color } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tab.color }}
                    />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 端口列表 */}
              {selectedType === 'all' ? (
                // 全部模式：按类型分组显示
                <>
                  {Object.entries({
                    server: filteredPorts.filter((p) => p.deviceType === 'server'),
                    switch: filteredPorts.filter((p) => p.deviceType === 'switch'),
                    seat: filteredPorts.filter((p) => p.deviceType === 'seat'),
                    rack: filteredPorts.filter((p) => p.deviceType === 'rack'),
                  }).map(([type, typePorts]) => {
                    if (typePorts.length === 0) return null;
                    const Icon = portTypeIcons[type];
                    return (
                      <div key={type}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 ${darkMode ? 'text-secondary' : 'text-primary'}`} />
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {portTypeLabels[type]} ({typePorts.length})
                          </span>
                        </div>
                        <div className="space-y-1">
                          {typePorts.map((port) => (
                            <PortItem
                              key={port.id}
                              port={port}
                              selectedPort={selectedPort}
                              onPortClick={handlePortClick}
                              onClearPort={clearPortLink}
                              darkMode={darkMode}
                              getPortLabel={getPortLabel}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                // 单类型模式：直接显示端口列表
                <>
                  {filteredPorts.length > 0 && (
                    <div className="text-sm font-medium mb-2" style={{ color: getCurrentTypeColor() }}>
                      {getCurrentTypeLabel()} ({filteredPorts.length})
                    </div>
                  )}
                  <div className="space-y-1">
                    {filteredPorts.map((port) => (
                      <PortItem
                        key={port.id}
                        port={port}
                        selectedPort={selectedPort}
                        onPortClick={handlePortClick}
                        onClearPort={clearPortLink}
                        darkMode={darkMode}
                        getPortLabel={getPortLabel}
                      />
                    ))}
                  </div>
                </>
              )}

              {filteredPorts.length === 0 && (
                <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  暂无端口
                </p>
              )}
            </div>
            {isConnecting && selectedPort && (
              <div className={`mt-4 p-3 rounded-lg ${selectedPort.status === 'used' ? (darkMode ? 'bg-red-900/30' : 'bg-red-50') : (darkMode ? 'bg-primary/20' : 'bg-primary/10')}`}>
                <p className={`text-sm ${selectedPort.status === 'used' ? 'text-red-400' : (darkMode ? 'text-secondary' : 'text-primary')}`}>
                  已选择: {getPortLabel(selectedPort)}
                </p>
                {selectedPort.status === 'used' ? (
                  <>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      此端口已被占用，可清除相关链路后重新连接
                    </p>
                    <Button
                      variant="danger"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => clearPortLink(selectedPort)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      清除链路
                    </Button>
                  </>
                ) : (
                  <>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      点击另一个端口完成连接，或点击下方按钮取消
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        setSelectedPort(null);
                        setIsConnecting(false);
                      }}
                    >
                      取消连接
                    </Button>
                  </>
                )}
              </div>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                链路画布
              </h2>
            </div>
            <div className={`relative rounded-lg overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} style={{ height: '400px' }}>
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="w-full h-full"
              />
            </div>
          </Card>
        </div>

        <Card className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              已建立链路 ({filteredLinks.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredLinks.map((link) => {
              const fromPort = ports.find((p) => p.id === link.fromPortId);
              const toPort = ports.find((p) => p.id === link.toPortId);
              return (
                <div
                  key={link.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                  onClick={() => {
                    setSelectedLink(link);
                    setIsModalOpen(true);
                  }}
                >
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {link.note}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {fromPort?.name} <span className="mx-1">→</span> {toPort?.name}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLink(link.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {filteredLinks.length === 0 && (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                暂无链路，点击左侧端口开始建立连接
              </p>
            )}
          </div>
        </Card>
      </main>

      <Modal
        isOpen={isModalOpen}
        title="链路详情"
        onClose={() => setIsModalOpen(false)}
        showConfirm={false}
      >
        {selectedLink && (
          <div className="space-y-4">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>链路描述</p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedLink.note}
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
                关闭
              </Button>
              <Button variant="danger" onClick={handleDeleteLink} className="flex-1">
                <X className="w-4 h-4 mr-1" />
                删除链路
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// 端口列表项组件
interface PortItemProps {
  port: Port;
  selectedPort: Port | null;
  onPortClick: (port: Port) => void;
  onClearPort: (port: Port) => void;
  darkMode: boolean;
  getPortLabel: (port: Port) => string;
}

const PortItem = ({ port, selectedPort, onPortClick, onClearPort, darkMode, getPortLabel }: PortItemProps) => (
  <div
    className={`flex items-center justify-between p-2 rounded-lg ${
      selectedPort?.id === port.id
        ? 'bg-primary'
        : port.status === 'used'
        ? darkMode
          ? 'bg-red-900/30'
          : 'bg-red-50'
        : darkMode
        ? 'bg-gray-700'
        : 'bg-gray-100'
    }`}
  >
    <button
      onClick={() => onPortClick(port)}
      className={`flex-1 flex items-center gap-2 text-left transition-colors ${
        selectedPort?.id === port.id
          ? 'text-white'
          : port.status === 'used'
          ? 'text-red-400'
          : darkMode
          ? 'text-gray-300 hover:text-white'
          : 'text-gray-700 hover:text-gray-900'
      }`}
    >
      <Cpu className="w-3 h-3" />
      <span className="text-sm truncate max-w-[120px]">
        {getPortLabel(port)}
      </span>
    </button>
    <div className="flex items-center gap-2">
      <StatusBadge status={port.status} />
      {port.status === 'used' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClearPort(port);
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            darkMode
              ? 'hover:bg-red-800 text-red-400'
              : 'hover:bg-red-100 text-red-500'
          }`}
          title="释放端口"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);