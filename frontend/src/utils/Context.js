// src/utils/Context.js
import React, { createContext, useState, useRef, useEffect, useCallback } from "react";
import { sendMsgToAI } from "./Gemini";

export const ContextApp = createContext();

// Helper function to convert file to Base64
const fileToGenerativePart = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove the data URI prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          mimeType: file.type,
          data: base64Data
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


function AppContext({ children }) {
  const [showSlide, setShowSlide] = useState(false);
  const [Mobile, setMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatValue, setChatValue] = useState("");
  const [message, setMessage] = useState([]);
  const msgEnd = useRef(null);
  // Removed language state as dropdown was removed

  // --- NEW STATE FOR IMAGE ---
  const [selectedImage, setSelectedImage] = useState(null); // Holds the File object
  const [previewImage, setPreviewImage] = useState(null); // Holds Data URL for preview
  // --- END NEW STATE ---

  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  const handleSend = useCallback(async (text) => {
    const promptText = text || chatValue;
    // Don't send if only image is selected but no text prompt
    if (promptText.trim() === "" && !selectedImage) return;

    // --- Prepare image part if selected ---
    let imagePartPromise = null;
    let imageForMessage = null; // Store preview for message state
    if (selectedImage) {
      imagePartPromise = fileToGenerativePart(selectedImage);
      imageForMessage = previewImage; // Use the data URL for display
    }
    // --- End image preparation ---

    const userMessage = {
      text: promptText,
      isBot: false,
      image: imageForMessage, // Add image to message state
    };
    const botMessageTemplate = { text: "", isBot: true };

    const currentChatValue = chatValue; // Store before clearing state
    const currentSelectedImage = selectedImage; // Store before clearing state

    // Capture the history *before* adding the new messages
    const historyForApi = [...message, userMessage];

    // Update UI immediately
    setMessage((prev) => [...prev, userMessage, botMessageTemplate]);

    // Clear state after capturing values
    if (!text) { // Clear text input if it wasn't passed directly (mic)
        setChatValue("");
    }
    setSelectedImage(null); // Clear selected image
    setPreviewImage(null); // Clear preview image


    setLoading(true);

    try {
      let imageInput = null;
      if (imagePartPromise) {
        imageInput = await imagePartPromise; // Wait for Base64 conversion
      }

      // Define the callback for stream chunks
      const onChunk = (chunk) => {
        setMessage((prevChunk) => {
          const updatedMessages = [...prevChunk];
          if (updatedMessages.length > 0) {
              const lastMsgIndex = updatedMessages.length - 1;
              if (updatedMessages[lastMsgIndex].isBot) {
                  updatedMessages[lastMsgIndex] = {
                      ...updatedMessages[lastMsgIndex],
                      text: (updatedMessages[lastMsgIndex].text || "") + chunk // Ensure text is initialized
                  };
              }
          }
          return updatedMessages;
        });
      };

      // Call API within the updater to use correct history
       await sendMsgToAI(historyForApi, imageInput, onChunk); // Pass imageInput

    } catch (error) {
       console.error("Error sending message:", error);
       setMessage((prevErr) => {
           const updatedMessages = [...prevErr];
          if (updatedMessages.length > 0) {
              const lastMsgIndex = updatedMessages.length - 1;
              if (updatedMessages[lastMsgIndex].isBot) {
                  updatedMessages[lastMsgIndex] = {
                      ...updatedMessages[lastMsgIndex],
                      text: "Sorry, an error occurred processing your request."
                  };
              }
          }
          return updatedMessages;
       });
    } finally {
      setLoading(false);
    }

  }, [chatValue, message, selectedImage, previewImage]); // Added image states to dependencies

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // handleQuery needs the same logic (without image for now, as examples don't use images)
  const handleQuery = useCallback(async (e) => {
    const text = e.target.innerText;
    if (!text) return;

    const userMessage = { text, isBot: false };
    const botMessageTemplate = { text: "", isBot: true };
    const historyForApi = [...message, userMessage]; // History for API call
    setMessage((prev) => [...prev, userMessage, botMessageTemplate]); // Update UI
    setLoading(true);

    try {
        const onChunk = (chunk) => {
         setMessage((prevChunk) => {
           const updatedMessages = [...prevChunk];
            if (updatedMessages.length > 0) {
                const lastMsgIndex = updatedMessages.length - 1;
                if (updatedMessages[lastMsgIndex].isBot) {
                    updatedMessages[lastMsgIndex] = {
                        ...updatedMessages[lastMsgIndex],
                        text: (updatedMessages[lastMsgIndex].text || "") + chunk
                    };
                }
            }
            return updatedMessages;
          });
        };
        // Call API without image for handleQuery
        await sendMsgToAI(historyForApi, null, onChunk);
    } catch (error) {
      console.error("Error sending query:", error);
       setMessage((prevErr) => {
           const updatedMessages = [...prevErr];
            if (updatedMessages.length > 0) {
                const lastMsgIndex = updatedMessages.length - 1;
                 if (updatedMessages[lastMsgIndex].isBot) {
                    updatedMessages[lastMsgIndex] = {
                        ...updatedMessages[lastMsgIndex],
                        text: "Sorry, an error occurred."
                    };
                }
            }
            return updatedMessages;
       });
    } finally {
      setLoading(false);
    }
  }, [message]); // Added message dependency

  const contextValue = {
    showSlide, setShowSlide,
    Mobile, setMobile,
    loading, setLoading,
    chatValue, setChatValue,
    message, setMessage,
    msgEnd,
    handleSend, handleKeyPress, handleQuery,
    // Add image state and setter
    selectedImage, setSelectedImage,
    previewImage, setPreviewImage
    // Removed language state/setter
  };

  return (
    <ContextApp.Provider value={contextValue}>{children}</ContextApp.Provider>
  );
}

export default AppContext;