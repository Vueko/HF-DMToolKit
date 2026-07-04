import { useState } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import { Button, Textarea, Panel } from '../components/ui'
import { UserIcon, ScrollIcon } from '../components/icons'

const FIRST_NAMES_LATIN = [
    'Aurelius', 'Cassius', 'Lucius', 'Maximus', 'Octavius', 'Quintus', 'Silas', 'Titus', 'Valerius', 'Felix',
    'Ignatius', 'Justus', 'Lucian', 'Marcus', 'Nero', 'Paulus', 'Rufus', 'Severus', 'Tiberius', 'Victor',
    'Aurora', 'Camilla', 'Clara', 'Flavia', 'Julia', 'Livia', 'Marina', 'Octavia', 'Silvia', 'Valeria',
    'Antonia', 'Cecilia', 'Diana', 'Flora', 'Lucia', 'Marcella', 'Priscilla', 'Sabina', 'Tullia', 'Victoria'
]

const LAST_NAMES_ARTHURIAN = [
    'Pendragon', 'Du Lac', 'Le Fay', 'Gawain', 'Galahad', 'Tristan', 'Percival', 'Bedivere', 'Bors', 'Gareth',
    'Tintagel', 'Avalon', 'Camelot', 'Lionesse', 'Astolat', 'Corbenic', 'Glastonbury', 'Logres', 'Lothian'
]

const LAST_NAMES_WESTERN = [
    'Cassidy', 'Holliday', 'Dalton', 'Oakley', 'Hickok', 'Earp', 'James', 'McCoy', 'Boone', 'Starr',
    'Slade', 'Colt', 'Winchester', 'Remington', 'Wesson', 'Bowie', 'Crockett', 'Masterson', 'Ringo'
]

const LAST_NAMES_AVATAR = [
    'te Suli', 'te Kanhì', 'te Tskaha', 'Kamun', 'Tsu\'tey', 'Neytiri', 'Mo\'at', 'Eytukan', 'Sylwanin',
    'Omaticaya', 'Metkayina', 'Olangi', 'Tayrangi', 'Tawkami', 'Tipani', 'Kekunan', 'Ni\'awve'
]

const LAST_NAMES_FF = [
    'Strife', 'Gainsborough', 'Lockhart', 'Wallace', 'Leonhart', 'Heartilly', 'Almasy', 'Crescent', 'Highwind',
    'Valentine', 'Fair', 'Branford', 'Chere', 'Kramer', 'Kinneas', 'Tribal', 'Garnet', 'Zidane', 'Vivi'
]

const ALL_LAST_NAMES = [
    ...LAST_NAMES_ARTHURIAN,
    ...LAST_NAMES_WESTERN,
    ...LAST_NAMES_AVATAR,
    ...LAST_NAMES_FF
]

function generateName() {
    const first = FIRST_NAMES_LATIN[Math.floor(Math.random() * FIRST_NAMES_LATIN.length)]
    const last = ALL_LAST_NAMES[Math.floor(Math.random() * ALL_LAST_NAMES.length)]
    return `${first} ${last}`
}

