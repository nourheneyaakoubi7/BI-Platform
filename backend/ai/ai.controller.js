const FileUpload = require('../fileupload/fileupload.model');
const Chart = require('../charts/charts.model');
const Conversation = require('./ai.model');
const axios = require('axios'); // Import axios for making HTTP requests

const OLLAMA_API_BASE_URL = 'http://localhost:11434'; // Default Ollama API URL
const OLLAMA_MODEL = 'tinyllama'; // Using the smallest model

const saveConversationToDB = async (userId, messages) => {
    try {
        let conversation = await Conversation.findOne({ userId });
        if (!conversation) {
            conversation = new Conversation({ userId, messages });
        } else {
            conversation.messages.push(...messages);
            conversation.lastUpdated = Date.now();
        }
        await conversation.save();
    } catch (error) {
        console.error('Error saving conversation:', error);
    }
};

const handleError = (res, err, method) => {
    console.error(`Error in ${method}:`, err);
    return res.status(500).json({ success: false, message: `Failed to process request in ${method}`, error: err.message });
};

exports.getConversationList = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await Conversation.find({ userId })
            .sort({ createdAt: -1 })
            .select({ _id: 1, messages: 1, createdAt: 1 });
        res.json({ success: true, conversations });
    } catch (err) {
        handleError(res, err, 'getConversationList');
    }
};

exports.saveConversation = async (req, res) => {
    try {
        const { messages } = req.body;
        const userId = req.user.id;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid messages provided' });
        }
        await saveConversationToDB(userId, messages);
        res.json({ success: true, message: 'Conversation saved successfully' });
    } catch (err) {
        handleError(res, err, 'saveConversation');
    }
};

exports.getConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.query; // Or req.params, depending on how you send it
        if (!chatId) {
            return res.status(400).json({ success: false, message: 'Chat ID is required' });
        }
        const conversation = await Conversation.findOne({ _id: chatId, userId });
        if (conversation) {
            res.json({ success: true, messages: conversation.messages }); // Send only the messages
        } else {
            res.status(404).json({ success: false, message: 'Conversation not found' });
        }
    } catch (err) {
        handleError(res, err, 'getConversation');
    }
};

exports.deleteConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        const result = await Conversation.deleteOne({ _id: chatId, userId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Conversation not found or unauthorized' });
        }
        res.json({ success: true, message: 'Conversation deleted successfully' });
    } catch (err) {
        handleError(res, err, 'deleteConversation');
    }
};

exports.processQuery = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid message' });
        }

        try {
            const [files, charts] = await Promise.all([
                FileUpload.find({ userId }).lean(),
                Chart.find({ createdBy: userId }).lean()
            ]);

            const systemPrompt = `You are a BI (Business Intelligence) assistant. The user has:
- ${files.length} data files
- ${charts.length} charts/dashboards

Provide concise, professional advice about:
1. Data visualization best practices
2. Dashboard design
3. Data analysis techniques
4. BI tool recommendations`;

            const messagesToSend = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ];

            let ollamaResponse;
            try {
                console.log('Sending request to Ollama:', { model: OLLAMA_MODEL, messages: messagesToSend });

                const response = await axios.post(
                    `${OLLAMA_API_BASE_URL}/api/chat`,
                    {
                        model: OLLAMA_MODEL,
                        messages: messagesToSend,
                        stream: false,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                console.log('Received raw response from Ollama:', response.data);

                if (response.data && response.data.message && response.data.message.content) {
                    ollamaResponse = response.data.message.content;
                    console.log('Extracted response from Ollama:', ollamaResponse);
                } else {
                    console.error('Ollama API response structure is unexpected:', response.data);
                    return res.status(500).json({ success: false, message: 'Unexpected response format from AI' });
                }

            } catch (ollamaError) {
                console.error("Error calling Ollama API:", ollamaError.response ? ollamaError.response.data : ollamaError.message);
                const fallbackResponse = 'AI service is currently unavailable due to an error communicating with the AI model.';
                await saveConversationToDB(userId, [
                    { role: 'user', content: message },
                    { role: 'assistant', content: fallbackResponse }
                ]);
                return res.status(500).json({ success: false, message: "Error communicating with AI", error: ollamaError.message });
            }

            if (!ollamaResponse) {
                console.error('Ollama API returned an empty response or parsing failed');
                return res.status(500).json({ success: false, message: 'Unexpected response from AI' });
            }

            await saveConversationToDB(userId, [
                { role: 'user', content: message },
                { role: 'assistant', content: ollamaResponse },
            ]);
            res.json({ success: true, response: ollamaResponse });

        } catch (dbError) {
            console.error("Database Error:", dbError);
            return res.status(500).json({ success: false, message: "Error accessing database", error: dbError.message });
        }

    } catch (err) {
        handleError(res, err, 'processQuery');
    }
};