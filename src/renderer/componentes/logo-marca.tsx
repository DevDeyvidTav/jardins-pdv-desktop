import logoUrl from '../assets/logo-jardins.jpg'

type LogoMarcaProps = {
  tamanho?: 'compacto' | 'medio' | 'destaque'
  className?: string
}

export function LogoMarca({ tamanho = 'compacto', className = '' }: LogoMarcaProps) {
  return (
    <div
      className={`logo-marca logo-marca--${tamanho} ${className}`.trim()}
      data-testid="logo-jardins"
    >
      <img src={logoUrl} alt="Jardins Restaurante" className="logo-marca__imagem" />
    </div>
  )
}
