import { useState } from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SidebarMenu } from './sidebar-menu';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const scrollPosition = useScrollPosition();
  const isDark = resolvedTheme === 'dark';

  return (
    <header
      className={cn(
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        scrollPosition > 0 && 'border-b border-border',
      )}
    >
      <div className="container-fluid flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="lg:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  mode="icon"
                  aria-label="Open navigation"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="p-0 gap-0 w-[275px]"
                aria-describedby={undefined}
              >
                <SheetHeader className="p-5">
                  <SheetTitle>Expense Tracker</SheetTitle>
                </SheetHeader>
                <SheetBody className="p-0" onClick={() => setMenuOpen(false)}>
                  <SidebarMenu />
                </SheetBody>
              </SheetContent>
            </Sheet>
          </div>
          <Link to="/" className="font-semibold">
            Expense Tracker
          </Link>
        </div>
        <Button
          variant="ghost"
          mode="icon"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  );
}
