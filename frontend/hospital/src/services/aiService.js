export const aiService = {
  getMedicineSuggestions: async (patientData, diagnosis, currentMeds) => {
    const prompt = `You are a clinical decision support AI for Indian hospitals.

Patient Profile:
- Name: ${patientData.fullName}
- Age: ${patientData.age} years
- Gender: ${patientData.gender}
- Known Allergies: ${patientData.knownAllergies || 'None'}
- Chronic Conditions: ${patientData.chronicConditions || 'None'}
- Current Medications: ${currentMeds || 'None'}

Doctor's Diagnosis: ${diagnosis}

Suggest top 4-5 medicines commonly prescribed in India for this condition.
Respond ONLY in this JSON format with no extra text:
{
  "suggestions": [
    {
      "medicineName": "Tab. Amlodipine",
      "genericName": "Amlodipine",
      "dosage": "5mg",
      "frequency": "1-0-0",
      "duration": "30 days",
      "instructions": "After food",
      "warning": null
    }
  ],
  "alerts": [
    {
      "type": "allergy",
      "message": "Alert message"
    }
  ],
  "clinicalNote": "Brief note for doctor"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        // Cheapest model — Haiku 4.5.
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    console.log('AI Response:', JSON.stringify(data))
    if (data.error) throw new Error(data.error.message)
    const text = data.content[0].text
    console.log('AI Text:', text)
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  }
}
