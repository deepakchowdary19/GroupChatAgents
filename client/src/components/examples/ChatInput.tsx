import { ChatInput } from '../ChatInput';

export default function ChatInputExample() {
  return (
    <div className="w-full max-w-xl">
      <ChatInput 
        onSend={(message) => console.log('Message sent:', message)} 
        placeholder="Type a message..."
      />
    </div>
  );
}
