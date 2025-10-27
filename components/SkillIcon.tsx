// components/SkillIcon.tsx
interface SkillIconProps {
  skill: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function SkillIcon({ skill, size = 'medium', className = '' }: SkillIconProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <img
      src={`/icons/skills/${skill.toLowerCase()}.png`}
      alt={skill}
      className={`${sizeClasses[size]} ${className}`}
      style={{ imageRendering: 'pixelated' }}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}