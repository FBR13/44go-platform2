import { ReactNode } from 'react';

interface SectionContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function SectionContainer({ children, title, subtitle, className = '' }: SectionContainerProps) {
  return (
    // Respiro menor no mobile (py-6) e maior no PC (sm:py-12)
    <section className={`py-6 sm:py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          // Margem inferior mais contida no celular (mb-5)
          <div className="mb-5 sm:mb-8 flex flex-col items-center text-center sm:items-start sm:text-left">
            {title && (
              // Fonte um pouquinho menor no celular (text-xl)
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {title}
              </h2>
            )}
            {subtitle && (
              // Subtítulo mais delicado no mobile (text-sm)
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}