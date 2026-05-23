export interface Datacenter {
  id: string;
  name: string;
  location: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rack {
  id: string;
  name: string;
  datacenterId: string;
  uHeight: number;
  position: string;
  portCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Server {
  id: string;
  name: string;
  rackId: string;
  uPosition: number;
  uHeight: number;
  model: string;
  portCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Switch {
  id: string;
  name: string;
  rackId: string;
  uPosition: number;
  uHeight: number;
  portCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Seat {
  id: string;
  name: string;
  datacenterId: string;
  position: string;
  portCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Port {
  id: string;
  name: string;
  deviceType: 'server' | 'switch' | 'seat' | 'rack';
  deviceId: string;
  status: 'free' | 'used' | 'reserved';
  connectedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Link {
  id: string;
  fromPortId: string;
  toPortId: string;
  note: string;
  createdAt: string;
}

export type ResourceType = 'datacenter' | 'rack' | 'server' | 'switch' | 'seat';

export interface ConfigFormData {
  id?: string;
  name: string;
  location?: string;
  description?: string;
  datacenterId?: string;
  rackId?: string;
  uHeight?: number;
  uPosition?: number;
  position?: string;
  portCount?: number;
  model?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}