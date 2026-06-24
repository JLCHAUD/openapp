import { Mic } from 'lucide-react'

export function N3Dictee() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', flex: 1, gap: 20, padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%',
        background: '#1e1e2e', border: '1px solid #3a3a55',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Mic size={32} color="#3a3a55" />
      </div>
      <div>
        <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 22,
          color: '#6a6a82', fontStyle: 'italic', marginBottom: 8 }}>
          Dictée vocale
        </div>
        <div className="kicker" style={{ color: '#3a3a55' }}>BIENTÔT DISPONIBLE</div>
      </div>
      <div style={{ fontSize: 13, color: '#3a3a55', maxWidth: 240 }}>
        La transcription automatique de tes prières et prophéties sera disponible prochainement.
      </div>
    </div>
  )
}
