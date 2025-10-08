const observer = new MutationObserver(() => {
    Array.from(document.getElementsByClassName('comments-comment-texteditor'))
        .filter(commentBox => !commentBox.hasAttribute('data-mutated'))
        .forEach(commentBox => {
            commentBox.setAttribute('data-mutated', 'true');
            addSuggestionButton(commentBox);
        })
})

observer.observe(document.body, { subtree: true, childList: true })

const getSuggestion = (text) => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                type: 'FETCH_SUGGESTION',
                body: { text }
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            }
        );
    });
};

const createPrompt = (commentBox) => {
    const post = commentBox.closest('.feed-shared-update-v2') || commentBox.closest('.reusable-search__result-container');
    const author = post.querySelector(
        ".update-components-actor__meta-link"
    )?.getAttribute('aria-label');
    const text = post.querySelector(
        ".feed-shared-inline-show-more-text"
    )?.innerText;

    let prompt = `"${author}" wrote as a LinkedIn post: "${text}". Write a super short comment for this post with a maximum of 40 words in a positive, professional manner. Provide only the reply text and nothing else.`;
    return prompt;
}

const addSuggestionButton = (commentBox) => {
    const innerObserver = new MutationObserver(() => {
        const actionsDiv = commentBox.querySelector('.display-flex.flex-wrap .display-flex.justify-space-between');
        const editor = commentBox.querySelector('.editor-container .ql-container .ql-editor');
        if (actionsDiv && editor && !actionsDiv.hasAttribute('data-has-button')) {
            actionsDiv.setAttribute('data-has-button', 'true');

            const button = document.createElement('button');
            button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-lightbulb-fill" viewBox="0 0 16 16"><path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13h-5a.5.5 0 0 1-.46-.302l-.761-1.77a2 2 0 0 0-.453-.618A5.98 5.98 0 0 1 2 6m3 8.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1-.5-.5"/></svg>';
            button.addEventListener('click', async () => {
                editor.innerHTML = '<p>Generating... ✨</p>';
                actionsDiv.removeAttribute('data-has-button');
                actionsDiv.removeChild(button);

                const generatedPrompt = createPrompt(commentBox);
                console.log('Generated Prompt:', generatedPrompt)

                const res = await getSuggestion(generatedPrompt || 'hi there!');
                console.log('Suggestion Response:', res)

                const suggestion = res.success ? res.data.choices[0].message.content : 'Error fetching suggestion';
                editor.innerHTML = `<p>${suggestion}</p>`;
            });

            actionsDiv.prepend(button);
            innerObserver.disconnect();
        }
    });

    innerObserver.observe(commentBox, { subtree: true, childList: true });
};