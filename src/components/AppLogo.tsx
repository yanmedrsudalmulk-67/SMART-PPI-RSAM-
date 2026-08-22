import { ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/components/Providers';

interface AppLogoProps {
  className?: string;
  iconClassName?: string;
}

export function AppLogo({ className = "w-10 h-10", iconClassName = "w-6 h-6" }: AppLogoProps) {
  const { appLogoUrl } = useAppContext();
  
  if (appLogoUrl) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <Image src={appLogoUrl} alt="App Logo" fill sizes="80px" priority className="object-contain" referrerPolicy="no-referrer" />
      </div>
    );
  }
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <ShieldCheck className={`text-sky-400 ${iconClassName}`} />
    </div>
  );
}
