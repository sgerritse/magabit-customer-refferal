import React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  className 
}) => {
  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    score = Object.values(checks).filter(Boolean).length;
    return { score, checks };
  };

  const { score, checks } = getPasswordStrength(password);
  
  const getStrengthLevel = () => {
    if (score < 3) return { text: 'Weak', color: 'bg-red-500' };
    if (score < 4) return { text: 'Fair', color: 'bg-yellow-500' };
    if (score < 5) return { text: 'Good', color: 'bg-blue-500' };
    return { text: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrengthLevel();

  if (!password) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center space-x-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300", strength.color)}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium">{strength.text}</span>
      </div>
      
      <div className="text-xs space-y-1">
        <div className={cn("flex items-center", checks.length ? "text-green-600" : "text-gray-400")}>
          <span className="mr-1">{checks.length ? "✓" : "✗"}</span>
          At least 8 characters
        </div>
        <div className={cn("flex items-center", checks.lowercase ? "text-green-600" : "text-gray-400")}>
          <span className="mr-1">{checks.lowercase ? "✓" : "✗"}</span>
          Lowercase letter
        </div>
        <div className={cn("flex items-center", checks.uppercase ? "text-green-600" : "text-gray-400")}>
          <span className="mr-1">{checks.uppercase ? "✓" : "✗"}</span>
          Uppercase letter
        </div>
        <div className={cn("flex items-center", checks.numbers ? "text-green-600" : "text-gray-400")}>
          <span className="mr-1">{checks.numbers ? "✓" : "✗"}</span>
          Number
        </div>
        <div className={cn("flex items-center", checks.special ? "text-green-600" : "text-gray-400")}>
          <span className="mr-1">{checks.special ? "✓" : "✗"}</span>
          Special character
        </div>
      </div>
    </div>
  );
};