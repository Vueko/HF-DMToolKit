import SoundsSection from '../components/soundboard/SoundsSection'
import { PageHeader } from '../components/ui'
import { useT } from '../i18n'

function Soundboard() {
    const t = useT()

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title={t('soundboard.title')} />
            <SoundsSection />
        </div>
    )
}

export default Soundboard