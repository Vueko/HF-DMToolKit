import { useState } from 'react'
import { useSoundboardStore } from '../store/soundboardStore'
import SoundCategory from '../components/soundboard/SoundCategory'
import { PageHeader, EmptyState } from '../components/ui'

function Soundboard() {
    const { categories, sounds, activeAmbientIds, addCategory } = useSoundboardStore()
    const [newCategoryName, setNewCategoryName] = useState('')
    const [showCategoryInput, setShowCategoryInput] = useState(false)

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return
        addCategory(newCategoryName.trim())
        setNewCategoryName('')
        setShowCategoryInput(false)
    }

    const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAddCategory()
        if (e.key === 'Escape') { setShowCategoryInput(false); setNewCategoryName('') }
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title="Soundboard">
                {showCategoryInput ? (
                    <div className="flex items-center gap-2">
                        <input
                            autoFocus
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={handleCategoryKeyDown}
                            placeholder="Nombre de categoría..."
                            className="bg-ui-surface2 border border-ui-surface2 focus:border-fear-light rounded-lg px-3 py-2 text-sm text-ui-text outline-none transition-colors"
                        />
                        <button
                            onClick={handleAddCategory}
                            className="bg-fear-light hover:bg-fear-secondary text-ui-text px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                        >
                            Crear
                        </button>
                        <button
                            onClick={() => { setShowCategoryInput(false); setNewCategoryName('') }}
                            className="text-ui-muted hover:text-ui-text hover:bg-ui-surface2/40 px-3 py-2 rounded-lg transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCategoryInput(true)}
                        className="bg-fear-light hover:bg-fear-secondary text-ui-text px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                    >
                        + Nueva Categoría
                    </button>
                )}
            </PageHeader>

            {categories.length === 0 ? (
                <EmptyState
                    title="No hay categorías todavía."
                    action={
                        <button
                            onClick={() => setShowCategoryInput(true)}
                            className="text-ui-muted hover:text-ui-text hover:bg-ui-surface2/40 px-3 py-1.5 rounded-lg transition-colors text-sm"
                        >
                            Nueva Categoría →
                        </button>
                    }
                />
            ) : (
                categories.map((cat) => (
                    <SoundCategory
                        key={cat.id}
                        category={cat}
                        sounds={sounds.filter((s) => s.categoryId === cat.id)}
                        activeAmbientIds={activeAmbientIds}
                    />
                ))
            )}
        </div>
    )
}

export default Soundboard
