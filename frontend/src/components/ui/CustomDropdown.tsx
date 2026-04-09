'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export function CustomDropdown({ label, options, value, onChange, placeholder = "Selecione...", icon }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="flex flex-col w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
          {icon} {label}
        </label>
      )}

      <div className="relative">
        {/* Gatilho (Botão) */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-gray-50 border p-4 rounded-2xl transition-all outline-none ${
            isOpen ? 'border-[#fa7109] ring-2 ring-[#fa7109]/10' : 'border-gray-200'
          }`}
        >
          <span className={`font-medium ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown 
            size={20} 
            className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#fa7109]' : ''}`} 
          />
        </button>

        {/* Menu de Opções */}
        {isOpen && (
          <div className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    value === option.value
                      ? 'bg-orange-50 text-[#fa7109]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                  {value === option.value && <Check size={16} className="text-[#fa7109]" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}