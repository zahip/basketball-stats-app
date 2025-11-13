'use client'

interface PlayerAvatarProps {
  src?: string
  firstName: string
  lastName: string
  jerseyNumber?: number
  className?: string
}

export function PlayerAvatar({
  src,
  firstName,
  lastName,
  jerseyNumber,
  className = 'h-10 w-10',
}: PlayerAvatarProps) {
  // Generate initials from player name
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={`${firstName} ${lastName}`}
          className={`${className} rounded-full object-cover bg-blue-500`}
        />
      ) : (
        <div
          className={`${className} rounded-full bg-blue-500 text-white font-semibold flex items-center justify-center text-sm`}
        >
          {initials}
        </div>
      )}
      {jerseyNumber !== undefined && (
        <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
          {jerseyNumber}
        </div>
      )}
    </div>
  )
}
