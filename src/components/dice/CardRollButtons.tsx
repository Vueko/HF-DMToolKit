import { parseAttackModifier, rollableDamageNotation } from '../../dice/cardRolls'
import { useDiceStore } from '../../store/diceStore'

interface CardRollButtonsProps {
    title: string
    attackModifier?: string
    attackDamage?: string
    attackDamageType?: 'physical' | 'magical'
    className?: string
}

export function CardRollButtons({
    title,
    attackModifier,
    attackDamage,
    attackDamageType,
    className = '',
}: CardRollButtonsProps) {
    const rollD20 = useDiceStore((s) => s.rollD20)
    const rollNotation = useDiceStore((s) => s.rollNotation)
    const attack = parseAttackModifier(attackModifier)
    const damage = rollableDamageNotation(attackDamage)

    return (
        <>
            {attackModifier && (
                attack === null ? (
                    <span className={`text-card-text font-bold ${className}`}>{attackModifier}</span>
                ) : (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation()
                            rollD20({ modifier: attack, label: `${title} attack` })
                        }}
                        title={`Roll ${title} attack`}
                        className={`text-card-text font-bold underline decoration-red-700/40 underline-offset-2 hover:text-red-700 transition-colors ${className}`}
                    >
                        {attackModifier}
                    </button>
                )
            )}
            {attackDamage && (
                <>
                    {damage === null ? (
                        <span className={`text-card-text font-mono ${className}`}>{attackDamage}</span>
                    ) : (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation()
                                rollNotation(damage, { label: `${title} damage` })
                            }}
                            title={`Roll ${title} damage`}
                            className={`text-card-text font-mono underline decoration-hope-gold/50 underline-offset-2 hover:text-hope-primary transition-colors ${className}`}
                        >
                            {attackDamage}
                        </button>
                    )}
                    {attackDamageType && (
                        <span className={`font-semibold ${attackDamageType === 'physical' ? 'text-orange-700' : 'text-blue-700'}`}>
                            {attackDamageType === 'physical' ? 'phys' : 'magic'}
                        </span>
                    )}
                </>
            )}
        </>
    )
}
