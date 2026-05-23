import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { ResourceType, ConfigFormData } from '../types';
import { Plus, Edit2, Trash2, Building, Server, Network, Monitor, Cpu, ChevronDown, XCircle } from 'lucide-react';

const resourceTabs: { type: ResourceType; label: string; icon: typeof Building }[] = [
  { type: 'datacenter', label: '机房', icon: Building },
  { type: 'rack', label: '机柜', icon: Server },
  { type: 'server', label: '服务器', icon: Cpu },
  { type: 'switch', label: '交换机', icon: Network },
  { type: 'seat', label: '座位', icon: Monitor },
];

export const ConfigPage = () => {
  const {
    darkMode,
    datacenters,
    racks,
    servers,
    switches,
    seats,
    ports,
    selectedResourceType,
    setSelectedResourceType,
    createResource,
    updateResource,
    deleteResource,
    addToast,
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<ConfigFormData>({ 
    name: '', 
    location: '', 
    description: '',
    datacenterId: '',
    rackId: '',
    uHeight: 0,
    uPosition: 0,
    position: '',
    portCount: 0,
    model: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getResources = () => {
    switch (selectedResourceType) {
      case 'datacenter':
        return datacenters;
      case 'rack':
        return racks;
      case 'server':
        return servers;
      case 'switch':
        return switches;
      case 'seat':
        return seats;
    }
  };

  const getParentOptions = () => {
    switch (selectedResourceType) {
      case 'rack':
        return datacenters.map((d) => ({ value: d.id, label: d.name }));
      case 'server':
      case 'switch':
        return racks.map((r) => {
          const datacenter = datacenters.find(d => d.id === r.datacenterId);
          const datacenterName = datacenter ? datacenter.name + ' - ' : '';
          return { value: r.id, label: datacenterName + r.name };
        });
      case 'seat':
        return datacenters.map((d) => ({ value: d.id, label: d.name }));
      default:
        return [];
    }
  };

  const handleOpenModal = (mode: 'create' | 'edit', data?: ConfigFormData) => {
    setIsEditMode(mode === 'edit');
    const defaultPortCount = selectedResourceType === 'switch' ? 24 : (selectedResourceType === 'server' || selectedResourceType === 'seat') ? 4 : 0;
    const defaultUHeight = selectedResourceType === 'server' ? 1 : (selectedResourceType === 'switch' ? 1 : 0);
    const defaultUPosition = (selectedResourceType === 'server' || selectedResourceType === 'switch') ? 1 : 0;
    
    let initialDatacenterId = '';
    let initialRackId = '';
    
    if (selectedResourceType === 'rack' || selectedResourceType === 'seat') {
      const datacenterOptions = getParentOptions();
      if (datacenterOptions.length === 1) {
        initialDatacenterId = datacenterOptions[0].value;
      }
    } else if (selectedResourceType === 'server' || selectedResourceType === 'switch') {
      const rackOptions = getParentOptions();
      if (rackOptions.length === 1) {
        initialRackId = rackOptions[0].value;
      }
    }
    
    setFormData({ 
      name: '', 
      location: '', 
      description: '',
      datacenterId: initialDatacenterId,
      rackId: initialRackId,
      uHeight: defaultUHeight,
      uPosition: defaultUPosition,
      position: '',
      portCount: defaultPortCount,
      model: '',
      ...data 
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ 
      name: '', 
      location: '', 
      description: '',
      datacenterId: '',
      rackId: '',
      uHeight: 0,
      uPosition: 0,
      position: '',
      portCount: 0,
      model: '',
    });
    setIsEditMode(false);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      addToast('error', '请输入名称');
      return;
    }

    console.log('提交数据:', {
      type: selectedResourceType,
      name: formData.name,
      portCount: formData.portCount,
      fullData: formData
    });

    if (isEditMode && formData.id) {
      updateResource(selectedResourceType, formData.id, formData);
    } else {
      createResource(selectedResourceType, formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string, name: string) => {
    if (selectedResourceType === 'datacenter') {
      const hasRacks = racks.some(r => r.datacenterId === id);
      const hasSeats = seats.some(s => s.datacenterId === id);
      if (hasRacks || hasSeats) {
        setErrorMessage('有资源未释放，无法删除');
        return;
      }
    }
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteResource(selectedResourceType, deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const resources = getResources();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-bg-light'}`}>
      <Header title="资源配置" showSave />
      <main className="p-4">
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-thin pb-2">
          {resourceTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedResourceType === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => setSelectedResourceType(tab.type)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : darkMode
                    ? 'bg-gray-800 text-gray-400 hover:text-white'
                    : 'bg-white text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {resourceTabs.find((t) => t.type === selectedResourceType)?.label}列表
            </h2>
            <Button onClick={() => handleOpenModal('create')}>
              <Plus className="w-4 h-4 mr-1" />
              添加
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          {resources.map((resource: { id: string; name: string; location?: string; position?: string; model?: string; description?: string; uHeight?: number; uPosition?: number; datacenterId?: string; rackId?: string; portCount?: number }) => {
            const isExpanded = expandedId === resource.id;
            
            const getChildren = () => {
              switch (selectedResourceType) {
                case 'datacenter':
                  return {
                    racks: racks.filter(r => r.datacenterId === resource.id),
                    seats: seats.filter(s => s.datacenterId === resource.id),
                  };
                case 'rack':
                  return {
                    servers: servers.filter(s => s.rackId === resource.id),
                    switches: switches.filter(s => s.rackId === resource.id),
                  };
                case 'server':
                  return {
                    ports: ports.filter(p => p.deviceId === resource.id && p.deviceType === 'server'),
                  };
                case 'switch':
                  return {
                    ports: ports.filter(p => p.deviceId === resource.id && p.deviceType === 'switch'),
                  };
                case 'seat':
                  return {
                    ports: ports.filter(p => p.deviceId === resource.id && p.deviceType === 'seat'),
                  };
                default:
                  return {};
              }
            };
            
            const children = getChildren();
            
            console.log('资源详情:', {
              resourceType: selectedResourceType,
              resourceId: resource.id,
              resourcePortCount: resource.portCount,
              allPorts: ports,
              filteredPorts: children.ports
            });
            
            const hasChildren = Object.values(children).some((arr: any[]) => arr.length > 0);
            const canExpand = hasChildren || selectedResourceType === 'datacenter' || selectedResourceType === 'rack' || selectedResourceType === 'server' || selectedResourceType === 'switch' || selectedResourceType === 'seat';
            
            return (
              <div key={resource.id}>
                <Card className={canExpand ? 'cursor-pointer' : ''}>
                  <div 
                    className="flex items-center justify-between"
                    onClick={() => canExpand && setExpandedId(isExpanded ? null : resource.id)}
                  >
                    <div className="flex items-center gap-3">
                      {canExpand && (
                        <ChevronDown 
                          className={`w-5 h-5 transition-transform ${darkMode ? 'text-gray-400' : 'text-gray-500'} ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                      )}
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {resource.name}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {selectedResourceType === 'server' 
                            ? (() => {
                                const rack = racks.find(r => r.id === (resource as any).rackId);
                                const datacenter = rack ? datacenters.find(d => d.id === rack.datacenterId) : null;
                                return `${datacenter?.name || '-'} | ${resource.model || '-'} | ${resource.portCount || 4}端口`;
                              })()
                            : selectedResourceType === 'switch'
                            ? (() => {
                                const rack = racks.find(r => r.id === (resource as any).rackId);
                                const datacenter = rack ? datacenters.find(d => d.id === rack.datacenterId) : null;
                                return `${datacenter?.name || '-'} | ${resource.portCount || 24}端口`;
                              })()
                            : selectedResourceType === 'rack'
                            ? (() => {
                                const datacenter = datacenters.find(d => d.id === (resource as any).datacenterId);
                                return `所属机房: ${datacenter?.name || '-'} | ${resource.position || '-'} | ${resource.uHeight || 42}U | ${resource.portCount || 24}端口`;
                              })()
                            : selectedResourceType === 'seat'
                            ? (() => {
                                const datacenter = datacenters.find(d => d.id === (resource as any).datacenterId);
                                return `${datacenter?.name || '-'} | ${resource.position || '-'} | ${resource.portCount || 4}端口`;
                              })()
                            : resource.location || resource.position || resource.model || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status="online" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal('edit', {
                            id: resource.id,
                            name: resource.name,
                            location: resource.location,
                            description: resource.description,
                            position: resource.position,
                            model: resource.model,
                            datacenterId: resource.datacenterId,
                            rackId: resource.rackId,
                            uHeight: resource.uHeight,
                            uPosition: resource.uPosition,
                            portCount: resource.portCount,
                          });
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(resource.id, resource.name);
                        }}
                        className="p-2 rounded-lg transition-colors hover:bg-red-100 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {selectedResourceType === 'datacenter' && (
                        <>
                          {children.racks && children.racks.length > 0 && (
                            <div className="mb-4">
                              <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <Server className="w-4 h-4" />
                                机柜 ({children.racks.length})
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {children.racks.map(rack => (
                                  <div 
                                    key={rack.id}
                                    className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                                  >
                                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {rack.name}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      位置: {rack.position} | {rack.uHeight}U
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {children.seats && children.seats.length > 0 && (
                            <div>
                              <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <Monitor className="w-4 h-4" />
                                座位 ({children.seats.length})
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {children.seats.map(seat => (
                                  <div 
                                    key={seat.id}
                                    className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                                  >
                                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {seat.name}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      位置: {seat.position}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {(!children.racks || children.racks.length === 0) && (!children.seats || children.seats.length === 0) && (
                            <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              该机房下暂无子资源
                            </p>
                          )}
                        </>
                      )}
                      
                      {selectedResourceType === 'rack' && (
                        <>
                          {children.servers && children.servers.length > 0 && (
                            <div className="mb-4">
                              <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <Cpu className="w-4 h-4" />
                                服务器 ({children.servers.length})
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {children.servers.map(server => (
                                  <div 
                                    key={server.id}
                                    className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                                  >
                                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {server.name}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {datacenters.find(d => d.id === (racks.find(r => r.id === server.rackId)?.datacenterId))?.name || '-'} | U{server.uPosition} | {server.model}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {children.switches && children.switches.length > 0 && (
                            <div>
                              <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <Network className="w-4 h-4" />
                                交换机 ({children.switches.length})
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {children.switches.map(sw => (
                                  <div 
                                    key={sw.id}
                                    className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                                  >
                                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {sw.name}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {datacenters.find(d => d.id === (racks.find(r => r.id === sw.rackId)?.datacenterId))?.name || '-'} | U{sw.uPosition} | {sw.portCount}端口
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {(!children.servers || children.servers.length === 0) && (!children.switches || children.switches.length === 0) && (
                            <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              该机柜下暂无子资源
                            </p>
                          )}
                        </>
                      )}
                      
                      {selectedResourceType === 'seat' && (
                        <>
                          {children.ports && children.ports.length > 0 && (
                            <div>
                              <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <Network className="w-4 h-4" />
                                端口 ({(resource as any).portCount || children.ports.length})
                              </h4>
                              <div className="grid grid-cols-3 gap-2">
                                {children.ports.map(port => (
                                  <div 
                                    key={port.id}
                                    className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                                  >
                                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {port.name}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {port.status === 'used' ? '已使用' : port.status === 'reserved' ? '已预留' : '空闲'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {(!children.ports || children.ports.length === 0) && (
                            <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              暂无端口数据
                            </p>
                          )}
                        </>
                      )}
                      
                      {(selectedResourceType === 'server' || selectedResourceType === 'switch') && (
                        <>
                          {children.ports && children.ports.length > 0 && (
                            <div>
                              <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <Network className="w-4 h-4" />
                                端口 ({(resource as any).portCount || children.ports.length})
                              </h4>
                              <div className="grid grid-cols-3 gap-2">
                                {children.ports.map(port => (
                                  <div 
                                    key={port.id}
                                    className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                                  >
                                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {port.name}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {port.status === 'used' ? '已使用' : port.status === 'reserved' ? '已预留' : '空闲'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {(!children.ports || children.ports.length === 0) && (
                            <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              暂无端口数据
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
          {resources.length === 0 && (
            <Card>
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                暂无{resourceTabs.find((t) => t.type === selectedResourceType)?.label}数据
              </p>
            </Card>
          )}
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        title={isEditMode ? '编辑资源' : '添加资源'}
        onClose={handleCloseModal}
        onConfirm={handleSubmit}
      >
        <div className="space-y-4">
          <Input
            label="名称"
            name="name"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder={`请输入${resourceTabs.find((t) => t.type === selectedResourceType)?.label}名称`}
            required
          />

          {selectedResourceType === 'datacenter' && (
            <>
              <Input
                label="位置"
                name="location"
                value={formData.location}
                onChange={(value) => setFormData({ ...formData, location: value })}
                placeholder="请输入机房位置"
              />
              <Input
                label="描述"
                name="description"
                type="textarea"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="请输入机房描述"
              />
            </>
          )}

          {(selectedResourceType === 'rack' || selectedResourceType === 'seat') && (
            <>
              <Select
                label="所属机房"
                name="datacenterId"
                value={formData.datacenterId}
                onChange={(value) => setFormData({ ...formData, datacenterId: value })}
                options={getParentOptions()}
                required
              />
              <Input
                label="位置"
                name="position"
                value={formData.position}
                onChange={(value) => setFormData({ ...formData, position: value })}
                placeholder="请输入位置"
              />
            </>
          )}

          {selectedResourceType === 'seat' && (
            <Input
              label="端口数量"
              name="portCount"
              type="number"
              value={formData.portCount || 4}
              onChange={(value) => setFormData({ ...formData, portCount: parseInt(value) || 4 })}
              min={1}
              max={8}
            />
          )}

          {selectedResourceType === 'rack' && (
            <>
              <Input
                label="U位高度"
                name="uHeight"
                type="number"
                value={formData.uHeight || 42}
                onChange={(value) => setFormData({ ...formData, uHeight: parseInt(value) || 42 })}
                min={1}
                max={50}
              />
              <Input
                label="端口数量"
                name="portCount"
                type="number"
                value={formData.portCount}
                onChange={(value) => setFormData({ ...formData, portCount: parseInt(value) || 0 })}
                min={0}
                max={48}
              />
            </>
          )}

          {(selectedResourceType === 'server' || selectedResourceType === 'switch') && (
            <>
              <Select
                label="所属机柜"
                name="rackId"
                value={formData.rackId}
                onChange={(value) => setFormData({ ...formData, rackId: value })}
                options={getParentOptions()}
                required
              />
              <Input
                label="起始U位"
                name="uPosition"
                type="number"
                value={formData.uPosition}
                onChange={(value) => setFormData({ ...formData, uPosition: parseInt(value) || 1 })}
                min={1}
                max={50}
                required
              />
              <Input
                label="占用U数"
                name="uHeight"
                type="number"
                value={formData.uHeight || (selectedResourceType === 'server' ? 2 : 1)}
                onChange={(value) => setFormData({ ...formData, uHeight: parseInt(value) || 1 })}
                min={1}
                max={10}
              />
            </>
          )}

          {selectedResourceType === 'server' && (
            <>
              <Input
                label="型号"
                name="model"
                value={formData.model}
                onChange={(value) => setFormData({ ...formData, model: value })}
                placeholder="请输入服务器型号"
              />
              <Input
                label="端口数量"
                name="portCount"
                type="number"
                value={formData.portCount || 4}
                onChange={(value) => setFormData({ ...formData, portCount: parseInt(value) || 4 })}
                min={1}
                max={8}
              />
            </>
          )}

          {selectedResourceType === 'switch' && (
            <Input
              label="端口数量"
              name="portCount"
              type="number"
              value={formData.portCount || 24}
              onChange={(value) => setFormData({ ...formData, portCount: parseInt(value) || 24 })}
              min={8}
              max={48}
            />
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        title="确认删除"
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        confirmText="删除"
        confirmClass="bg-red-500 hover:bg-red-600"
      >
        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
          确定要删除 <span className="font-medium text-red-500">{deleteConfirm?.name}</span> 吗？
        </p>
        <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          此操作无法撤销，请确保该资源下没有子资源。
        </p>
      </Modal>

      <Modal
        isOpen={!!errorMessage}
        title="删除失败"
        onClose={() => setErrorMessage(null)}
        onConfirm={() => setErrorMessage(null)}
        showCancel={false}
      >
        <div className="flex items-center gap-3">
          <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            {errorMessage}
          </p>
        </div>
      </Modal>
    </div>
  );
};