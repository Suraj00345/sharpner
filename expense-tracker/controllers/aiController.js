const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const allowedCategories = [
  "Food",
  "Travel",
  "Shopping",
  "Entertainment",
  "Bills",
  "Healthcare",
  "Education",
  "Rent",
  "Other",
];

const categorizeExpense = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Expense description is required",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Categorize this expense: "${description}"`,
      config: {
        systemInstruction: "You are an expense categorization assistant.",
        responseMimeType: "text/x.enum",
        responseSchema: {
          type: Type.STRING,
          enum: allowedCategories,
        },
        temperature: 0,
      },
    });

    const category = response.text?.trim() || "Other";

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Gemini categorization error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to categorize expense",
      error: error.message,
    });
  }
};

module.exports = {
  categorizeExpense,
};
