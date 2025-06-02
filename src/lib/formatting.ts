/**
 * Formatting utilities for AI responses and chat messages
 */

export interface FormattedMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  formatted?: boolean;
  sections?: MessageSection[];
}

export interface MessageSection {
  type: 'text' | 'code' | 'list' | 'heading' | 'quote' | 'table';
  content: string;
  language?: string; // For code blocks
  items?: string[]; // For lists
  level?: number; // For headings (1-6)
}

/**
 * Formats AI response content for better readability
 */
export function formatAIResponse(content: string): MessageSection[] {
  const sections: MessageSection[] = [];
  const lines = content.split('\n');
  let currentSection: MessageSection | null = null;
  let codeBlockLanguage = '';
  let isInCodeBlock = false;
  let codeBlockContent = '';
  let listItems: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Handle code blocks
    if (trimmedLine.startsWith('```')) {
      if (isInCodeBlock) {
        // End of code block
        sections.push({
          type: 'code',
          content: codeBlockContent.trim(),
          language: codeBlockLanguage || 'text'
        });
        isInCodeBlock = false;
        codeBlockContent = '';
        codeBlockLanguage = '';
      } else {
        // Start of code block
        codeBlockLanguage = trimmedLine.slice(3).toLowerCase();
        isInCodeBlock = true;
        codeBlockContent = '';
        
        // Save any pending list
        if (listItems.length > 0) {
          sections.push({
            type: 'list',
            content: '',
            items: [...listItems]
          });
          listItems = [];
        }
      }
      continue;
    }

    if (isInCodeBlock) {
      codeBlockContent += line + '\n';
      continue;
    }

    // Handle headings
    if (trimmedLine.startsWith('#')) {
      const level = trimmedLine.match(/^#+/)?.[0].length || 1;
      const headingText = trimmedLine.replace(/^#+\s*/, '');
      
      // Save any pending list
      if (listItems.length > 0) {
        sections.push({
          type: 'list',
          content: '',
          items: [...listItems]
        });
        listItems = [];
      }

      sections.push({
        type: 'heading',
        content: headingText,
        level: Math.min(level, 6)
      });
      continue;
    }

    // Handle list items
    if (trimmedLine.match(/^[-*+•]\s/) || trimmedLine.match(/^\d+\.\s/)) {
      const listItemText = trimmedLine.replace(/^[-*+•]\s/, '').replace(/^\d+\.\s/, '');
      listItems.push(listItemText);
      continue;
    }

    // Handle quotes
    if (trimmedLine.startsWith('>')) {
      const quoteText = trimmedLine.replace(/^>\s*/, '');
      
      // Save any pending list
      if (listItems.length > 0) {
        sections.push({
          type: 'list',
          content: '',
          items: [...listItems]
        });
        listItems = [];
      }

      sections.push({
        type: 'quote',
        content: quoteText
      });
      continue;
    }

    // Handle inline code
    if (trimmedLine.includes('`') && !trimmedLine.startsWith('```')) {
      // Save any pending list
      if (listItems.length > 0) {
        sections.push({
          type: 'list',
          content: '',
          items: [...listItems]
        });
        listItems = [];
      }

      sections.push({
        type: 'text',
        content: line
      });
      continue;
    }

    // Handle regular text
    if (trimmedLine !== '') {
      // Save any pending list first
      if (listItems.length > 0) {
        sections.push({
          type: 'list',
          content: '',
          items: [...listItems]
        });
        listItems = [];
      }

      sections.push({
        type: 'text',
        content: line
      });
    }
  }

  // Handle any remaining list items
  if (listItems.length > 0) {
    sections.push({
      type: 'list',
      content: '',
      items: listItems
    });
  }

  // Handle any unclosed code block
  if (isInCodeBlock && codeBlockContent.trim()) {
    sections.push({
      type: 'code',
      content: codeBlockContent.trim(),
      language: codeBlockLanguage || 'text'
    });
  }

  return sections;
}

/**
 * Formats a complete message with metadata
 */
export function formatMessage(
  id: string,
  content: string,
  role: 'user' | 'assistant' | 'system',
  timestamp: Date = new Date()
): FormattedMessage {
  const sections = role === 'assistant' ? formatAIResponse(content) : [{ type: 'text' as const, content }];
  
  return {
    id,
    content,
    role,
    timestamp,
    formatted: true,
    sections
  };
}

/**
 * Applies syntax highlighting classes for code blocks
 */
export function getCodeLanguageClass(language: string): string {
  const languageMap: Record<string, string> = {
    'javascript': 'language-javascript',
    'js': 'language-javascript',
    'typescript': 'language-typescript',
    'ts': 'language-typescript',
    'python': 'language-python',
    'py': 'language-python',
    'java': 'language-java',
    'c': 'language-c',
    'cpp': 'language-cpp',
    'csharp': 'language-csharp',
    'php': 'language-php',
    'ruby': 'language-ruby',
    'go': 'language-go',
    'rust': 'language-rust',
    'sql': 'language-sql',
    'html': 'language-html',
    'css': 'language-css',
    'scss': 'language-scss',
    'sass': 'language-sass',
    'json': 'language-json',
    'xml': 'language-xml',
    'yaml': 'language-yaml',
    'yml': 'language-yaml',
    'markdown': 'language-markdown',
    'md': 'language-markdown',
    'bash': 'language-bash',
    'sh': 'language-bash',
    'shell': 'language-bash',
    'powershell': 'language-powershell',
    'dockerfile': 'language-dockerfile',
    'text': 'language-text',
    'plain': 'language-text'
  };

  return languageMap[language.toLowerCase()] || 'language-text';
}

/**
 * Estimates reading time for a message
 */
export function estimateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  if (minutes < 1) return '< 1 min read';
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}

/**
 * Truncates content for previews
 */
export function truncateContent(content: string, maxLength: number = 150): string {
  if (content.length <= maxLength) return content;
  
  const truncated = content.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Sanitizes content for safe HTML rendering
 */
export function sanitizeContent(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Converts inline code and links to HTML
 */
export function processInlineElements(content: string): string {
  let processed = sanitizeContent(content);
  
  // Process inline code
  processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // Process links
  processed = processed.replace(
    /https?:\/\/[^\s<>"]+/g,
    '<a href="$&" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$&</a>'
  );
  
  // Process bold text
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Process italic text
  processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  return processed;
}

/**
 * Generates a unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formats timestamp for display
 */
export function formatTimestamp(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return timestamp.toLocaleDateString();
}

/**
 * Checks if content contains code blocks
 */
export function hasCodeBlocks(content: string): boolean {
  return content.includes('```');
}

/**
 * Extracts code blocks from content
 */
export function extractCodeBlocks(content: string): Array<{ language: string; code: string }> {
  const codeBlocks: Array<{ language: string; code: string }> = [];
  const regex = /```(\w+)?\n?([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    });
  }

  return codeBlocks;
}