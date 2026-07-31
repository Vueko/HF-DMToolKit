import type { PartyMember, ResourceTrack } from '../types'
import { useCampaignStore } from '../store/campaignStore'
import { partyOf, usePartyStore } from '../store/partyStore'
import { Button, EmptyState, Input, PageHeader, Panel, Textarea } from '../components/ui'

const freshMember = (): PartyMember => ({
    id: crypto.randomUUID(),
    name: '',
    hp: { current: 6, max: 6 },
    stress: { current: 0, max: 6 },
    armorSlots: { current: 3, max: 3 },
    evasion: 10,
    thresholds: { major: 8, severe: 15 },
})

function asNumber(value: string): number {
    return Math.max(0, Math.trunc(Number(value) || 0))
}

function ResourceField({
    label,
    value,
    onChange,
}: {
    label: string
    value: ResourceTrack
    onChange: (value: ResourceTrack) => void
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-ui-muted">{label}</label>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
                <Input type="number" min={0} value={value.current} onChange={(e) => onChange({ ...value, current: asNumber(e.target.value) })} />
                <span className="text-ui-muted text-xs">/</span>
                <Input type="number" min={0} value={value.max} onChange={(e) => onChange({ current: Math.min(value.current, asNumber(e.target.value)), max: asNumber(e.target.value) })} />
            </div>
        </div>
    )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-ui-muted">{label}</label>
            <Input type="number" min={0} value={value} onChange={(e) => onChange(asNumber(e.target.value))} />
        </div>
    )
}

function Party() {
    const { campaigns, currentCampaignId } = useCampaignStore()
    const campaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const partyState = usePartyStore()
    const members = partyOf(partyState, currentCampaignId)
    const { addMember, updateMember, removeMember } = partyState

    if (!currentCampaignId || !campaign) {
        return (
            <div className="flex h-full items-center justify-center text-ui-muted">
                <Panel className="text-center">
                    <h1 className="font-display text-xl text-ui-text">No campaign selected</h1>
                    <p className="text-sm mt-1">Create or select a campaign before tracking PC resources.</p>
                </Panel>
            </div>
        )
    }

    const patch = (id: string, updates: Partial<PartyMember>) => updateMember(currentCampaignId, id, updates)

    return (
        <div className="flex flex-col gap-5 h-full overflow-hidden">
            <PageHeader title="PC Resources" subtitle={`${campaign.name} - HP, Stress, Armor Slots, Evasion, and thresholds`}>
                <Button variant="primary" onClick={() => addMember(currentCampaignId, freshMember())}>+ Add PC</Button>
            </PageHeader>

            {members.length === 0 ? (
                <EmptyState title="No PCs yet." action={<Button variant="primary" onClick={() => addMember(currentCampaignId, freshMember())}>Add first PC</Button>} />
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 overflow-y-auto pr-1">
                    {members.map((member) => (
                        <Panel key={member.id} className="flex flex-col gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-lg border border-hope-gold/40 bg-card-bg text-card-text font-display font-black flex items-center justify-center shrink-0">
                                    {(member.name.trim()[0] ?? '?').toUpperCase()}
                                </div>
                                <div className="grid grid-cols-2 gap-3 flex-1 min-w-0">
                                    <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-ui-muted">Character</label>
                                        <Input value={member.name} onChange={(e) => patch(member.id, { name: e.target.value })} placeholder="Character name" />
                                    </div>
                                    <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-ui-muted">Player</label>
                                        <Input value={member.playerName ?? ''} onChange={(e) => patch(member.id, { playerName: e.target.value.trim() ? e.target.value : undefined })} placeholder="Player name" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <ResourceField label="HP" value={member.hp} onChange={(hp) => patch(member.id, { hp })} />
                                <ResourceField label="Stress" value={member.stress} onChange={(stress) => patch(member.id, { stress })} />
                                <ResourceField label="Armor Slots" value={member.armorSlots} onChange={(armorSlots) => patch(member.id, { armorSlots })} />
                                <NumberField label="Evasion" value={member.evasion} onChange={(evasion) => patch(member.id, { evasion })} />
                                <NumberField label="Major" value={member.thresholds.major} onChange={(major) => patch(member.id, { thresholds: { ...member.thresholds, major } })} />
                                <NumberField label="Severe" value={member.thresholds.severe} onChange={(severe) => patch(member.id, { thresholds: { ...member.thresholds, severe } })} />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-ui-muted">Notes</label>
                                <Textarea rows={2} value={member.notes ?? ''} onChange={(e) => patch(member.id, { notes: e.target.value.trim() ? e.target.value : undefined })} />
                            </div>

                            <div className="flex justify-end">
                                <Button variant="destructive" size="sm" onClick={() => removeMember(currentCampaignId, member.id)}>Delete</Button>
                            </div>
                        </Panel>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Party
