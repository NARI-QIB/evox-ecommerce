// filepath: frontend/src/components/Chatbot.jsx
import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaRobot, FaTimes, FaPaperPlane, FaDumbbell, FaRunning, FaBolt, FaUser } from 'react-icons/fa';
import Button from './ui/Button';

const Chatbot = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ sender: 'bot', text: t('chatbot.greeting') }]);
    }
  }, [t, messages.length]);

  const quickPrompts = [
    { icon: <FaDumbbell />, text: t('chatbot.prompt_1') },
    { icon: <FaRunning />, text: t('chatbot.prompt_2') },
    { icon: <FaBolt />, text: t('chatbot.prompt_3') }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const chatMutation = useMutation({
    mutationFn: async (messageText) => {
      const { data } = await axios.post('/api/chat', { message: messageText });
      return data;
    },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { sender: 'bot', text: t('chatbot.error_msg') }]);
    }
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatMutation.isPending, isOpen]);

  const formatText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');

    return (
      <div className="flex flex-col gap-1.5">
        {lines.map((line, lineIndex) => {
          if (!line.trim()) return <br key={`br-${ lineIndex }`} />;

          const linkRegex = /\[([^\]]+)\]\s*\(([^)]+)\)/g;
          const parts = [];
          let lastIndex = 0;
          let match;

          while ((match = linkRegex.exec(line)) !== null) {
            if (match.index > lastIndex) {
              parts.push(line.substring(lastIndex, match.index));
            }

            const linkText = match[1].trim();
            let productUrl = match[2].trim();

            if (/^javascript:/i.test(productUrl) || /^data:/i.test(productUrl) || /^vbscript:/i.test(productUrl)) {
              productUrl = '#';
            }
            if (!productUrl.startsWith('/') && !productUrl.startsWith('http')) {
              productUrl = '/';
            }

            parts.push(
              <Link
                key={`link-${ lineIndex }-${ match.index }`}
                to={productUrl}
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 bg-dark text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary transition-colors my-1 w-fit shadow-sm"
              >
                {linkText}
              </Link>
            );

            lastIndex = linkRegex.lastIndex;
          }

          if (lastIndex < line.length) {
            parts.push(line.substring(lastIndex));
          }

          const renderBold = (str, partIndex) => {
            const boldParts = str.split(/\*\*(.*?)\*\*/g);
            return boldParts.map((bPart, i) => {
              if (i % 2 === 1) {
                return <strong key={`bold-${ lineIndex }-${ partIndex }-${ i }`} className="text-dark font-black">{bPart}</strong>;
              }
              return bPart;
            });
          };

          const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ');

          return (
            <div key={`line-${ lineIndex }`} className={`leading-relaxed text-sm ${ isListItem ? 'flex items-start gap-2 ms-2' : '' }`}>
              {isListItem && <span className="text-primary mt-0.5">•</span>}
              <div className="flex-1 flex flex-wrap items-center gap-x-1">
                {parts.map((part, index) => (
                  <span key={`part-${ lineIndex }-${ index }`}>
                    {typeof part === 'string' ? renderBold(part.replace(/^[-*]\s/, ''), index) : part}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const sendMessage = (messageText) => {
    if (!messageText.trim() || chatMutation.isPending) return;

    setMessages((prev) => [...prev, { sender: 'user', text: messageText }]);
    setInput('');
    chatMutation.mutate(messageText);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* 🌟 تم الإصلاح: إضافة bottom-28 لشاشات الجوال لرفعه فوق الشريط اللاصق */}
      <div className="fixed bottom-28 md:bottom-6 end-4 md:end-6 z-[100] flex flex-col items-end pointer-events-none transition-all duration-300">

        <div
          className={`mb-4 w-[90vw] sm:w-[380px] h-[500px] max-h-[75vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-500 origin-bottom-right rtl:origin-bottom-left border border-gray-100 ${ isOpen ? 'scale-100 opacity-100 pointer-events-auto translate-y-0' : 'scale-75 opacity-0 pointer-events-none translate-y-10'
            }`}
        >
          <div className="bg-dark p-5 flex items-center justify-between text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 end-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-xl border border-white/20">
                  <FaRobot className="text-primary" />
                </div>
                <div className="absolute bottom-0 end-0 w-3 h-3 bg-green-500 border-2 border-dark rounded-full"></div>
              </div>
              <div className="text-start">
                <h3 className="font-extrabold tracking-wide text-lg leading-none">{t('chatbot.title')}</h3>
                <p className="text-gray-400 text-xs font-medium mt-1">{t('chatbot.status')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/20 rounded-full transition-colors focus:outline-none relative z-10 cursor-pointer"
            >
              <FaTimes />
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto bg-gray-50/50 scroll-smooth space-y-4 relative">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${ msg.sender === 'user' ? 'justify-end' : 'justify-start' }`}>
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 me-2 mt-auto">
                    <FaRobot className="text-sm" />
                  </div>
                )}

                <div
                  className={`max-w-[75%] p-3.5 rounded-2xl text-sm text-start shadow-sm ${ msg.sender === 'user'
                    ? 'bg-primary text-white rounded-be-sm'
                    : 'bg-white border border-gray-100 text-gray-700 rounded-bs-sm'
                    }`}
                >
                  {msg.sender === 'bot' ? formatText(msg.text) : msg.text}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0 ms-2 mt-auto">
                    <FaUser className="text-sm" />
                  </div>
                )}
              </div>
            ))}

            {messages.length === 1 && (
              <div className="flex flex-col gap-2 mt-4 items-start ms-10">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    onClick={() => sendMessage(prompt.text)}
                    variant="outline"
                    size="sm"
                    className="rounded-full !border-primary/20 hover:!bg-primary hover:!text-white text-primary"
                    leftIcon={prompt.icon}
                  >
                    {prompt.text}
                  </Button>
                ))}
              </div>
            )}

            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 me-2 mt-auto">
                  <FaRobot className="text-sm" />
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bs-sm shadow-sm flex items-center gap-1.5 w-16">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>

          <div className="p-4 bg-white border-t border-gray-100 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chatbot.placeholder')}
                disabled={chatMutation.isPending}
                className="flex-1 bg-gray-50 border border-gray-200 text-dark text-sm rounded-full ps-5 pe-12 py-3.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 text-start"
              />
              <button
                type="submit"
                disabled={!input.trim() || chatMutation.isPending}
                className="absolute end-1.5 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus:outline-none cursor-pointer"
              >
                <FaPaperPlane className="text-sm rtl:-scale-x-100 ms-0.5" />
              </button>
            </form>
          </div>
        </div>

        <div className="relative group pointer-events-auto">
          {!isOpen && (
            <div className="absolute end-full me-4 top-1/2 -translate-y-1/2 bg-dark text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:-end-1 before:border-4 before:border-transparent before:border-l-dark rtl:before:border-l-transparent rtl:before:border-r-dark">
              {t('chatbot.tooltip')}
            </div>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl shadow-2xl transition-all duration-500 hover:scale-110 focus:outline-none overflow-hidden cursor-pointer ${ isOpen
              ? 'bg-white text-gray-500 border-2 border-gray-100 hover:text-dark hover:border-gray-300 hover:rotate-90'
              : 'bg-primary text-white hover:bg-dark hover:shadow-primary/50'
              }`}
          >
            {isOpen ? <FaTimes /> : (
              <div className="relative">
                <FaRobot />
                <span className="absolute top-0 end-0 flex h-3 w-3 -mt-1 -me-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white border-2 border-primary"></span>
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Chatbot;