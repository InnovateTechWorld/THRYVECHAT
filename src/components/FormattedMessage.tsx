import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  FormattedMessage as FormattedMessageType, 
  MessageSection, 
  getCodeLanguageClass, 
  processInlineElements,
  formatTimestamp 
} from '@/lib/formatting';

interface FormattedMessageProps {
  message: FormattedMessageType;
  showTimestamp?: boolean;
  showRole?: boolean;
  className?: string;
}

interface CodeBlockProps {
  section: MessageSection;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ section }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(section.content);
      setCopied(true);
      toast({
        title: "Code copied",
        description: "Code block copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy code to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg border border-border">
        <Badge variant="outline" className="text-xs">
          {section.language || 'text'}
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <pre className={`bg-muted/50 p-4 rounded-b-lg border border-t-0 border-border overflow-x-auto text-sm ${getCodeLanguageClass(section.language || 'text')}`}>
        <code>{section.content}</code>
      </pre>
    </div>
  );
};

interface ListProps {
  section: MessageSection;
}

const List: React.FC<ListProps> = ({ section }) => {
  return (
    <ul className="my-3 ml-6 list-disc space-y-1">
      {section.items?.map((item, index) => (
        <li key={index} className="text-sm" dangerouslySetInnerHTML={{ __html: processInlineElements(item) }} />
      ))}
    </ul>
  );
};

interface HeadingProps {
  section: MessageSection;
}

const Heading: React.FC<HeadingProps> = ({ section }) => {
  const level = section.level || 1;
  const className = {
    1: 'text-2xl font-bold mt-6 mb-4',
    2: 'text-xl font-semibold mt-5 mb-3',
    3: 'text-lg font-semibold mt-4 mb-2',
    4: 'text-md font-medium mt-3 mb-2',
    5: 'text-sm font-medium mt-2 mb-1',
    6: 'text-xs font-medium mt-2 mb-1'
  }[level] || 'text-lg font-semibold mt-4 mb-2';

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag className={className} dangerouslySetInnerHTML={{ __html: processInlineElements(section.content) }} />
  );
};

interface QuoteProps {
  section: MessageSection;
}

const Quote: React.FC<QuoteProps> = ({ section }) => {
  return (
    <blockquote className="border-l-4 border-primary/30 bg-muted/30 pl-4 py-2 my-3 italic">
      <span dangerouslySetInnerHTML={{ __html: processInlineElements(section.content) }} />
    </blockquote>
  );
};

interface TextProps {
  section: MessageSection;
}

const Text: React.FC<TextProps> = ({ section }) => {
  return (
    <p className="my-2 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: processInlineElements(section.content) }} />
  );
};

export const FormattedMessage: React.FC<FormattedMessageProps> = ({
  message,
  showTimestamp = false,
  showRole = false,
  className = ''
}) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`message-container ${className}`}>
      {/* Message Header */}
      {(showRole || showTimestamp) && (
        <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
          {showRole && (
            <Badge variant={isUser ? "default" : isSystem ? "secondary" : "outline"} className="text-xs">
              {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Assistant' : 'System'}
            </Badge>
          )}
          {showTimestamp && (
            <span>{formatTimestamp(message.timestamp)}</span>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={`message-content ${isUser ? 'user-message' : 'assistant-message'}`}>
        {message.sections ? (
          // Render formatted sections
          <div className="formatted-content">
            {message.sections.map((section, index) => {
              switch (section.type) {
                case 'code':
                  return <CodeBlock key={index} section={section} />;
                case 'list':
                  return <List key={index} section={section} />;
                case 'heading':
                  return <Heading key={index} section={section} />;
                case 'quote':
                  return <Quote key={index} section={section} />;
                case 'text':
                default:
                  return <Text key={index} section={section} />;
              }
            })}
          </div>
        ) : (
          // Fallback to plain text
          <div className="plain-content">
            <Text section={{ type: 'text', content: message.content }} />
          </div>
        )}
      </div>
    </div>
  );
};

// CSS classes for styling (to be added to your global CSS)
export const messageStyles = `
.message-container {
  margin-bottom: 1rem;
}

.user-message {
  background-color: hsl(var(--primary) / 0.1);
  border: 1px solid hsl(var(--primary) / 0.2);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-left: 2rem;
}

.assistant-message {
  background-color: hsl(var(--muted) / 0.3);
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
  padding: 1rem;
  margin-right: 2rem;
}

.formatted-content .inline-code {
  background-color: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 0.25rem;
  padding: 0.125rem 0.25rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.875rem;
}

.formatted-content a {
  color: hsl(var(--primary));
  text-decoration: none;
}

.formatted-content a:hover {
  text-decoration: underline;
}

.formatted-content strong {
  font-weight: 600;
}

.formatted-content em {
  font-style: italic;
}

/* Code syntax highlighting */
.language-javascript,
.language-typescript,
.language-python,
.language-java,
.language-cpp,
.language-csharp,
.language-php,
.language-ruby,
.language-go,
.language-rust {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  line-height: 1.5;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .user-message {
    margin-left: 0.5rem;
  }
  
  .assistant-message {
    margin-right: 0.5rem;
  }
}
`;

export default FormattedMessage;