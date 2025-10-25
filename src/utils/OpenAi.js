export const sendMsgToAI = async (msg) => {
  const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Use your Gemini API key from Google AI Studio or Google Cloud
      Authorization: `Bearer ${process.env.REACT_APP_GEMINI_KEY}`,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: msg }],
        },
      ],
    }),
  };

  try {
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();

    // Gemini responses are nested under candidates
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Error connecting to Gemini API.";
  }
};
