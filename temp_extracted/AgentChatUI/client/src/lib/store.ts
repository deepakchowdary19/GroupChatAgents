import { create } from 'zustand';

interface UIState {
  selectedGroupId: string | null;
  rightPanelOpen: boolean;
  selectedAgentId: string | null;
  
  selectGroup: (groupId: string | null) => void;
  setRightPanelOpen: (open: boolean) => void;
  setSelectedAgentId: (agentId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedGroupId: null,
  rightPanelOpen: false,
  selectedAgentId: null,

  selectGroup: (groupId) => {
    set({ selectedGroupId: groupId, rightPanelOpen: false, selectedAgentId: null });
  },

  setRightPanelOpen: (open) => {
    set({ rightPanelOpen: open });
  },

  setSelectedAgentId: (agentId) => {
    set({ selectedAgentId: agentId, rightPanelOpen: agentId !== null });
  },
}));
