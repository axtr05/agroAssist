// src/utils/Gemini.js

export const sendMsgToAI = async (chatHistory, imageInput, onChunkCallback) => {
  const API_KEY = process.env.REACT_APP_GEMINI_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${API_KEY}`;

  const systemPrompt = `
  You are "AgroAssist," an expert agricultural assistant for farmers, knowledgeable about common crops, seasons, and growing conditions, especially in India.
  Your job is to answer questions related to agriculture ONLY. If an image is provided, focus your response on analyzing the image in an agricultural context (e.g., identifying plants, diseases, pests).

  --- YOUR PRIMARY RULE ---
  1. Read the user's question and look at any provided image.
  2. Decide if the request is related to agriculture.
  3. IF NOT related to agriculture, respond ONLY with: "I am only programmed to answer queries regarding agriculture and that only alone."

  --- IF THE QUESTION IS ABOUT AGRICULTURE, FOLLOW THESE RULES ---

  1. **IMAGE ANALYSIS FIRST:** If an image is provided, prioritize analyzing it based on the text prompt. Describe what you see relevant to farming (plant type, disease symptoms, pest identification, soil appearance, etc.).
  
  2. **CHECK FEASIBILITY (If no image or image analysis doesn't answer):**
     - Before giving advice or asking for details, check if the text request is feasible (e.g., wrong season).
     - If clearly unsuitable, your response MUST politely correct them and state the correct context (e.g., season). DO NOT ask follow-up questions in this case.

  3. **ASK FOR DETAILS IF NEEDED (and Feasible):**
     - If the request is feasible, image analysis is done (or no image), but you still lack details (location, soil type/pH, etc.) for a *specific text-based* recommendation, your response MUST be ONLY the question(s) asking for that info. Use a concise numbered list if multiple questions. DO NOT add introductions or other text.

  4. **PROVIDE ANSWER:** If feasible and details sufficient, provide the answer.

  5. **LANGUAGE RULE:** Respond in the exact same language as the User's text question.
  6. **Format:** Use Markdown (paragraphs, *, 1.).
  7. **Simplicity:** Use simple language, no jargon.
  8. **Brevity:** Keep answers brief unless asking questions or providing detailed image analysis.
  `;

  // --- Map history to Gemini format ---
  const contents = chatHistory.map(msg => {
    const parts = [{ text: msg.text }];
    // If the user message had an image in history (for context), add it
    // NOTE: This assumes msg.image stored the Base64 data which might not be ideal for history.
    // A better approach for history might be to only send the *current* image, not past ones.
    // For simplicity now, we only send the *new* imageInput below, not historical ones.
    return {
      role: msg.isBot ? "model" : "user",
      parts: parts
    };
  });

  // --- Add the *current* image to the *last* user message parts if it exists ---
  if (imageInput && contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts.push({
      inline_data: imageInput.inlineData // Use the structured image data
    });
  } else if (imageInput && contents.length === 0) {
      // Handle case where image is sent with the very first message
      contents.push({
          role: 'user',
          parts: [
              { text: "" }, // Add empty text part if needed by API
              { inline_data: imageInput.inlineData }
          ]
      });
  }


  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: contents, // Send history potentially including the latest image
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      }
      // Consider adding safetySettings if needed
    }),
  };

  try {
    // Streaming Fetch Logic (remains the same)
    const response = await fetch(API_URL, requestOptions);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error Response:", errorData);
      throw new Error(`API request failed with status ${response.status}: ${errorData?.error?.message || 'Unknown error'}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aggregatedText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      aggregatedText += decoder.decode(value, { stream: true });
      let jsonParts = aggregatedText.split('\n');
      aggregatedText = jsonParts.pop();

      for (const part of jsonParts) {
        if (part.startsWith('data: ')) {
          try {
            const json = JSON.parse(part.substring(6));
            if (json?.candidates?.[0]?.content?.parts?.[0]?.text) {
              const textChunk = json.candidates[0].content.parts[0].text;
              onChunkCallback(textChunk);
            }
          } catch (e) {
             console.warn("Could not parse stream chunk:", part);
          }
        }
      }
    }
  } catch (error) {
    console.error("Gemini API call failed:", error);
    onChunkCallback(`\n\n--- Error connecting to Gemini API: ${error.message} ---`);
  }
};