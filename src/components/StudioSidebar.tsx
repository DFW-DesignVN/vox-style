import React from 'react';
import {
  FolderKanban,
  FileText,
  Mic,
  Film,
  Sliders,
  Sparkles,
  Download,
  Settings,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { Project } from '../types.ts';

export type StudioTab =
  | 'overview'
  | 'script'
  | 'voice'
  | 'canvas'
  | 'inspector'
  | 'render';

interface StudioSidebarProps {
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  project: Project;
  onOpenRenderModal: () => void;
}

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  activeTab,
  setActiveTab,
  project,
  onOpenRenderModal,
}) => {
  const readyAssetsCount = project.shots.reduce(
    (acc, s) => acc + s.assets.filter((a) => a.status === 'ready' || !!a.source).length,
    0
  );
  const totalAssetsCount = project.shots.reduce((acc, s) => acc + s.assets.length, 0);

  const navItems = [
    {
      id: 'canvas' as StudioTab,
      label: 'Video Canvas',
      sub: `${project.shots.length} Shots • 1080p`,
      icon: Film,
      badge: `${project.duration}s`,
    },
    {
      id: 'overview' as StudioTab,
      label: 'Project Brief',
      sub: 'Topic & Specifications',
      icon: FolderKanban,
      status: 'ready',
    },
    {
      id: 'script' as StudioTab,
      label: 'Script & Beats',
      sub: 'Narration & sync',
      icon: FileText,
      status: project.script ? 'ready' : 'pending',
    },
    {
      id: 'voice' as StudioTab,
      label: 'Voice & Audio',
      sub: project.voiceUrl ? 'TTS Audio synced' : 'Requires generation',
      icon: Mic,
      status: project.voiceUrl ? 'ready' : 'pending',
    },
    {
      id: 'inspector' as StudioTab,
      label: 'Asset Inspector',
      sub: `${readyAssetsCount}/${totalAssetsCount} Visual Assets`,
      icon: Sliders,
      badge: `${readyAssetsCount}/${totalAssetsCount}`,
    },
    {
      id: 'render' as StudioTab,
      label: 'Export Studio',
      sub: 'H.264 / AAC 1080p',
      icon: Download,
      action: onOpenRenderModal,
    },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between shrink-0 h-full select-none">
      {/* Top Section: Workspace title & Navigation */}
      <div className="p-3.5 flex flex-col gap-3">
        <div className="px-2 py-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
            Documentary Studio
          </div>
          <div className="text-sm font-editorial font-bold text-zinc-200 truncate mt-0.5" title={project.title}>
            {project.title || 'Untitled Project'}
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'render' && item.action) {
                    item.action();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition group ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition ${
                      isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-400'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold leading-tight truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">
                      {item.sub}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                    isActive
                      ? 'bg-amber-400/10 text-amber-300 border-amber-500/30'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Pipeline Status Pill */}
      <div className="p-3.5 border-t border-zinc-900 bg-zinc-950 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>Engine Pipeline</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Ready
          </span>
        </div>
        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.round((readyAssetsCount / Math.max(1, totalAssetsCount)) * 100))}%` }}
          />
        </div>
        <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
          <span>{project.shots.length} Shots</span>
          <span>{readyAssetsCount}/{totalAssetsCount} Assets Preloaded</span>
        </div>
      </div>
    </aside>
  );
};
