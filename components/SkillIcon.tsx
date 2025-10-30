interface SkillIconProps {
  skill: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function SkillIcon({ skill, size = 'medium', className = '' }: SkillIconProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10'
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