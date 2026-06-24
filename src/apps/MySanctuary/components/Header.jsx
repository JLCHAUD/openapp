export function Header({ kicker, title, isSecondary, onBack, onHome }) {
  return (
    <header className="ms-header">
      {isSecondary && (
        <button className="ms-header-back" onClick={onBack}>‹</button>
      )}
      <div className="ms-header-content">
        <div className="ms-header-kicker">{kicker}</div>
        <div className="ms-header-title">{title}</div>
      </div>
      {!isSecondary && onHome && (
        <button className="ms-header-home" onClick={onHome}>✕</button>
      )}
    </header>
  )
}
