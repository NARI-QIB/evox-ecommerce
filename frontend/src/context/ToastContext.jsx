// filepath: frontend/src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
      const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

      const showToast = useCallback((message, type = 'success', duration = 3000) => {
            setToast({ show: true, message, type });
            setTimeout(() => {
                  setToast((prev) => ({ ...prev, show: false }));
            }, duration);
      }, []);

      return (
            <ToastContext.Provider value={{ showToast }}>
                  {children}
                  <AnimatePresence>
                        {toast.show && (
                              <motion.div
                                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                    className="fixed top-20 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-[9999] pointer-events-none"
                              >
                                    <div className={`px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 border text-sm font-bold backdrop-blur-md pointer-events-auto ${ toast.type === 'error' ? 'bg-red-500 text-white border-red-600' :
                                                toast.type === 'info' ? 'bg-blue-600 text-white border-blue-700' :
                                                      'bg-dark text-white border-gray-700'
                                          }`}>
                                          {toast.type === 'error' ? <FaExclamationCircle className="text-lg" /> :
                                                toast.type === 'info' ? <FaInfoCircle className="text-lg" /> :
                                                      <FaCheckCircle className="text-primary text-lg" />}
                                          <span>{toast.message}</span>
                                    </div>
                              </motion.div>
                        )}
                  </AnimatePresence>
            </ToastContext.Provider>
      );
};

export const useToast = () => useContext(ToastContext);