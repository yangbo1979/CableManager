import React, { useState, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Select } from '../components/Select';
import { Server, Network, X, Link2 } from 'lucide-react';

export const RackPage = () => {
  const { darkMode, racks, servers, switches, datacenters, seats, ports, links } = useStore();
  const [selectedRackId, setSelectedRackId] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<{ device: any; type: 'server' | 'switch' } | null>(null);
  const [selectedPort, setSelectedPort] = useState<any>(null);

  useEffect(() => {
    if (racks.length > 0 && !selectedRackId) {
      setSelectedRackId(racks[0].id);
    }
  }, [racks]);

  useEffect(() => {
    setSelectedDevice(null);
  }, [selectedRackId]);

  const handleRackChange = (newRackId: string) => {
    setSelectedRackId(newRackId);
  };

  const handleDeviceClick = (device: any, type: 'server' | 'switch') => {
    setSelectedDevice({ device, type });
  };

  const closeDeviceModal = () => {
    setSelectedDevice(null);
  };

  const closePortModal = () => {
    setSelectedPort(null);
  };

  // 获取端口的完整信息
  const getPortDetails = (port: any) => {
    // 首先获取当前端口所属设备的信息
    let currentDeviceInfo: any = null;
    let currentDeviceType: string = '';
    let currentRackInfo: any = null;
    let currentDatacenterInfo: any = null;
    
    if (port.deviceType === 'server') {
      currentDeviceInfo = servers.find(s => s.id === port.deviceId);
      currentDeviceType = '服务器';
    } else if (port.deviceType === 'switch') {
      currentDeviceInfo = switches.find(s => s.id === port.deviceId);
      currentDeviceType = '交换机';
    } else if (port.deviceType === 'rack') {
      currentDeviceInfo = racks.find(r => r.id === port.deviceId);
      currentDeviceType = '机柜';
    } else if (port.deviceType === 'seat') {
      currentDeviceInfo = seats.find(s => s.id === port.deviceId);
      currentDeviceType = '座位';
    }

    // 获取当前端口的机柜信息
    if (port.deviceType === 'rack') {
      currentRackInfo = currentDeviceInfo;
    } else if (port.deviceType === 'server' || port.deviceType === 'switch') {
      currentRackInfo = racks.find(r => r.id === currentDeviceInfo?.rackId);
    }

    // 获取当前端口的机房信息
    if (currentRackInfo?.datacenterId) {
      currentDatacenterInfo = datacenters.find(d => d.id === currentRackInfo.datacenterId);
    } else if (port.deviceType === 'seat' && currentDeviceInfo?.datacenterId) {
      currentDatacenterInfo = datacenters.find(d => d.id === currentDeviceInfo.datacenterId);
    }

    // 然后获取连接信息
    const connection = getPortConnection(port.id);
    let otherPort = null;
    let otherDeviceInfo: any = null;
    let otherDeviceType: string = '';
    let otherRackInfo: any = null;
    let otherDatacenterInfo: any = null;
    
    if (connection && connection.otherPort) {
      otherPort = connection.otherPort;
      
      // 获取对端设备信息
      if (otherPort.deviceType === 'server') {
        otherDeviceInfo = servers.find(s => s.id === otherPort.deviceId);
        otherDeviceType = '服务器';
      } else if (otherPort.deviceType === 'switch') {
        otherDeviceInfo = switches.find(s => s.id === otherPort.deviceId);
        otherDeviceType = '交换机';
      } else if (otherPort.deviceType === 'rack') {
        otherDeviceInfo = racks.find(r => r.id === otherPort.deviceId);
        otherDeviceType = '机柜';
      } else if (otherPort.deviceType === 'seat') {
        otherDeviceInfo = seats.find(s => s.id === otherPort.deviceId);
        otherDeviceType = '座位';
      }

      // 获取对端机柜信息
      if (otherPort.deviceType === 'rack') {
        otherRackInfo = otherDeviceInfo;
      } else if (otherPort.deviceType === 'server' || otherPort.deviceType === 'switch') {
        otherRackInfo = racks.find(r => r.id === otherDeviceInfo?.rackId);
      } else if (otherPort.deviceType === 'seat') {
        // 座位可能没有机柜，需要另外处理
      }

      // 获取对端机房信息
      if (otherRackInfo?.datacenterId) {
        otherDatacenterInfo = datacenters.find(d => d.id === otherRackInfo.datacenterId);
      } else if (otherPort.deviceType === 'seat' && otherDeviceInfo?.datacenterId) {
        otherDatacenterInfo = datacenters.find(d => d.id === otherDeviceInfo.datacenterId);
      }
    }

    // 至少返回当前端口信息
    return {
      currentPort: port,
      currentDevice: currentDeviceInfo,
      currentDeviceType: currentDeviceType,
      currentRack: currentRackInfo,
      currentDatacenter: currentDatacenterInfo,
      otherPort: otherPort,
      otherDevice: otherDeviceInfo,
      otherDeviceType: otherDeviceType,
      otherRack: otherRackInfo,
      otherDatacenter: otherDatacenterInfo,
      link: connection?.link
    };
  };

  // 处理端口点击
  const handlePortClick = (port: any) => {
    const connection = getPortConnection(port.id);
    // 只有当有连接关系时才显示弹窗
    if (connection && connection.otherPort) {
      setSelectedPort(port);
    }
  };

  const selectedRack = racks.find((r) => r.id === selectedRackId);
  const rackServers = servers.filter((s) => s.rackId === selectedRackId);
  const rackSwitches = switches.filter((s) => s.rackId === selectedRackId);

  const uHeight = selectedRack?.uHeight || 42;
  const uPositions = Array.from({ length: uHeight }, (_, i) => i + 1); // 从1到uHeight

  const getDeviceAtU = (u: number) => {
    const server = rackServers.find(
      (s) => s.uPosition <= u && s.uPosition + s.uHeight - 1 >= u
    );
    if (server) {
      return { ...server, type: 'server' as const };
    }
    
    const sw = rackSwitches.find(
      (s) => s.uPosition <= u && s.uPosition + s.uHeight - 1 >= u
    );
    if (sw) {
      return { ...sw, type: 'switch' as const };
    }
    
    return null;
  };

  // 获取设备的端口（按类型过滤）
  const getDevicePorts = (deviceId: string, deviceType?: string) => {
    let filtered = ports.filter((p) => p.deviceId === deviceId);
    if (deviceType) {
      filtered = filtered.filter((p) => p.deviceType === deviceType);
    }
    return filtered;
  };

  // 获取端口的连接信息
  const getPortConnection = (portId: string) => {
    const link = links.find((l) => l.fromPortId === portId || l.toPortId === portId);
    if (!link) return null;
    
    const otherPortId = link.fromPortId === portId ? link.toPortId : link.fromPortId;
    const otherPort = ports.find((p) => p.id === otherPortId);
    
    return { link, otherPort };
  };

  const rackOptions = racks.map((r) => {
    const dc = datacenters.find((d) => d.id === r.datacenterId);
    return { value: r.id, label: `${dc?.name || ''} - ${r.name}` };
  });

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-bg-light'}`}>
      <Header title="机柜U位可视化" />
      <main className="p-4">
        <Card className="mb-4">
          <Select
            label="选择机柜"
            name="rack"
            value={selectedRackId}
            onChange={handleRackChange}
            options={rackOptions}
            required
          />
        </Card>

        {selectedRack && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedRack.name} - U位布局
              </h2>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                共 {uHeight}U | {selectedRack.portCount || 24}端口
              </span>
            </div>

            {/* 机柜端口展示 - 顶部一排 */}
            <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${selectedRack.portCount || 24}, minmax(0, 1fr))` }}>
                {(() => {
                  const rackPorts = getDevicePorts(selectedRack.id, 'rack');
                  const portCount = selectedRack.portCount || 24;
                  
                  // 如果没有实际端口数据，生成虚拟端口
                  if (rackPorts.length === 0) {
                    return Array.from({ length: portCount }, (_, i) => ({
                      id: `virtual-port-${i}`,
                      name: `Port${i + 1}`,
                      status: 'free' as const,
                      deviceType: 'rack',
                      deviceId: selectedRack.id,
                      createdAt: '',
                      updatedAt: '',
                    }));
                  }
                  
                  // 如果端口数量不足，补充虚拟端口
                  if (rackPorts.length < portCount) {
                    const additionalPorts = Array.from(
                      { length: portCount - rackPorts.length },
                      (_, i) => ({
                        id: `virtual-port-${i}`,
                        name: `Port${rackPorts.length + i + 1}`,
                        status: 'free' as const,
                        deviceType: 'rack',
                        deviceId: selectedRack.id,
                        createdAt: '',
                        updatedAt: '',
                      })
                    );
                    return [...rackPorts, ...additionalPorts];
                  }
                  
                  return rackPorts;
                })().map((port) => {
                  const connection = port.id.startsWith('virtual') ? null : getPortConnection(port.id);
                  const isConnected = !!connection;
                  const isVirtual = port.id.startsWith('virtual');
                  
                  // 根据状态设置颜色
                  let bgClass = '';
                  let borderClass = '';
                  let textClass = '';
                  let badgeClass = '';
                  
                  if (port.status === 'used' || isConnected) {
                    bgClass = 'bg-green-500/20';
                    borderClass = 'border-green-500';
                    textClass = 'text-green-500';
                    badgeClass = 'bg-green-500';
                  } else if (port.status === 'reserved') {
                    bgClass = 'bg-yellow-500/20';
                    borderClass = 'border-yellow-500';
                    textClass = 'text-yellow-500';
                    badgeClass = 'bg-yellow-500';
                  } else {
                    bgClass = darkMode ? 'bg-gray-600' : 'bg-white';
                    borderClass = darkMode ? 'border-gray-500' : 'border-gray-300';
                    textClass = darkMode ? 'text-gray-400' : 'text-gray-600';
                  }
                  
                  const isClickable = !isVirtual && isConnected;
                  
                  return (
                    <div
                      key={port.id}
                      className={`relative p-1.5 rounded border-2 transition-all ${bgClass} ${borderClass} ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}`}
                      title={`${port.name}: ${port.status === 'used' ? '已使用' : port.status === 'reserved' ? '已预留' : '空闲'}${isVirtual ? ' (虚拟)' : ''}`}
                      onClick={() => isClickable && handlePortClick(port)}
                    >
                      <span className={`text-xs font-medium ${textClass}`}>
                        {port.name}
                      </span>
                      {(port.status === 'used' || port.status === 'reserved') && (
                        <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${badgeClass} border-2 ${darkMode ? 'border-gray-700' : 'border-white'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* 图例 */}
              <div className="flex gap-4 mt-3 pt-3 border-t border-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} border-2`} />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>空闲</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-green-500/20 border-2 border-green-500" />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>已使用</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-yellow-500/20 border-2 border-yellow-500" />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>已预留</span>
                </div>
              </div>
            </div>

            <div className={`relative border-2 rounded-lg overflow-hidden ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-600 to-gray-500 flex flex-col justify-between overflow-hidden" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
                {[...uPositions.slice(0, uHeight)].reverse().map((u) => (
                  <span key={u} className="text-xs font-bold text-white">{u}</span>
                ))}
              </div>
              
              <div className="ml-12 p-2">
                {[...uPositions.slice(0, uHeight)].reverse().map((u) => {
                  const device = getDeviceAtU(u);
                  const isFirstOfDevice = device && u === device.uPosition;
                  const isLastOfDevice = device && u === device.uPosition + device.uHeight - 1;
                  
                  return (
                    <div
                      key={u}
                      className={`relative ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                      style={{ height: '32px' }}
                    >
                      {/* 背景色 - 统一使用蓝色系 */}
                      {device && (
                        <div
                          className={`absolute inset-0 ${
                            darkMode
                              ? 'bg-blue-800'
                              : 'bg-blue-500'
                          } ${isFirstOfDevice ? (darkMode ? 'rounded-t border-t-2 border-l-2 border-r-2 border-blue-400' : 'rounded-t border-t-2 border-l-2 border-r-2 border-blue-300') : ''} ${isLastOfDevice ? (darkMode ? 'rounded-b border-b-2 border-l-2 border-r-2 border-blue-400' : 'rounded-b border-b-2 border-l-2 border-r-2 border-blue-300') : (darkMode ? 'border-l-2 border-r-2 border-blue-400' : 'border-l-2 border-r-2 border-blue-300')}`}
                        />
                      )}
                      
                      {/* 设备内容 - 只在第一个U位显示，可点击 */}
                      {isFirstOfDevice && device && (
                        <div 
                          className="absolute inset-0 flex items-center px-3 z-10 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleDeviceClick(device, device.type)}
                        >
                          <div className="flex items-center gap-2 w-full">
                            {/* LED指示灯 */}
                            <div className="flex gap-1 flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                              <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                            </div>
                            
                            {/* 设备图标 */}
                            {device.type === 'server' ? (
                              <Server className="w-4 h-4 text-white flex-shrink-0" />
                            ) : (
                              <Network className="w-4 h-4 text-white flex-shrink-0" />
                            )}
                            
                            {/* 设备名称 */}
                            <span className="text-sm font-bold text-white truncate drop-shadow-lg">
                              {device.name}
                            </span>
                            
                            {/* 型号/端口数 */}
                            {device.type === 'server' ? (
                              <span className={`text-xs truncate text-blue-200 hidden md:block drop-shadow`}>
                                {device.model || 'Server'}
                              </span>
                            ) : (
                              <span className={`text-xs truncate text-blue-200 hidden md:block drop-shadow`}>
                                {device.portCount || 24} Ports
                              </span>
                            )}
                            
                            {/* U位标签 */}
                            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 bg-white ${device.type === 'server' ? 'text-blue-600' : 'text-blue-600'}`}>
                              U{device.uPosition}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* U位标记 */}
                      {!device && (
                        <div className={`absolute inset-0 flex items-center px-2 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                          <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                            U{u}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex gap-4 justify-center">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${darkMode ? 'bg-blue-800' : 'bg-blue-500'}`} />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>服务器</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${darkMode ? 'bg-blue-800' : 'bg-blue-500'}`} />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>交换机</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>空闲</span>
              </div>
            </div>
          </Card>
        )}

        {!selectedRack && (
          <Card>
            <p className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              请先选择机柜
            </p>
          </Card>
        )}
      </main>

      {/* 设备详情弹窗 */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={closeDeviceModal}>
          <div 
            className={`rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                {selectedDevice.type === 'server' ? (
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-blue-900' : 'bg-blue-500'}`}>
                    <Server className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-blue-900' : 'bg-blue-500'}`}>
                    <Network className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedDevice.device.name}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {selectedDevice.type === 'server' ? '服务器' : '交换机'} | U{selectedDevice.device.uPosition}-{selectedDevice.device.uPosition + selectedDevice.device.uHeight - 1}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDeviceModal}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
              {/* 设备基本信息 */}
              <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  设备信息
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedDevice.type === 'server' ? (
                    <>
                      <div>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>型号：</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>{selectedDevice.device.model || '-'}</span>
                      </div>
                      <div>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>端口数量：</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>{selectedDevice.device.portCount || 0} 个</span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>端口数量：</span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>{selectedDevice.device.portCount || 0} 个</span>
                    </div>
                  )}
                  <div>
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>占用U位：</span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>U{selectedDevice.device.uPosition} - U{selectedDevice.device.uPosition + selectedDevice.device.uHeight - 1}</span>
                  </div>
                </div>
              </div>

              {/* 端口列表 */}
              <div>
                <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  端口状态
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {getDevicePorts(selectedDevice.device.id).map((port) => {
                    const connection = getPortConnection(port.id);
                    const isConnected = !!connection;
                    const isClickable = port.status === 'used' || isConnected;
                    
                    return (
                      <div
                        key={port.id}
                        className={`p-3 rounded-lg border-2 ${
                          isConnected
                            ? darkMode
                              ? 'bg-green-900/30 border-green-700'
                              : 'bg-green-50 border-green-300'
                            : darkMode
                            ? 'bg-gray-700/50 border-gray-600'
                            : 'bg-gray-100 border-gray-200'
                        } ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}`}
                        onClick={() => isClickable && handlePortClick(port)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {port.name}
                          </span>
                          {port.status === 'used' || isConnected ? (
                            <Network className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
                          ) : (
                            <span className={`w-4 h-4 flex items-center justify-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>○</span>
                          )}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {port.status === 'free' ? '空闲' : port.status === 'used' ? '已使用' : port.status}
                        </div>
                        {isConnected && connection.otherPort && (
                          <div className={`mt-2 pt-2 border-t text-xs ${darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                            <div className="flex items-center gap-1">
                              <Link2 className="w-3 h-3" />
                              <span>点击查看详情</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {getDevicePorts(selectedDevice.device.id).length === 0 && (
                  <p className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    暂无端口配置
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 端口详情弹窗 */}
      {selectedPort && (() => {
        const portDetails = getPortDetails(selectedPort);
        if (!portDetails || !portDetails.otherPort) return null;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={closePortModal}>
            <div 
              className={`rounded-lg max-w-lg w-full overflow-hidden shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-green-900' : 'bg-green-500'}`}>
                    <Link2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      对端端口信息
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {portDetails.currentPort.name} → {portDetails.otherPort.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closePortModal}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="p-4">
                {/* 对端端口信息 */}
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>端口名称：</span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>{portDetails.otherPort.name}</span>
                    </div>
                    {portDetails.otherDeviceType && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>设备类型：</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>{portDetails.otherDeviceType}</span>
                      </div>
                    )}
                    {portDetails.otherDevice && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>设备名称：</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>{portDetails.otherDevice.name}</span>
                      </div>
                    )}
                    {portDetails.otherRack && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>机柜名称：</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>{portDetails.otherRack.name}</span>
                      </div>
                    )}
                    {portDetails.otherDatacenter && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>机房名称：</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>{portDetails.otherDatacenter.name}</span>
                      </div>
                    )}
                    {portDetails.otherDevice && portDetails.otherDevice.uPosition !== undefined && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>U位位置：</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>U{portDetails.otherDevice.uPosition}</span>
                      </div>
                    )}
                    {portDetails.otherDevice && portDetails.otherDevice.position && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>座位位置：</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>{portDetails.otherDevice.position}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};