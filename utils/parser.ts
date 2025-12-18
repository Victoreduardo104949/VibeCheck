
import { Message, ChatData, Attachment } from '../types.ts';

const getFileType = (fileName: string): 'image' | 'video' | 'audio' | 'document' => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) return 'video';
  if (['mp3', 'wav', 'ogg', 'opus', 'm4a'].includes(ext || '')) return 'audio';
  return 'document';
};

export const parseWhatsAppChat = (text: string, attachmentMap: Record<string, string> = {}): ChatData => {
  const lines = text.split('\n');
  const messages: Message[] = [];
  const participants = new Set<string>();
  
  // Regex patterns
  // iOS: [14/08/2023 15:30:00] Name: Message
  const iosRegex = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4},? \d{1,2}:\d{2}:?\d{0,2})\] (.*?): (.*)/;
  
  // Android: 14/08/2023 15:30 - Name: Message
  const androidRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4},? \d{1,2}:\d{2}) - (.*?): (.*)/;
  
  // System messages
  const systemRegexIOS = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4},? \d{1,2}:\d{2}:?\d{0,2})\] (.*)/;
  const systemRegexAndroid = /^(\d{1,2}\/\d{1,2}\/\d{2,4},? \d{1,2}:\d{2}) - (.*)/;

  // Attachment patterns
  // Android: "IMG-2023.jpg (file attached)" or "(arquivo anexado)"
  // iOS: "<attached: IMG-2023.jpg>"
  const attachmentRegexAndroid = /(.+?) \((file attached|arquivo anexado)\)/;
  const attachmentRegexIOS = /<attached: (.+)>/;

  let currentMessage: Message | null = null;

  lines.forEach((line, index) => {
    // Clean invisible chars
    line = line.replace(/[\u200e\u200f]/g, "").trim();
    if (!line) return;

    let match = line.match(iosRegex) || line.match(androidRegex);

    if (match) {
      // It's a new message line
      const dateTimeStr = match[1];
      const author = match[2];
      let content = match[3];

      participants.add(author);

      // Check for attachment in content
      let attachment: Attachment | undefined = undefined;
      
      // Try to match specific attachment text patterns
      const attachMatch = content.match(attachmentRegexAndroid) || content.match(attachmentRegexIOS);
      
      if (attachMatch) {
          // Extract filename (group 1 for both regexes usually works due to structure, 
          // but specifically: Android group 1 is filename, iOS group 1 is filename)
          let fileName = attachMatch[1].trim();
          
          // Check if this file exists in our map
          if (attachmentMap[fileName]) {
              attachment = {
                  type: getFileType(fileName),
                  url: attachmentMap[fileName],
                  fileName: fileName
              };
              // Remove the attachment text marker from content to make it cleaner, 
              // or keep it if it's mixed with text? Usually it's just the marker.
              // Let's keep it clean if it's just the marker.
              if (content.trim() === attachMatch[0].trim()) {
                  content = ""; // Only attachment
              }
          }
      }

      currentMessage = {
        id: `msg-${index}`,
        date: parseDate(dateTimeStr),
        author: author,
        content: content,
        isSystem: false,
        attachment
      };
      messages.push(currentMessage);
    } else {
      // Check for system message OR continuation of previous message
      const sysMatch = line.match(systemRegexIOS) || line.match(systemRegexAndroid);
      
      if (sysMatch) {
        const dateTimeStr = sysMatch[1];
        const content = sysMatch[2];
        
        currentMessage = {
          id: `sys-${index}`,
          date: parseDate(dateTimeStr),
          author: 'System',
          content: content,
          isSystem: true
        };
        messages.push(currentMessage);
      } else if (currentMessage) {
        // Multi-line message continuation
        currentMessage.content += `\n${line}`;
      }
    }
  });

  return {
    participants: Array.from(participants),
    messages,
    title: participants.size > 0 ? Array.from(participants).join(', ').slice(0, 30) + (participants.size > 2 ? '...' : '') : 'Conversa Desconhecida'
  };
};

const parseDate = (dateStr: string): Date => {
  try {
    const parts = dateStr.split(/[\s,]+/);
    const datePart = parts[0];
    const timePart = parts[1];
    
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    
    const fullYear = year < 100 ? 2000 + year : year;
    
    return new Date(fullYear, month - 1, day, hour, minute, second || 0);
  } catch (e) {
    return new Date(); // Fallback
  }
};
