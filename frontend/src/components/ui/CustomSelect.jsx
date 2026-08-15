// filepath: frontend/src/components/ui/CustomSelect.jsx
import { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';

const CustomSelect = ({
      options = [],
      value,
      onChange,
      placeholder = 'Select option...',
      className = '',
      triggerClassName = '',
      menuClassName = '',
      renderOption,
      renderValue,
      disabled = false,
      error = false,
      dir
}) => {
      const [isOpen, setIsOpen] = useState(false);
      const dropdownRef = useRef(null);

      const selectedOption = options.find((opt) => String(opt.value) === String(value)) || null;

      useEffect(() => {
            const handleClickOutside = (e) => {
                  if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                        setIsOpen(false);
                  }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      const handleSelect = (option) => {
            if (onChange) onChange(option.value, option);
            setIsOpen(false);
      };

      return (
            <div className={`relative shrink-0 ${ className }`} ref={dropdownRef} dir={dir}>
                  <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setIsOpen(!isOpen)}
                        className={`w-full flex items-center justify-between gap-2 px-4 py-3.5 bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer select-none focus:outline-none ${ error
                                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                                    : isOpen
                                          ? 'border-primary ring-4 ring-primary/10 shadow-sm'
                                          : 'border-gray-200 hover:border-primary/50'
                              } ${ disabled ? 'opacity-50 cursor-not-allowed' : '' } ${ triggerClassName }`}
                  >
                        <div className="flex items-center gap-2 truncate text-start flex-1 min-w-0">
                              {renderValue ? (
                                    renderValue(selectedOption)
                              ) : selectedOption ? (
                                    <span className="text-sm font-bold text-dark truncate">
                                          {selectedOption.label || selectedOption.name || selectedOption.value}
                                    </span>
                              ) : (
                                    <span className="text-sm font-medium text-gray-400 truncate">
                                          {placeholder}
                                    </span>
                              )}
                        </div>
                        <FaChevronDown
                              className={`text-[10px] text-gray-400 transition-transform duration-300 shrink-0 ${ isOpen ? 'rotate-180 text-primary' : ''
                                    }`}
                        />
                  </button>

                  {isOpen && (
                        <div
                              className={`absolute top-full start-0 mt-2 w-full min-w-[13rem] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up max-h-60 overflow-y-auto py-1.5 text-start ${ menuClassName }`}
                        >
                              {options.map((option, idx) => {
                                    const isSelected = String(option.value) === String(value);
                                    return (
                                          <button
                                                key={option.value ?? idx}
                                                type="button"
                                                onClick={() => handleSelect(option)}
                                                className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold transition-all duration-200 cursor-pointer group/opt hover:bg-primary/5 hover:text-primary ${ isSelected
                                                            ? 'bg-primary/10 text-primary border-s-4 border-primary'
                                                            : 'text-gray-700 border-s-4 border-transparent'
                                                      }`}
                                          >
                                                {renderOption
                                                      ? renderOption(option, isSelected)
                                                      : option.label || option.name || option.value}
                                          </button>
                                    );
                              })}
                        </div>
                  )}
            </div>
      );
};

export default CustomSelect;