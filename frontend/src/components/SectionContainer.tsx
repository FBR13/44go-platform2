import { ReactNode } from 'react';

interface SectionContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function SectionContainer({ children, title, subtitle, className = '' }: SectionContainerProps) {
  return (
    <section className={`py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="mb-8 flex flex-col items-center text-center sm:items-start sm:text-left">
            {title && <h2 className="text-2xl font-bold text-gray-900">{title}</h2>}
            {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}