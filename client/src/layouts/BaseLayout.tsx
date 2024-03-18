import { useState } from 'react';
import { Link, Outlet, NavLink, useLocation } from 'react-router-dom';
import UserNav from '../components/header/UserNav';

const navItems = [
  {
    label: 'Create Form',
    href: '/createForm',
  },
  {
    label: 'My Forms',
    href: '/my-forms',
  },
  {
    label: 'Settings',
    href: '/settings',
  },
];

export default function BaseLayout() {
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(prevState => !prevState);
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-30 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-6">
          <Link to="/">
            <h1 className="font-cursive text-3xl font-bold text-primary">
              EarnKart
            </h1>
          </Link>
          <button
            className="block focus:outline-none md:hidden"
            onClick={toggleMenu}
          >
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  isMenuOpen
                    ? 'M6 18L18 6M6 6l12 12'
                    : 'M4 6h16M4 12h16M4 18h16'
                }
              />
            </svg>
          </button>
          <nav className="hidden md:block">
            <ul className="grid h-9 w-96 grid-cols-3 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground md:flex">
              {navItems.map(({ label, href }, i) => (
                <li key={i}>
                  <NavLink
                    to={href}
                    className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      className={
                        location.pathname === href
                          ? 'bg-background text-foreground shadow'
                          : ''
                      }
                    >
                      {label}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <UserNav />
        </div>
        {isMenuOpen && (
          <nav className="absolute left-0 top-16 w-full bg-muted p-2 md:hidden">
            <ul>
              {navItems.map(({ label, href }, i) => (
                <li key={i}>
                  <NavLink
                    to={href}
                    className={`block px-4 py-2 text-sm font-medium text-muted-foreground ${
                      location.pathname === href
                        ? 'bg-background text-foreground shadow'
                        : ''
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main className="mx-auto mt-16 max-w-[1440px] px-6 py-5">
        <Outlet />
      </main>
    </>
  );
}
