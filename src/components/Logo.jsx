const Logo = ({ size = 48, className = "", hideText = false }) => (
  <div className={`flex items-center gap-3 ${className}`} style={{ color: 'var(--primary)' }}>
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {/* Taller Sprout */}
      <path d="M70,180 C70,180 60,110 75,50 C65,45 45,55 45,70 C55,80 70,65 75,50" fill="currentColor"/>
      <path d="M75,50 C80,30 100,20 110,30 C105,50 85,55 75,50" fill="currentColor"/>
      <path d="M75,50 C60,30 40,20 30,30 C35,50 55,55 75,50" fill="currentColor"/>
      <path d="M72,110 C85,90 100,90 105,110 C95,125 80,120 72,110" fill="currentColor"/>
      
      {/* Shorter Sprout */}
      <path d="M140,180 C140,180 135,130 145,90 C135,85 120,95 120,105 C125,115 140,105 145,90" fill="currentColor"/>
      <path d="M145,90 C155,75 175,70 180,85 C170,100 155,100 145,90" fill="currentColor"/>
      <path d="M145,90 C130,70 110,65 105,80 C115,95 135,95 145,90" fill="currentColor"/>
    </svg>
    {!hideText && (
      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
        GrowMore <span style={{ color: 'var(--primary)' }}>CRM</span>
      </span>
    )}
  </div>
);

export default Logo;
