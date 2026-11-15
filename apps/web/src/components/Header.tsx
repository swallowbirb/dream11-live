import { Link } from 'react-router';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-brand text-white shadow-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-white font-display text-lg font-extrabold text-brand">
            D
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Dream11 <span className="font-semibold opacity-80">Live</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
