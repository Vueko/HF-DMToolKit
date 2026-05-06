import { useState, useEffect } from 'react'

function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electron.window.isMaximized().then(setIsMaximized)
    return window.electron.window.onMaximize(setIsMaximized)
  }, [])

  return (
    <div
      className="flex items-center h-10 bg-ui-canvas shrink-0 select-none border-b border-ui-surface/40"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="w-64 px-4 flex items-center gap-2 shrink-0">
        <span className="text-hope-yellow font-display font-bold tracking-widest text-sm">HFTK</span>
        <span className="text-ui-muted text-xs">DM Toolkit</span>
      </div>

      <div className="flex-1" />

      <div
        className="flex h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => window.electron.window.minimize()}
          className="h-full px-4 text-ui-muted hover:text-ui-text hover:bg-ui-surface2 transition-colors text-xs"
          title="Minimizar"
        >
          ─
        </button>
        <button
          onClick={() => window.electron.window.maximize()}
          className="h-full px-4 text-ui-muted hover:text-ui-text hover:bg-ui-surface2 transition-colors text-xs"
          title={isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {isMaximized ? '❐' : '□'}
        </button>
        <button
          onClick={() => window.electron.window.close()}
          className="h-full px-4 text-ui-muted hover:text-white hover:bg-red-500 transition-colors text-xs"
          title="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default TitleBar