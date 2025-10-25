export const sendMsgToAI = async (msg) => {
  const API_KEY = process.env.REACT_APP_GEMINI_KEY;
  const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}";

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Use your Gemini API key from Google AI Studio or Google Cloud
    //    Authorization: `Bearer ${process.env.REACT_APP_GEMINI_KEY}`,
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
    const response = await fetch(API_URL, requestOptions); // Use updated URL
    if (!response.ok) {
      // Throw an error if the response is not ok (e.g., 4xx, 5xx)
      const errorData = await response.json();
      console.error("Gemini API Error Response:", errorData);
      throw new Error(`API request failed with status ${response.status}: ${errorData?.error?.message || 'Unknown error'}`);
    }
    const data = await response.json();

    // Access the response text correctly
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response text found.";
  } catch (error) {
    console.error("Gemini API call failed:", error);
    // Provide a more specific error message based on the caught error
    return `Error connecting to Gemini API: ${error.message}`;
  }
};
