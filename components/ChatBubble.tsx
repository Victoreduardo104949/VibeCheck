import React from 'react';
import { Message } from '../types';
import { CheckCheck, FileText, Play, Music } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  isMe: boolean;
  showTail: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isMe, showTail }) => {
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (message.isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-[#fff5c4] text-gray-600 text-xs px-3 py-1 rounded-lg shadow-sm text-center max-w-[80%] uppercase font-medium tracking-wide">
          {message.content}
        </div>
      </div>
    );
  }

  const renderAttachment = () => {
      if (!message.attachment) return null;
      const { type, url, fileName } = message.attachment;

      if (type === 'image') {
          return (
              <div className="mb-1 rounded-lg overflow-hidden relative">
                  <img src={url} alt={fileName} className="w-full h-auto max-w-[330px] object-cover" loading="lazy" />
              </div>
          );
      }

      if (type === 'video') {
          return (
              <div className="mb-1 rounded-lg overflow-hidden relative max-w-[330px]">
                  <video src={url} controls className="w-full h-auto" />
              </div>
          );
      }

      if (type === 'audio') {
          return (
            <div className="flex items-center gap-3 w-[280px] mb-2 p-1">
                <div className="relative">
                     <div className="w-10 h-10 rounded-full bg-[#fca5a5] flex items-center justify-center text-white">
                         <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                           <Music className="w-5 h-5"/>
                         </div>
                     </div>
                </div>
                <audio src={url} controls className="h-8 w-full max-w-[200px]" />
            </div>
          );
      }

      // Document fallback
      return (
          <div className="flex items-center gap-3 bg-black/5 p-3 rounded-lg mb-1 w-[280px] cursor-pointer hover:bg-black/10 transition">
               <FileText className="w-8 h-8 text-red-500" />
               <div className="overflow-hidden">
                   <p className="text-sm font-medium truncate">{fileName}</p>
                   <p className="text-xs text-gray-500 uppercase">{fileName.split('.').pop()}</p>
               </div>
          </div>
      );
  };

  return (
    <div className={`flex w-full mb-1 ${isMe ? 'justify-end' : 'justify-start'} group`}>
      <div 
        className={`
          relative max-w-[85%] md:max-w-[65%] rounded-lg text-[14.2px] leading-[19px] shadow-sm flex flex-col
          ${isMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}
          ${message.attachment ? 'p-1' : 'px-2 py-1.5'}
        `}
        style={{
             borderTopRightRadius: isMe && showTail ? '0' : '0.5rem',
             borderTopLeftRadius: !isMe && showTail ? '0' : '0.5rem'
        }}
      >
        {/* Tail SVG */}
        {showTail && isMe && (
          <svg viewBox="0 0 8 13" className="absolute -right-[8px] top-0 w-[8px] h-[13px] fill-[#d9fdd3]">
            <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path>
          </svg>
        )}
        {showTail && !isMe && (
           <svg viewBox="0 0 8 13" className="absolute -left-[8px] top-0 w-[8px] h-[13px] fill-white scale-x-[-1]">
            <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path>
           </svg>
        )}

        {/* Author Name in Groups */}
        {!isMe && (
          <div className={`text-[13px] font-medium text-orange-500 mb-0.5 leading-4 cursor-pointer hover:underline ${message.attachment ? 'px-1 pt-1' : ''}`}>
            {message.author}
          </div>
        )}

        {/* Attachment Content */}
        {renderAttachment()}

        {/* Message Content (Caption or Text) */}
        {message.content && (
            <div className={`text-[#111b21] whitespace-pre-wrap break-words min-w-[80px] ${message.attachment ? 'px-2 pb-1' : ''}`}>
                {message.content}
            </div>
        )}

        {/* Metadata (Time + Check) */}
        <div className={`flex justify-end items-center space-x-1 select-none ${message.attachment && !message.content ? 'absolute bottom-2 right-2 bg-gradient-to-t from-black/40 via-transparent to-transparent text-white rounded px-1' : 'ml-auto float-right relative top-1'}`}>
          <span className={`text-[11px] font-normal ${message.attachment && !message.content ? 'text-white drop-shadow-md' : 'text-[#667781]'}`}>
            {formatTime(message.date)}
          </span>
          {isMe && (
            <CheckCheck className={`w-4 h-4 ${message.attachment && !message.content ? 'text-white drop-shadow-md' : 'text-[#53bdeb]'}`} />
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatBubble);