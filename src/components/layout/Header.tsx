import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/contexts/AuthContext';
import MobileMenu from './MobileMenu';
import Logo from './Logo';
import UserAvatar from './UserAvatar';
import NavigationLinks, { getNavLinks } from './NavigationLinks';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}
const Header = ({
  user,
  onLogout
}: HeaderProps) => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navLinks = getNavLinks(user);
  return <header className="bg-royal-blue text-white shadow-md sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="container mx-auto flex justify-between items-center py-2 px-4">
        <div className="flex items-center gap-2">
          {isMobile && <MobileMenu user={user} navLinks={navLinks} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} onLogout={onLogout} />}
          <Logo />
        </div>
        
        <NavigationLinks links={navLinks} />
        
        <div className="flex items-center gap-1 sm:gap-3">
          <UserAvatar user={user} />
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-white hover:bg-royal-blue/20" aria-label="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>;
};
export default Header;