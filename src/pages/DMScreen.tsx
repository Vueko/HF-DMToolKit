import { useState } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import { Button, Textarea, Panel } from '../components/ui'
import { UserIcon, ScrollIcon } from '../components/icons'
import { useT } from '../i18n'

const FIRST_NAMES = [
    'Alden', 'Ansel', 'Bren', 'Cael', 'Corin', 'Darian', 'Elden', 'Garrick', 'Hale', 'Ilan',
    'Joren', 'Kael', 'Lorian', 'Merek', 'Nolan', 'Orin', 'Perrin', 'Quill', 'Ronan', 'Tavian',
    'Adara', 'Bryn', 'Celia', 'Dalia', 'Elara', 'Fenna', 'Greta', 'Isolde', 'Jessa', 'Kira',
    'Liora', 'Mara', 'Nessa', 'Orla', 'Petra', 'Rowan', 'Selene', 'Talia', 'Vera', 'Ysolde',
]

const LAST_NAMES = [
    'Ashford', 'Blackwell', 'Brightmere', 'Coldwater', 'Duskryn', 'Emberly', 'Fairwind', 'Frostvale',
    'Goldmere', 'Graymont', 'Hawthorne', 'Highbrook', 'Ironvale', 'Keensong', 'Lowmarch', 'Moonridge',
    'Nightbloom', 'Oakheart', 'Ravenshade', 'Redfield', 'Silverbrook', 'Stonebridge', 'Stormwell',
    'Thornfield', 'Valehart', 'Westmere', 'Wildmere', 'Windhaven', 'Wintermere', 'Wolfsong',
]

function generateName() {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
    return `${first} ${last}`
}

function DMScreen() {
    const t = useT()
    const { campaigns, currentCampaignId, updateCampaignRules } = useCampaignStore()
    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null

    const [generatedNames, setGeneratedNames] = useState<string[]>(() => Array.from({ length: 6 }, generateName))

    const handleGenerateNames = () => {
        setGeneratedNames(Array.from({ length: 6 }, generateName))
    }

    if (!currentCampaignId || !currentCampaign) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center bg-ui-surface p-8 rounded-xl border border-ui-surface2">
                    <h2 className="text-xl text-ui-text font-display mb-2">{t('dmScreen.noCampaignSelected')}</h2>
                    <p className="text-ui-muted text-sm">{t('dmScreen.selectCampaignHint')}</p>
                </div>
            </div>
        )
    }

    const notesContent = currentCampaign.dmScreenRules || ''

    return (
        <div className="flex flex-col h-full w-full max-w-7xl mx-auto overflow-hidden">
            <header className="flex items-center justify-between p-6 shrink-0 border-b border-ui-surface2">
                <div>
                    <h1 className="text-2xl font-display font-bold text-ui-text">{t('dmScreen.title')}</h1>
                    <p className="text-sm text-ui-muted mt-1">{t('dmScreen.subtitle')}</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start max-w-6xl mx-auto pb-12">
                    <Panel size="spacious" className="lg:col-span-2 flex flex-col gap-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-md font-display font-bold text-ui-text">
                                <span className="inline-flex items-center gap-2"><UserIcon className="w-4 h-4" /> {t('dmScreen.quickNpcNames')}</span>
                            </h3>
                            <button
                                onClick={handleGenerateNames}
                                className="text-xs bg-hope-primary hover:bg-hope-gold text-white px-2 py-1 rounded transition-colors font-bold uppercase tracking-wider"
                            >
                                {t('dmScreen.reroll')}
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {generatedNames.map((name, i) => (
                                <div key={i} className="bg-ui-bg border border-ui-surface2 rounded-lg px-3 py-2 text-ui-text font-medium text-[13px] flex justify-between items-center shadow-sm">
                                    {name}
                                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(name)} title={t('dmScreen.copyToClipboard')}>
                                        {t('dmScreen.copy')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <Panel size="spacious" className="lg:col-span-3 flex flex-col gap-3 shadow-sm">
                        <h3 className="text-md font-display font-bold text-ui-text mb-2">
                            <span className="inline-flex items-center gap-2"><ScrollIcon className="w-4 h-4" /> {t('dmScreen.tableNotes')}</span>
                        </h3>
                        <Textarea
                            theme="fear"
                            value={notesContent}
                            onChange={(e) => updateCampaignRules(currentCampaignId, e.target.value)}
                            className="min-h-[28rem] text-ui-muted leading-relaxed placeholder:text-ui-muted/50"
                            placeholder={t('dmScreen.homebrewPlaceholder')}
                        />
                    </Panel>
                </div>
            </div>
        </div>
    )
}

export default DMScreen