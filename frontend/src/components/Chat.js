import React, { useContext } from "react";
import ReactMarkdown from 'react-markdown';
import { ContextApp } from "../utils/Context";

// Removed Skeleton imports

// --- FIX: Restored the actual JSX for IntroMessage ---
const IntroMessage = () => (
  <div className="flex flex-col items-center justify-center h-full w-full animate-fadeIn text-center">
    <img
      src="/icon.png" //
      alt="bot"
      className="w-16 h-16 rounded-full object-cover"
    />
    <h2 className="text-2xl font-semibold text-white mt-4">AgroAssist</h2>
    <p className="text-gray-300 mt-2 px-4 max-w-md">
      Hi, I'm AgroAssist, an AI model designed to give farmers simple advice on soil, pests, and weather to improve their crops.
    </p>
  </div>
);
// --- END FIX ---

function Chat() {
  const { message, msgEnd } = useContext(ContextApp); // Removed 'loading'

  return (
    <div className=" w-full h-[85%] flex items-center justify-center overflow-hidden overflow-y-auto px-2 py-1 scroll">
      <div className="w-full lg:w-4/5 flex flex-col h-full items-start justify-start">

        {message.length === 0 ? (
          <IntroMessage />
        ) : (
          <>
            {message.map((msg, i) => (
              <span
                key={i}
                className={
                  msg.isBot
                    ? "flex items-start justify-start gap-2 lg:gap-5 my-2 bg-gray-800/80 p-3 rounded-md w-full"
                    : "flex items-start justify-start gap-2 lg:gap-5 my-2 p-3 w-full"
                }
              >
                <img
                  src={msg.isBot ? "/icon.png" : "/user.jpeg"} //
                  alt={msg.isBot ? "bot" : "user"}
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                />
                {/* Message Content Container */}
                <div className="flex flex-col w-full">
                    {/* Display Image if it exists */}
                    {msg.image && (
                        <img
                            src={msg.image}
                            alt="User upload"
                            className="max-w-xs md:max-w-sm rounded mb-2 border border-gray-600"
                        />
                    )}
                    {/* Display Text Content */}
                    {msg.isBot ? (
                      <div className="text-white text-[15px] prose prose-invert max-w-none
                                      prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                        {msg.text?.length === 0 && i === message.length - 1 && <span className="blinking-cursor">|</span>}
                      </div>
                    ) : (
                      msg.text && <p className="text-white text-[15px]">{msg.text}</p>
                    )}
                </div>
              </span>
            ))}
            {/* Removed Skeleton Loader Block */}
          </>
        )}

        <div ref={msgEnd} />
      </div>
    </div>
  );
}

export default Chat;