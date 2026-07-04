import { useFearStore } from '../../store/fearStore'
import { useT } from '../../i18n'

function FearWidget() {
    const t = useT()
    const { fearCount, addFear, removeFear, resetFear } = useFearStore()

    return (
        <div className="bg-fear-primary rounded-xl p-5 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span>💀</span>
                    <h3 className="text-ui-text font-display font-semibold">{t('dashboard.fearTracker')}</h3>
                </div>
                <button
                    onClick={resetFear}
                    className="text-xs text-ui-muted hover:text-ui-text transition-colors px-2 py-1 rounded hover:bg-fear-secondary"
                >
                    {t('dashboard.reset')}
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-center py-4">
                <div className="flex items-center justify-between px-4">
                    <button
                        onClick={() => removeFear(1)}
                        className="w-12 h-12 rounded-full bg-fear-secondary hover:bg-fear-light text-ui-text text-2xl font-bold transition-colors flex items-center justify-center"
                    >
                        −
                    </button>

                    <span className="text-8xl font-bold text-ui-text font-display select-none">
                        {fearCount}
                    </span>

                    <button
                        onClick={() => addFear(1)}
                        disabled={fearCount >= 12}
                        className="w-12 h-12 rounded-full bg-fear-light hover:bg-fear-secondary text-ui-text text-2xl font-bold transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        +
                    </button>
                </div>
            </div>

            <p className="text-ui-muted text-xs text-center">
                {t('dashboard.fearSessionLevel')}
            </p>
        </div>
    )
}

export default FearWidget
