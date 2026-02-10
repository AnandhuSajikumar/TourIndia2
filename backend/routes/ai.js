import { Router } from 'express'
import OpenAI from 'openai'

const router = Router()

// Initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

router.post('/', async (req, res) => {
  const { messages = [] } = req.body || {}
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const prompt = lastUser?.content || 'Hello'
  
  try {
    if (openai && process.env.OPENAI_API_KEY) {
      // Use OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful tourism assistant for Indian tourism. Answer questions about travel, culture, places to visit, and tourism in India. Be concise and informative.' },
          ...messages.slice(-10) // Last 10 messages for context
        ],
        max_tokens: 200,
        temperature: 0.7
      })
      return res.json({ reply: completion.choices[0].message.content })
    } else {
      // Fallback smart responses
      const lowerPrompt = prompt.toLowerCase()
      let reply = 'I can help you with Indian tourism information! '
      
      if (lowerPrompt.includes('waterfall') || lowerPrompt.includes('nature')) {
        reply += 'India has amazing waterfalls like Dudhsagar in Goa, Athirappilly in Kerala, and Dassam Falls in Jharkhand. Would you like to know more?'
      } else if (lowerPrompt.includes('temple') || lowerPrompt.includes('culture')) {
        reply += 'India is rich in temples and cultural sites like Taj Mahal, Meenakshi Temple, and Golden Temple. Which region interests you?'
      } else if (lowerPrompt.includes('beach')) {
        reply += 'India has beautiful beaches in Goa, Kerala, Andaman & Nicobar, and Maharashtra. Which state are you interested in?'
      } else if (lowerPrompt.includes('food') || lowerPrompt.includes('cuisine')) {
        reply += 'Each Indian state has unique cuisine! Try biryani in Hyderabad, dosa in Tamil Nadu, dhokla in Gujarat, or momos in Northeast India.'
      } else if (lowerPrompt.includes('budget') || lowerPrompt.includes('cost')) {
        reply += 'Travel budgets vary by state. Budget-friendly states: Bihar, Odisha, Madhya Pradesh. Luxury: Goa, Himachal, Kerala.'
      } else if (lowerPrompt.includes('best') || lowerPrompt.includes('recommend')) {
        reply += 'Popular destinations: Taj Mahal (UP), Backwaters (Kerala), Himalayas (Himachal/UK), Beaches (Goa), Temples (Tamil Nadu). Select a state to see specific attractions!'
      } else {
        reply += 'Ask me about specific states, attractions, travel tips, or cultural experiences across India!'
      }
      
      return res.json({ reply })
    }
  } catch (error) {
    console.error('Chatbot error:', error)
    return res.json({ reply: 'I encountered an error. Please try asking about Indian tourism destinations, culture, or travel tips!' })
  }
})

export default router


