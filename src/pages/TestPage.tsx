import React from 'react';
import { Monitor, Settings, Link2, Archive, Palette, Save, Database, Wifi, Server, Network, Cpu } from 'lucide-react';

export const TestPage = () => {
  return (
    <div className="p-4">
      <h1>Icon Test - All Icons</h1>
      <div className="grid grid-cols-4 gap-4">
        <div><Monitor className="w-8 h-8" /> Monitor</div>
        <div><Settings className="w-8 h-8" /> Settings</div>
        <div><Link2 className="w-8 h-8" /> Link2</div>
        <div><Archive className="w-8 h-8" /> Archive</div>
        <div><Palette className="w-8 h-8" /> Palette</div>
        <div><Save className="w-8 h-8" /> Save</div>
        <div><Database className="w-8 h-8" /> Database</div>
        <div><Wifi className="w-8 h-8" /> Wifi</div>
        <div><Server className="w-8 h-8" /> Server</div>
        <div><Network className="w-8 h-8" /> Network</div>
        <div><Cpu className="w-8 h-8" /> Cpu</div>
      </div>
    </div>
  );
};