function DMScreen() {
    const { campaigns, currentCampaignId, updateCampaignRules } = useCampaignStore()
    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null

    const [generatedNames, setGeneratedNames] = useState<string[]>(() => Array.from({ length: 4 }, generateName))
    const [activeRuleTab, setActiveRuleTab] = useState<string | null>(null)

    const handleGenerateNames = () => {
        setGeneratedNames(Array.from({ length: 4 }, generateName))
    }

    const toggleRuleTab = (tab: string) => {
        setActiveRuleTab(prev => prev === tab ? null : tab)
    }

    if (!currentCampaignId || !currentCampaign) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center bg-ui-surface p-8 rounded-xl border border-ui-surface2">
                    <h2 className="text-xl text-ui-text font-display mb-2">No Campaign Selected</h2>
                    <p className="text-ui-muted text-sm">Please select a campaign to view the DM Screen.</p>
                </div>
            </div>
        )
    }

    const rulesContent = currentCampaign.dmScreenRules || ''

    return (
        <div className="flex flex-col h-full w-full max-w-7xl mx-auto overflow-hidden">
            <header className="flex items-center justify-between p-6 shrink-0 border-b border-ui-surface2">
                <div>
                    <h1 className="text-2xl font-display font-bold text-ui-text">DM Screen</h1>
                    <p className="text-sm text-ui-muted mt-1">Quick Reference & Campaign Tools</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">

                    <div className="overflow-x-auto border border-ui-surface2 rounded-xl bg-ui-bg shadow-sm">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-ui-surface/80 text-ui-text font-display border-b-2 border-ui-surface2">
                                <tr>
                                    <th colSpan={6} className="p-5 border-b border-ui-surface2 bg-ui-surface/50">
                                        <h2 className="text-xl font-display font-bold text-ui-text flex items-center gap-2">
                                            Difficulty References
                                        </h2>
                                    </th>
                                </tr>
                                <tr>
                                    <th className="p-4 w-32 border-r border-ui-surface2 font-bold tracking-wider uppercase text-xs opacity-80">Attribute</th>
                                    <th className="p-4 border-r border-ui-surface2 min-w-[200px]">
                                        <div className="flex flex-col">
                                            <span className="text-lg">DC 10</span>
                                            <span className="text-[10px] text-ui-text uppercase tracking-widest bg-ui-surface2 px-2 py-0.5 rounded w-max mt-1">Easy</span>
                                        </div>
                                    </th>
                                    <th className="p-4 border-r border-ui-surface2 min-w-[200px]">
                                        <div className="flex flex-col text-hope-yellow">
                                            <span className="text-lg">DC 15</span>
                                            <span className="text-[10px] uppercase tracking-widest bg-hope-yellow/20 px-2 py-0.5 rounded w-max mt-1">Standard</span>
                                        </div>
                                    </th>
                                    <th className="p-4 border-r border-ui-surface2 min-w-[200px]">
                                        <div className="flex flex-col text-hope-primary">
                                            <span className="text-lg">DC 20</span>
                                            <span className="text-[10px] uppercase tracking-widest bg-hope-primary/20 px-2 py-0.5 rounded w-max mt-1">Hard</span>
                                        </div>
                                    </th>
                                    <th className="p-4 border-r border-ui-surface2 min-w-[200px]">
                                        <div className="flex flex-col text-fear-light">
                                            <span className="text-lg">DC 25</span>
                                            <span className="text-[10px] uppercase tracking-widest bg-fear-light/20 px-2 py-0.5 rounded w-max mt-1">Very Hard</span>
                                        </div>
                                    </th>
                                    <th className="p-4 min-w-[200px]">
                                        <div className="flex flex-col text-fear-primary">
                                            <span className="text-lg">DC 30+</span>
                                            <span className="text-[10px] uppercase tracking-widest bg-fear-primary/20 px-2 py-0.5 rounded w-max mt-1">Impossible</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ui-surface2 text-ui-muted">
                                <tr className="hover:bg-ui-surface/30 transition-colors group">
                                    <td className="p-4 font-bold text-ui-text uppercase text-[11px] tracking-wider border-r border-ui-surface2">Agility</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Jump a small gap or duck a slow swing.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Balance across a wet, narrow beam.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Dodge falling rocks in a collapsing cave.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Sprint across a crumbling bridge.</td>
                                    <td className="p-4 group-hover:text-ui-text transition-colors">Catch a fired arrow mid-air.</td>
                                </tr>
                                <tr className="hover:bg-ui-surface/30 transition-colors group">
                                    <td className="p-4 font-bold text-ui-text uppercase text-[11px] tracking-wider border-r border-ui-surface2">Strength</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Kick open a rotten wooden door.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Push a heavy boulder out of the way.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Bend thick iron bars with bare hands.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Hold a massive stone portcullis open.</td>
                                    <td className="p-4 group-hover:text-ui-text transition-colors">Lift a collapsing ceiling.</td>
                                </tr>
                                <tr className="hover:bg-ui-surface/30 transition-colors group">
                                    <td className="p-4 font-bold text-ui-text uppercase text-[11px] tracking-wider border-r border-ui-surface2">Finesse</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Pick a rusty, simple padlock.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Pickpocket a distracted guard.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Disable an active mechanical trap.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Forge a flawless royal seal.</td>
                                    <td className="p-4 group-hover:text-ui-text transition-colors">Steal a ring right off a king's finger.</td>
                                </tr>
                                <tr className="hover:bg-ui-surface/30 transition-colors group">
                                    <td className="p-4 font-bold text-ui-text uppercase text-[11px] tracking-wider border-r border-ui-surface2">Knowledge</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Recall common local folklore.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Translate a text in a rare language.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Recall obscure magical theory.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Understand completely alien architecture.</td>
                                    <td className="p-4 group-hover:text-ui-text transition-colors">Translate a lost god's language instantly.</td>
                                </tr>
                                <tr className="hover:bg-ui-surface/30 transition-colors group">
                                    <td className="p-4 font-bold text-ui-text uppercase text-[11px] tracking-wider border-r border-ui-surface2">Instinct</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Notice an obvious, poorly hidden trap.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Track faint footprints in light rain.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Sense an invisible magical stalker.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Anticipate an assassin's silent strike.</td>
                                    <td className="p-4 group-hover:text-ui-text transition-colors">Fight perfectly while blinded.</td>
                                </tr>
                                <tr className="hover:bg-ui-surface/30 transition-colors group">
                                    <td className="p-4 font-bold text-ui-text uppercase text-[11px] tracking-wider border-r border-ui-surface2">Presence</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Intimidate a cowardly, unarmed goblin.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Persuade a skeptical, greedy merchant.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Command an angry mob to halt.</td>
                                    <td className="p-4 border-r border-ui-surface2 group-hover:text-ui-text transition-colors">Lie convincingly to a truth-seeking deity.</td>
                                    <td className="p-4 group-hover:text-ui-text transition-colors">Convince a dragon to give up its hoard.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <hr className="border-t-2 border-ui-surface2 rounded-full" />
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        <Panel size="spacious" className="lg:col-span-2 flex flex-col gap-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-display font-bold text-ui-text"><span className="inline-flex items-center gap-2"><UserIcon className="w-4 h-4" /> Quick NPC Names</span></h3>
                                <button
                                    onClick={handleGenerateNames}
                                    className="text-xs bg-hope-primary hover:bg-hope-gold text-white px-2 py-1 rounded transition-colors font-bold uppercase tracking-wider"
                                >
                                    Reroll
                                </button>
                            </div>
                            <div className="flex flex-col gap-2">
                                {generatedNames.map((name, i) => (
                                    <div key={i} className="bg-ui-bg border border-ui-surface2 rounded-lg px-3 py-2 text-ui-text font-medium text-[13px] flex justify-between items-center shadow-sm">
                                        {name}
                                        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(name)} title="Copy to clipboard">
                                            Copy
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Panel>

                        <Panel size="spacious" className="lg:col-span-3 flex flex-col gap-3 shadow-sm">
                            <h3 className="text-md font-display font-bold text-ui-text mb-2"><span className="inline-flex items-center gap-2"><ScrollIcon className="w-4 h-4" /> Rules Reference</span></h3>

                            <div className="flex flex-col gap-2">
                                <div className="border border-ui-surface2 rounded-lg bg-ui-bg overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => toggleRuleTab('advantage')}
                                        className="w-full px-4 py-3 text-left font-bold text-sm text-ui-text hover:bg-ui-surface transition-colors flex justify-between items-center"
                                    >
                                        Advantage & Disadvantage
                                        <span className="text-ui-muted text-xs">{activeRuleTab === 'advantage' ? '▼' : '▶'}</span>
                                    </button>
                                    {activeRuleTab === 'advantage' && (
                                        <div className="px-4 pb-4 pt-2 text-[13px] leading-relaxed text-ui-muted space-y-2 border-t border-ui-surface2/50 mt-1">
                                            <p><strong className="text-ui-text">Advantage:</strong> Roll an extra <strong>d6</strong> and add it to your total result.</p>
                                            <p><strong className="text-ui-text">Disadvantage:</strong> Roll an extra <strong>d6</strong> and subtract it from your total result.</p>
                                            <p><em>Note: If you have both Advantage and Disadvantage on a roll, they cancel each other out completely. You can only have one instance of Advantage or Disadvantage applied at a time.</em></p>
                                        </div>
                                    )}
                                </div>

                                <div className="border border-ui-surface2 rounded-lg bg-ui-bg overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => toggleRuleTab('conditions')}
                                        className="w-full px-4 py-3 text-left font-bold text-sm text-ui-text hover:bg-ui-surface transition-colors flex justify-between items-center"
                                    >
                                        Conditions
                                        <span className="text-ui-muted text-xs">{activeRuleTab === 'conditions' ? '▼' : '▶'}</span>
                                    </button>
                                    {activeRuleTab === 'conditions' && (
                                        <div className="px-4 pb-4 pt-2 text-[13px] leading-relaxed text-ui-muted space-y-2 border-t border-ui-surface2/50 mt-1">
                                            <p><strong className="text-ui-text">Vulnerable:</strong> Incoming attacks have Advantage against this target.</p>
                                            <p><strong className="text-ui-text">Restrained:</strong> Target cannot move. Agility rolls are made with Disadvantage.</p>
                                            <p><strong className="text-ui-text">Hidden:</strong> Cannot be targeted directly by enemies. Your next attack has Advantage.</p>
                                            <p><strong className="text-ui-text">Stressed:</strong> Cannot spend Hope while Stressed. Must clear stress to use abilities requiring Hope.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="border border-ui-surface2 rounded-lg bg-ui-bg overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => toggleRuleTab('gmtips')}
                                        className="w-full px-4 py-3 text-left font-bold text-sm text-ui-text hover:bg-ui-surface transition-colors flex justify-between items-center"
                                    >
                                        GM Tips & Pacing
                                        <span className="text-ui-muted text-xs">{activeRuleTab === 'gmtips' ? '▼' : '▶'}</span>
                                    </button>
                                    {activeRuleTab === 'gmtips' && (
                                        <div className="px-4 pb-4 pt-2 text-[13px] leading-relaxed text-ui-muted space-y-2 border-t border-ui-surface2/50 mt-1">
                                            <p><strong className="text-ui-text">Fail Forward:</strong> A failed roll doesn't mean "nothing happens". It means the situation gets worse or a complication arises.</p>
                                            <p><strong className="text-ui-text">Success with Fear:</strong> The character achieves their goal, but it costs them something, causes collateral damage, or introduces a new threat.</p>
                                            <p><strong className="text-ui-text">Spending Fear:</strong> Use your Fear tokens to: Interrupt the players (take a GM turn), activate powerful adversary abilities, or add tokens to the Action Tracker.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="border border-ui-surface2 rounded-lg bg-ui-bg overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => toggleRuleTab('homebrew')}
                                        className="w-full px-4 py-3 text-left font-bold text-sm text-ui-text hover:bg-ui-surface transition-colors flex justify-between items-center"
                                    >
                                        Homebrew
                                        <span className="text-ui-muted text-xs">{activeRuleTab === 'homebrew' ? '▼' : '▶'}</span>
                                    </button>
                                    {activeRuleTab === 'homebrew' && (
                                        <div className="px-4 pb-4 pt-3 border-t border-ui-surface2/50 mt-1">
                                            <Textarea
                                                theme="fear"
                                                value={rulesContent}
                                                onChange={(e) => updateCampaignRules(currentCampaignId, e.target.value)}
                                                className="h-48 text-ui-muted leading-relaxed placeholder:text-ui-muted/50"
                                                placeholder="Type your custom campaign rules, reminders, or table agreements here... (Plain text, auto-saves)"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Panel>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DMScreen