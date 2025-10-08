chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    if (message.type === 'FETCH_SUGGESTION') {
        (async () => {
            const response = await fetch('http://localhost:8000/chat/completions', {
            method: 'POST',
            headers: {
                'authorization': 'Bearer fake-api-key',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "model": "mock-gpt",
                "messages": [
                    {
                        "role": "user",
                        "content": message.body.text
                    }
                ],
                "max_tokens": 512,
                "temperature": 0.1
            })
        })

        const data = await response.json();
        sendResponse({ success: true, data });
        })().catch(err => { console.error(err); sendResponse({ success: false, error: err.message }); });

        return true;
    }
})