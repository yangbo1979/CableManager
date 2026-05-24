import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Datacenter, Rack, Server, Switch, Seat, Port, Link, ResourceType, ConfigFormData, ToastMessage } from '../types';
import { mockDatacenters, mockRacks, mockServers, mockSwitches, mockSeats, mockPorts, mockLinks } from '../data/mockData';

console.log('=== StoreContext 模块加载 ===');
const preloadConfig = localStorage.getItem('networkConfig');
console.log('模块加载时 localStorage 数据:', preloadConfig ? '有数据，长度: ' + preloadConfig.length : '空');

interface AppState {
  datacenters: Datacenter[];
  racks: Rack[];
  servers: Server[];
  switches: Switch[];
  seats: Seat[];
  ports: Port[];
  links: Link[];
  toastMessages: ToastMessage[];
  darkMode: boolean;
  currentPage: string;
  selectedResourceType: ResourceType;
}

type Action =
  | { type: 'ADD_TOAST'; payload: { type: ToastMessage['type']; message: string } }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'SET_SELECTED_RESOURCE_TYPE'; payload: ResourceType }
  | { type: 'ADD_DATACENTER'; payload: Omit<Datacenter, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_DATACENTER'; payload: { id: string; data: Partial<Datacenter> } }
  | { type: 'DELETE_DATACENTER'; payload: string }
  | { type: 'ADD_RACK'; payload: Omit<Rack, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_RACK'; payload: { id: string; data: Partial<Rack> } }
  | { type: 'DELETE_RACK'; payload: string }
  | { type: 'ADD_SERVER'; payload: Omit<Server, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_SERVER'; payload: { id: string; data: Partial<Server> } }
  | { type: 'DELETE_SERVER'; payload: string }
  | { type: 'ADD_SWITCH'; payload: Omit<Switch, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_SWITCH'; payload: { id: string; data: Partial<Switch> } }
  | { type: 'DELETE_SWITCH'; payload: string }
  | { type: 'ADD_SEAT'; payload: Omit<Seat, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_SEAT'; payload: { id: string; data: Partial<Seat> } }
  | { type: 'DELETE_SEAT'; payload: string }
  | { type: 'ADD_PORT'; payload: Omit<Port, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_PORT'; payload: { id: string; data: Partial<Port> } }
  | { type: 'DELETE_PORT'; payload: string }
  | { type: 'ADD_LINK'; payload: Omit<Link, 'id' | 'createdAt'> }
  | { type: 'DELETE_LINK'; payload: string }
  | { type: 'CLEANUP_INVALID_LINKS' }
  | { type: 'LOAD_CONFIG'; payload: AppState }
  | { type: 'INITIALIZE_DATA' };

const generateId = () => Math.random().toString(36).substring(2, 11);
const now = () => new Date().toISOString();

const initialState: AppState = {
  datacenters: [],
  racks: [],
  servers: [],
  switches: [],
  seats: [],
  ports: [],
  links: [],
  toastMessages: [],
  darkMode: true,
  currentPage: '/',
  selectedResourceType: 'datacenter',
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_TOAST': {
      const id = generateId();
      return {
        ...state,
        toastMessages: [...state.toastMessages, { id, type: action.payload.type, message: action.payload.message }],
      };
    }
    case 'REMOVE_TOAST':
      return {
        ...state,
        toastMessages: state.toastMessages.filter((t) => t.id !== action.payload),
      };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_SELECTED_RESOURCE_TYPE':
      return { ...state, selectedResourceType: action.payload };
    case 'ADD_DATACENTER': {
      const datacenter: Datacenter = { ...action.payload, id: generateId(), createdAt: now(), updatedAt: now() };
      return { ...state, datacenters: [...state.datacenters, datacenter] };
    }
    case 'UPDATE_DATACENTER':
      return {
        ...state,
        datacenters: state.datacenters.map((d) =>
          d.id === action.payload.id ? { ...d, ...action.payload.data, updatedAt: now() } : d
        ),
      };
    case 'DELETE_DATACENTER': {
      const datacenterRacks = state.racks.filter((r) => r.datacenterId === action.payload);
      const rackIds = new Set(datacenterRacks.map((r) => r.id));
      
      const datacenterServers = state.servers.filter((s) => rackIds.has(s.rackId));
      const datacenterSwitches = state.switches.filter((s) => rackIds.has(s.rackId));
      const datacenterSeats = state.seats.filter((s) => s.datacenterId === action.payload);
      
      const serverIds = new Set(datacenterServers.map((s) => s.id));
      const switchIds = new Set(datacenterSwitches.map((s) => s.id));
      const seatIds = new Set(datacenterSeats.map((s) => s.id));
      
      const datacenterPorts = state.ports.filter((p) => 
        rackIds.has(p.deviceId) || serverIds.has(p.deviceId) || 
        switchIds.has(p.deviceId) || seatIds.has(p.deviceId)
      );
      const portIds = new Set(datacenterPorts.map((p) => p.id));
      
      const newLinks = state.links.filter(
        (l) => !portIds.has(l.fromPortId) && !portIds.has(l.toPortId)
      );
      
      return {
        ...state,
        datacenters: state.datacenters.filter((d) => d.id !== action.payload),
        racks: state.racks.filter((r) => !rackIds.has(r.id)),
        servers: state.servers.filter((s) => !serverIds.has(s.id)),
        switches: state.switches.filter((s) => !switchIds.has(s.id)),
        seats: state.seats.filter((s) => !seatIds.has(s.id)),
        ports: state.ports.filter((p) => !portIds.has(p.id)),
        links: newLinks,
      };
    }
    case 'ADD_RACK': {
      const portCount = (action.payload as any).portCount ?? 24;
      const rack: Rack = { ...action.payload, portCount, id: generateId(), createdAt: now(), updatedAt: now() };
      const newPorts: Port[] = [];
      for (let i = 1; i <= portCount; i++) {
        newPorts.push({
          id: generateId(),
          name: `Port${i}`,
          deviceType: 'rack',
          deviceId: rack.id,
          status: 'free',
          createdAt: now(),
          updatedAt: now(),
        });
      }
      return { ...state, racks: [...state.racks, rack], ports: [...state.ports, ...newPorts] };
    }
    case 'UPDATE_RACK': {
      const rack = state.racks.find((r) => r.id === action.payload.id);
      if (!rack) return state;
      
      const newPortCount = (action.payload.data as Partial<Rack>).portCount ?? rack.portCount;
      const currentPortCount = rack.portCount;
      
      let newPorts = [...state.ports.filter((p) => p.deviceId !== action.payload.id)];
      
      if (newPortCount > currentPortCount) {
        for (let i = currentPortCount + 1; i <= newPortCount; i++) {
          newPorts.push({
            id: generateId(),
            name: `Port${i}`,
            deviceType: 'rack',
            deviceId: action.payload.id,
            status: 'free',
            createdAt: now(),
            updatedAt: now(),
          });
        }
      } else if (newPortCount < currentPortCount) {
        const rackPorts = state.ports.filter((p) => p.deviceId === action.payload.id && p.deviceType === 'rack');
        const portsToRemove = rackPorts.slice(newPortCount);
        const portIdsToRemove = new Set(portsToRemove.map((p) => p.id));
        
        newPorts = newPorts.filter((p) => !portIdsToRemove.has(p.id));
      }
      
      return {
        ...state,
        racks: state.racks.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload.data, updatedAt: now() } : r
        ),
        ports: newPorts,
      };
    }
    case 'DELETE_RACK': {
      const rackPorts = state.ports.filter((p) => p.deviceId === action.payload && p.deviceType === 'rack');
      const portIdsToRemove = new Set(rackPorts.map((p) => p.id));
      return {
        ...state,
        racks: state.racks.filter((r) => r.id !== action.payload),
        ports: state.ports.filter((p) => !portIdsToRemove.has(p.id)),
        links: state.links.filter(
          (l) => !portIdsToRemove.has(l.fromPortId) && !portIdsToRemove.has(l.toPortId)
        ),
      };
    }
    case 'ADD_SERVER': {
      const portCount = (action.payload as any).portCount || 4;
      const server: Server = { ...action.payload, portCount, id: generateId(), createdAt: now(), updatedAt: now() };
      const newPorts: Port[] = [];
      for (let i = 1; i <= portCount; i++) {
        newPorts.push({
          id: generateId(),
          name: `ETH${i}`,
          deviceType: 'server',
          deviceId: server.id,
          status: 'free',
          createdAt: now(),
          updatedAt: now(),
        });
      }
      return { ...state, servers: [...state.servers, server], ports: [...state.ports, ...newPorts] };
    }
    case 'UPDATE_SERVER': {
      const serverId = action.payload.id;
      const newPortCount = (action.payload.data as any).portCount;
      const oldServer = state.servers.find((s) => s.id === serverId);
      const oldPortCount = oldServer?.portCount || 4;
      
      let newPorts = [...state.ports];
      const serverPorts = state.ports.filter((p) => p.deviceId === serverId && p.deviceType === 'server');
      
      if (newPortCount !== undefined && newPortCount !== oldPortCount) {
        const existingPortNames = serverPorts.map((p) => p.name);
        
        if (newPortCount > oldPortCount) {
          for (let i = oldPortCount + 1; i <= newPortCount; i++) {
            const portName = `ETH${i}`;
            if (!existingPortNames.includes(portName)) {
              newPorts.push({
                id: generateId(),
                name: portName,
                deviceType: 'server',
                deviceId: serverId,
                status: 'free',
                createdAt: now(),
                updatedAt: now(),
              });
            }
          }
        } else {
          const portsToRemove = serverPorts.filter((p) => {
            const match = p.name.match(/ETH(\d+)/);
            return match && parseInt(match[1]) > newPortCount;
          });
          const portIdsToRemove = portsToRemove.map((p) => p.id);
          newPorts = newPorts.filter((p) => !portIdsToRemove.includes(p.id));
          
          const portIds = portsToRemove.map((p) => p.id);
          const newLinks = state.links.filter(
            (l) => !portIds.includes(l.fromPortId) && !portIds.includes(l.toPortId)
          );
          return {
            ...state,
            servers: state.servers.map((s) =>
              s.id === serverId ? { ...s, ...action.payload.data, updatedAt: now() } : s
            ),
            ports: newPorts,
            links: newLinks,
          };
        }
      }
      
      return {
        ...state,
        servers: state.servers.map((s) =>
          s.id === serverId ? { ...s, ...action.payload.data, updatedAt: now() } : s
        ),
        ports: newPorts,
      };
    }
    case 'DELETE_SERVER': {
      const serverPorts = state.ports.filter((p) => p.deviceId === action.payload);
      const portIds = serverPorts.map((p) => p.id);
      const newLinks = state.links.filter(
        (l) => !portIds.includes(l.fromPortId) && !portIds.includes(l.toPortId)
      );
      return {
        ...state,
        servers: state.servers.filter((s) => s.id !== action.payload),
        ports: state.ports.filter((p) => p.deviceId !== action.payload),
        links: newLinks,
      };
    }
    case 'ADD_SWITCH': {
      const switchData: Switch = { ...action.payload, id: generateId(), createdAt: now(), updatedAt: now() };
      const portCount = action.payload.portCount || 24;
      const newPorts: Port[] = [];
      for (let i = 1; i <= portCount; i++) {
        newPorts.push({
          id: generateId(),
          name: `Port${i}`,
          deviceType: 'switch',
          deviceId: switchData.id,
          status: 'free',
          createdAt: now(),
          updatedAt: now(),
        });
      }
      return { ...state, switches: [...state.switches, switchData], ports: [...state.ports, ...newPorts] };
    }
    case 'UPDATE_SWITCH': {
      const switchId = action.payload.id;
      const newPortCount = (action.payload.data as any).portCount;
      const oldSwitch = state.switches.find((s) => s.id === switchId);
      const oldPortCount = oldSwitch?.portCount || 24;
      
      let newPorts = [...state.ports];
      const switchPorts = state.ports.filter((p) => p.deviceId === switchId && p.deviceType === 'switch');
      
      if (newPortCount !== undefined && newPortCount !== oldPortCount) {
        const existingPortNames = switchPorts.map((p) => p.name);
        
        if (newPortCount > oldPortCount) {
          for (let i = oldPortCount + 1; i <= newPortCount; i++) {
            const portName = `Port${i}`;
            if (!existingPortNames.includes(portName)) {
              newPorts.push({
                id: generateId(),
                name: portName,
                deviceType: 'switch',
                deviceId: switchId,
                status: 'free',
                createdAt: now(),
                updatedAt: now(),
              });
            }
          }
        } else {
          const portsToRemove = switchPorts.filter((p) => {
            const match = p.name.match(/Port(\d+)/);
            return match && parseInt(match[1]) > newPortCount;
          });
          const portIdsToRemove = portsToRemove.map((p) => p.id);
          newPorts = newPorts.filter((p) => !portIdsToRemove.includes(p.id));
          
          const portIds = portsToRemove.map((p) => p.id);
          const newLinks = state.links.filter(
            (l) => !portIds.includes(l.fromPortId) && !portIds.includes(l.toPortId)
          );
          return {
            ...state,
            switches: state.switches.map((s) =>
              s.id === switchId ? { ...s, ...action.payload.data, updatedAt: now() } : s
            ),
            ports: newPorts,
            links: newLinks,
          };
        }
      }
      
      return {
        ...state,
        switches: state.switches.map((s) =>
          s.id === switchId ? { ...s, ...action.payload.data, updatedAt: now() } : s
        ),
        ports: newPorts,
      };
    }
    case 'DELETE_SWITCH': {
      const switchPorts = state.ports.filter((p) => p.deviceId === action.payload);
      const portIds = switchPorts.map((p) => p.id);
      const newLinks = state.links.filter(
        (l) => !portIds.includes(l.fromPortId) && !portIds.includes(l.toPortId)
      );
      return {
        ...state,
        switches: state.switches.filter((s) => s.id !== action.payload),
        ports: state.ports.filter((p) => p.deviceId !== action.payload),
        links: newLinks,
      };
    }
    case 'ADD_SEAT': {
      const portCount = (action.payload as any).portCount || 4;
      console.log('ADD_SEAT - 接收到的 portCount:', portCount, '原始数据:', action.payload);
      const seat: Seat = { ...action.payload, portCount, id: generateId(), createdAt: now(), updatedAt: now() };
      const newPorts: Port[] = [];
      for (let i = 1; i <= portCount; i++) {
        newPorts.push({
          id: generateId(),
          name: `Port${i}`,
          deviceType: 'seat',
          deviceId: seat.id,
          status: 'free',
          createdAt: now(),
          updatedAt: now(),
        });
      }
      console.log('ADD_SEAT - 创建的座位:', seat, '创建的端口数量:', newPorts.length);
      console.log('ADD_SEAT - 新端口详情:', newPorts);
      console.log('ADD_SEAT - 旧端口数量:', state.ports.length);
      console.log('ADD_SEAT - 新端口数量:', state.ports.length + newPorts.length);
      const newState = { ...state, seats: [...state.seats, seat], ports: [...state.ports, ...newPorts] };
      console.log('ADD_SEAT - 新状态中的端口:', newState.ports);
      return newState;
    }
    case 'UPDATE_SEAT': {
      const seatId = action.payload.id;
      const newPortCount = (action.payload.data as any).portCount;
      const oldSeat = state.seats.find((s) => s.id === seatId);
      const oldPortCount = oldSeat?.portCount || 4;
      
      let newPorts = [...state.ports];
      const seatPorts = state.ports.filter((p) => p.deviceId === seatId && p.deviceType === 'seat');
      
      if (newPortCount !== undefined && newPortCount !== oldPortCount) {
        const existingPortNames = seatPorts.map((p) => p.name);
        
        if (newPortCount > oldPortCount) {
          for (let i = oldPortCount + 1; i <= newPortCount; i++) {
            const portName = `Port${i}`;
            if (!existingPortNames.includes(portName)) {
              newPorts.push({
                id: generateId(),
                name: portName,
                deviceType: 'seat',
                deviceId: seatId,
                status: 'free',
                createdAt: now(),
                updatedAt: now(),
              });
            }
          }
        } else {
          const portsToRemove = seatPorts.filter((p) => {
            const match = p.name.match(/Port(\d+)/);
            return match && parseInt(match[1]) > newPortCount;
          });
          const portIdsToRemove = portsToRemove.map((p) => p.id);
          newPorts = newPorts.filter((p) => !portIdsToRemove.includes(p.id));
          
          const portIds = portsToRemove.map((p) => p.id);
          const newLinks = state.links.filter(
            (l) => !portIds.includes(l.fromPortId) && !portIds.includes(l.toPortId)
          );
          return {
            ...state,
            seats: state.seats.map((s) =>
              s.id === seatId ? { ...s, ...action.payload.data, updatedAt: now() } : s
            ),
            ports: newPorts,
            links: newLinks,
          };
        }
      }
      
      return {
        ...state,
        seats: state.seats.map((s) =>
          s.id === seatId ? { ...s, ...action.payload.data, updatedAt: now() } : s
        ),
        ports: newPorts,
      };
    }
    case 'DELETE_SEAT': {
      const seatPorts = state.ports.filter((p) => p.deviceId === action.payload);
      const portIds = seatPorts.map((p) => p.id);
      const newLinks = state.links.filter(
        (l) => !portIds.includes(l.fromPortId) && !portIds.includes(l.toPortId)
      );
      return {
        ...state,
        seats: state.seats.filter((s) => s.id !== action.payload),
        ports: state.ports.filter((p) => p.deviceId !== action.payload),
        links: newLinks,
      };
    }
    case 'ADD_PORT': {
      const port: Port = { ...action.payload, id: generateId(), createdAt: now(), updatedAt: now() };
      return { ...state, ports: [...state.ports, port] };
    }
    case 'UPDATE_PORT':
      return {
        ...state,
        ports: state.ports.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.data, updatedAt: now() } : p
        ),
      };
    case 'DELETE_PORT': {
      const portId = action.payload;
      const newLinks = state.links.filter((l) => l.fromPortId !== portId && l.toPortId !== portId);
      return { ...state, ports: state.ports.filter((p) => p.id !== portId), links: newLinks };
    }
    case 'ADD_LINK': {
      const link: Link = { ...action.payload, id: generateId(), createdAt: now() };
      const newPorts = state.ports.map((p) => {
        if (p.id === action.payload.fromPortId || p.id === action.payload.toPortId) {
          return { ...p, status: 'used' as const, connectedTo: p.id === action.payload.fromPortId ? action.payload.toPortId : action.payload.fromPortId };
        }
        return p;
      });
      return { ...state, links: [...state.links, link], ports: newPorts };
    }
    case 'DELETE_LINK': {
      const link = state.links.find((l) => l.id === action.payload);
      if (!link) return state;
      const newPorts = state.ports.map((p) => {
        if (p.id === link.fromPortId || p.id === link.toPortId) {
          return { ...p, status: 'free' as const, connectedTo: undefined };
        }
        return p;
      });
      return { ...state, links: state.links.filter((l) => l.id !== action.payload), ports: newPorts };
    }
    case 'CLEANUP_INVALID_LINKS': {
      const portIds = new Set(state.ports.map((p) => p.id));
      const invalidLinks = state.links.filter(
        (l) => !portIds.has(l.fromPortId) || !portIds.has(l.toPortId)
      );
      
      const validLinks = state.links.filter(
        (l) => portIds.has(l.fromPortId) && portIds.has(l.toPortId)
      );
      
      const connectedPortIds = new Set<string>();
      validLinks.forEach((l) => {
        connectedPortIds.add(l.fromPortId);
        connectedPortIds.add(l.toPortId);
      });
      
      const newPorts = state.ports.map((p) => {
        if (!connectedPortIds.has(p.id) && p.status !== 'free') {
          return { ...p, status: 'free' as const, connectedTo: undefined };
        }
        return p;
      });
      
      return { ...state, links: validLinks, ports: newPorts };
    }
    case 'LOAD_CONFIG':
      return { ...action.payload, toastMessages: [], darkMode: state.darkMode, currentPage: state.currentPage, selectedResourceType: state.selectedResourceType };
    case 'INITIALIZE_DATA':
      return {
        ...state,
        datacenters: mockDatacenters,
        racks: mockRacks,
        servers: mockServers,
        switches: mockSwitches,
        seats: mockSeats,
        ports: mockPorts,
        links: mockLinks,
      };
    default:
      return state;
  }
}

