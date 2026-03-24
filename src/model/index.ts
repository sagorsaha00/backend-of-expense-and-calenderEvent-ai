import { ChatGroq } from "@langchain/groq"


export const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY?.trim(),
    model: "openai/gpt-oss-120b",
    temperature: 0,
})