interface StoreContextType {
  state: AppState;
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
  toggleDarkMode: () => void;
  setCurrentPage: (page: string) => void;
  setSelectedResourceType: (type: ResourceType) => void;
  addDatacenter: (data: Omit<Datacenter, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDatacenter: (id: string, data: Partial<Datacenter>) => void;
  deleteDatacenter: (id: string) => void;
  addRack: (data: Omit<Rack, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRack: (id: string, data: Partial<Rack>) => void;
  deleteRack: (id: string) => void;
  addServer: (data: Omit<Server, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateServer: (id: string, data: Partial<Server>) => void;
  deleteServer: (id: string) => void;
  addSwitch: (data: Omit<Switch, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSwitch: (id: string, data: Partial<Switch>) => void;
  deleteSwitch: (id: string) => void;
  addSeat: (data: Omit<Seat, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSeat: (id: string, data: Partial<Seat>) => void;
  deleteSeat: (id: string) => void;
  addPort: (data: Omit<Port, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePort: (id: string, data: Partial<Port>) => void;
  deletePort: (id: string) => void;
  addLink: (data: Omit<Link, 'id' | 'createdAt'>) => boolean;
  deleteLink: (id: string) => void;
  saveConfig: () => void;
  loadConfig: () => void;
  exportConfig: () => string;
  importConfig: (config: string) => boolean;
  createResource: (type: ResourceType, data: ConfigFormData) => void;
  updateResource: (type: ResourceType, id: string, data: ConfigFormData) => void;
  deleteResource: (type: ResourceType, id: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    dispatch({ type: 'ADD_TOAST', payload: { type, message } });
    const id = state.toastMessages[state.toastMessages.length - 1]?.id || generateId();
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3000);
  }, [state.toastMessages]);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const toggleDarkMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  }, []);

  const setCurrentPage = useCallback((page: string) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
  }, []);

  const setSelectedResourceType = useCallback((type: ResourceType) => {
    dispatch({ type: 'SET_SELECTED_RESOURCE_TYPE', payload: type });
  }, []);

  const addDatacenter = useCallback((data: Omit<Datacenter, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'ADD_DATACENTER', payload: data });
    addToast('success', '机房添加成功');
  }, [addToast]);

  const updateDatacenter = useCallback((id: string, data: Partial<Datacenter>) => {
    dispatch({ type: 'UPDATE_DATACENTER', payload: { id, data } });
    addToast('success', '机房更新成功');
  }, [addToast]);

  const deleteDatacenter = useCallback((id: string) => {
    const hasRacks = state.racks.some((r) => r.datacenterId === id);
    const hasSeats = state.seats.some((s) => s.datacenterId === id);
    if (hasRacks || hasSeats) {
      addToast('error', '请先删除该机房下的所有资源（机柜和座位）');
      return;
    }
    dispatch({ type: 'DELETE_DATACENTER', payload: id });
    addToast('success', '机房删除成功');
  }, [state.racks, state.seats, addToast]);

  const addRack = useCallback((data: Omit<Rack, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'ADD_RACK', payload: data });
    addToast('success', '机柜添加成功');
  }, [addToast]);

  const updateRack = useCallback((id: string, data: Partial<Rack>) => {
    dispatch({ type: 'UPDATE_RACK', payload: { id, data } });
    addToast('success', '机柜更新成功');
  }, [addToast]);

  const deleteRack = useCallback((id: string) => {
    const hasChildren = state.servers.some((s) => s.rackId === id) || state.switches.some((s) => s.rackId === id);
    if (hasChildren) {
      addToast('error', '请先删除该机柜下的所有设备');
      return;
    }
    dispatch({ type: 'DELETE_RACK', payload: id });
    addToast('success', '机柜删除成功');
  }, [state.servers, state.switches, addToast]);

  const addServer = useCallback((data: Omit<Server, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'ADD_SERVER', payload: data });
    addToast('success', '服务器添加成功');
  }, [addToast]);

  const updateServer = useCallback((id: string, data: Partial<Server>) => {
    dispatch({ type: 'UPDATE_SERVER', payload: { id, data } });
    addToast('success', '服务器更新成功');
  }, [addToast]);

  const deleteServer = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SERVER', payload: id });
    addToast('success', '服务器删除成功');
  }, [addToast]);

  const addSwitch = useCallback((data: Omit<Switch, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'ADD_SWITCH', payload: data });
    addToast('success', '交换机添加成功');
  }, [addToast]);

  const updateSwitch = useCallback((id: string, data: Partial<Switch>) => {
    dispatch({ type: 'UPDATE_SWITCH', payload: { id, data } });
    addToast('success', '交换机更新成功');
  }, [addToast]);

  const deleteSwitch = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SWITCH', payload: id });
    addToast('success', '交换机删除成功');
  }, [addToast]);

  const addSeat = useCallback((data: Omit<Seat, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'ADD_SEAT', payload: data });
    addToast('success', '座位添加成功');
  }, [addToast]);

  const updateSeat = useCallback((id: string, data: Partial<Seat>) => {
    dispatch({ type: 'UPDATE_SEAT', payload: { id, data } });
    addToast('success', '座位更新成功');
  }, [addToast]);

  const deleteSeat = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SEAT', payload: id });
    addToast('success', '座位删除成功');
  }, [addToast]);

  const addPort = useCallback((data: Omit<Port, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'ADD_PORT', payload: data });
  }, []);

  const updatePort = useCallback((id: string, data: Partial<Port>) => {
    dispatch({ type: 'UPDATE_PORT', payload: { id, data } });
  }, []);

  const deletePort = useCallback((id: string) => {
    dispatch({ type: 'DELETE_PORT', payload: id });
  }, []);

  const addLink = useCallback((data: Omit<Link, 'id' | 'createdAt'>) => {
    const fromPort = state.ports.find((p) => p.id === data.fromPortId);
    const toPort = state.ports.find((p) => p.id === data.toPortId);

    if (!fromPort || !toPort) {
      addToast('error', '端口不存在');
      return false;
    }

    if (fromPort.status === 'used' || toPort.status === 'used') {
      addToast('error', '端口已被占用');
      return false;
    }

    const existingLink = state.links.find(
      (l) =>
        (l.fromPortId === data.fromPortId && l.toPortId === data.toPortId) ||
        (l.fromPortId === data.toPortId && l.toPortId === data.fromPortId)
    );

    if (existingLink) {
      addToast('error', '链路已存在');
      return false;
    }

    dispatch({ type: 'ADD_LINK', payload: data });
    addToast('success', '链路建立成功');
    return true;
  }, [state.ports, state.links, addToast]);

  const deleteLink = useCallback((id: string) => {
    dispatch({ type: 'DELETE_LINK', payload: id });
  }, [dispatch]);

  const exportConfig = useCallback(() => {
    const { datacenters, racks, servers, switches, seats, ports, links } = state;
    return JSON.stringify({ datacenters, racks, servers, switches, seats, ports, links }, null, 2);
  }, [state]);

  const saveConfig = useCallback(() => {
    console.log('saveConfig 函数被调用');
    try {
      dispatch({ type: 'CLEANUP_INVALID_LINKS' });
      
      const { datacenters, racks, servers, switches, seats, ports, links } = state;
      const config = JSON.stringify({ datacenters, racks, servers, switches, seats, ports, links }, null, 2);
      console.log('配置数据长度:', config?.length);
      console.log('datacenters 数量:', datacenters.length);
      
      if (!config) {
        console.error('配置数据为空');
        addToast('error', '保存失败：无法获取配置数据');
        return;
      }

      if (config.length > 5 * 1024 * 1024) { // 5MB limit
        console.error('配置数据过大');
        addToast('error', '保存失败：配置数据过大，请清理不需要的数据');
        return;
      }

      try {
        localStorage.setItem('networkConfig', config);
        console.log('localStorage 保存成功');
        
        // 验证保存是否成功
        const savedConfig = localStorage.getItem('networkConfig');
        if (savedConfig) {
          console.log('验证：保存后读取成功，长度:', savedConfig.length);
          const savedData = JSON.parse(savedConfig);
          console.log('验证：datacenters 数量:', savedData.datacenters?.length || 0);
        } else {
          console.error('验证：保存后读取失败！');
          addToast('error', '保存失败：数据未写入浏览器存储');
          return;
        }
      } catch (storageError) {
        console.error('localStorage 保存失败:', storageError);
        if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
          addToast('error', '保存失败：浏览器存储空间已满，请清理浏览器缓存或删除不需要的数据');
        } else {
          addToast('error', '保存失败：无法写入浏览器存储 - ' + (storageError instanceof Error ? storageError.message : '未知错误'));
        }
        return;
      }

      console.log('显示成功提示');
      addToast('success', '配置已保存');
    } catch (error) {
      console.error('保存配置时发生错误:', error);
      addToast('error', '保存失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  }, [state, addToast, dispatch]);

  const importConfig = useCallback((config: string) => {
    try {
      const data = JSON.parse(config);
      dispatch({ type: 'LOAD_CONFIG', payload: { ...initialState, ...data } });
      addToast('success', '配置导入成功');
      return true;
    } catch {
      addToast('error', '配置文件格式错误');
      return false;
    }
  }, [addToast]);

  const loadConfig = useCallback(() => {
    const config = localStorage.getItem('networkConfig');
    if (config) {
      importConfig(config);
    }
  }, [importConfig]);

  const createResource = useCallback((type: ResourceType, data: ConfigFormData) => {
    switch (type) {
      case 'datacenter':
        addDatacenter(data as Omit<Datacenter, 'id' | 'createdAt' | 'updatedAt'>);
        break;
      case 'rack':
        addRack(data as Omit<Rack, 'id' | 'createdAt' | 'updatedAt'>);
        break;
      case 'server':
        addServer(data as Omit<Server, 'id' | 'createdAt' | 'updatedAt'>);
        break;
      case 'switch':
        addSwitch(data as Omit<Switch, 'id' | 'createdAt' | 'updatedAt'>);
        break;
      case 'seat':
        addSeat(data as Omit<Seat, 'id' | 'createdAt' | 'updatedAt'>);
        break;
    }
  }, [addDatacenter, addRack, addServer, addSwitch, addSeat]);

  const updateResource = useCallback((type: ResourceType, id: string, data: ConfigFormData) => {
    switch (type) {
      case 'datacenter':
        updateDatacenter(id, data as Partial<Datacenter>);
        break;
      case 'rack':
        updateRack(id, data as Partial<Rack>);
        break;
      case 'server':
        updateServer(id, data as Partial<Server>);
        break;
      case 'switch':
        updateSwitch(id, data as Partial<Switch>);
        break;
      case 'seat':
        updateSeat(id, data as Partial<Seat>);
        break;
    }
  }, [updateDatacenter, updateRack, updateServer, updateSwitch, updateSeat]);

  const deleteResource = useCallback((type: ResourceType, id: string) => {
    switch (type) {
      case 'datacenter':
        deleteDatacenter(id);
        break;
      case 'rack':
        deleteRack(id);
        break;
      case 'server':
        deleteServer(id);
        break;
      case 'switch':
        deleteSwitch(id);
        break;
      case 'seat':
        deleteSeat(id);
        break;
    }
  }, [deleteDatacenter, deleteRack, deleteServer, deleteSwitch, deleteSeat]);

  useEffect(() => {
    console.log('=== 初始化配置 ===');
    const config = localStorage.getItem('networkConfig');
    console.log('localStorage 中的数据:', config ? '有数据，长度: ' + config.length : '空');
    
    if (!config || config === '') {
      console.log('localStorage 为空，初始化模拟数据');
      dispatch({ type: 'INITIALIZE_DATA' });
      localStorage.setItem('networkConfig', JSON.stringify({
        datacenters: mockDatacenters,
        racks: mockRacks,
        servers: mockServers,
        switches: mockSwitches,
        seats: mockSeats,
        ports: mockPorts,
        links: mockLinks,
      }, null, 2));
    } else {
      try {
        const data = JSON.parse(config);
        console.log('解析后的数据:', data);
        console.log('datacenters 数量:', data.datacenters?.length || 0);
        dispatch({ type: 'LOAD_CONFIG', payload: { ...initialState, ...data } });
        console.log('配置加载成功');
      } catch (error) {
        console.error('解析配置失败:', error);
        dispatch({ type: 'INITIALIZE_DATA' });
      }
    }
  }, []);

  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  // 自动保存配置（包括链路变化）
  useEffect(() => {
    const config = JSON.stringify({
      datacenters: state.datacenters,
      racks: state.racks,
      servers: state.servers,
      switches: state.switches,
      seats: state.seats,
      ports: state.ports,
      links: state.links,
    }, null, 2);
    localStorage.setItem('networkConfig', config);
  }, [state.datacenters, state.racks, state.servers, state.switches, state.seats, state.ports, state.links]);

  return (
    <StoreContext.Provider
      value={{
        state,
        addToast,
        removeToast,
        toggleDarkMode,
        setCurrentPage,
        setSelectedResourceType,
        addDatacenter,
        updateDatacenter,
        deleteDatacenter,
        addRack,
        updateRack,
        deleteRack,
        addServer,
        updateServer,
        deleteServer,
        addSwitch,
        updateSwitch,
        deleteSwitch,
        addSeat,
        updateSeat,
        deleteSeat,
        addPort,
        updatePort,
        deletePort,
        addLink,
        deleteLink,
        saveConfig,
        loadConfig,
        exportConfig,
        importConfig,
        createResource,
        updateResource,
        deleteResource,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return {
    ...context.state,
    addToast: context.addToast,
    removeToast: context.removeToast,
    toggleDarkMode: context.toggleDarkMode,
    setCurrentPage: context.setCurrentPage,
    setSelectedResourceType: context.setSelectedResourceType,
    addDatacenter: context.addDatacenter,
    updateDatacenter: context.updateDatacenter,
    deleteDatacenter: context.deleteDatacenter,
    addRack: context.addRack,
    updateRack: context.updateRack,
    deleteRack: context.deleteRack,
    addServer: context.addServer,
    updateServer: context.updateServer,
    deleteServer: context.deleteServer,
    addSwitch: context.addSwitch,
    updateSwitch: context.updateSwitch,
    deleteSwitch: context.deleteSwitch,
    addSeat: context.addSeat,
    updateSeat: context.updateSeat,
    deleteSeat: context.deleteSeat,
    addPort: context.addPort,
    updatePort: context.updatePort,
    deletePort: context.deletePort,
    addLink: context.addLink,
    deleteLink: context.deleteLink,
    saveConfig: context.saveConfig,
    loadConfig: context.loadConfig,
    exportConfig: context.exportConfig,
    importConfig: context.importConfig,
    createResource: context.createResource,
    updateResource: context.updateResource,
    deleteResource: context.deleteResource,
  };
}
