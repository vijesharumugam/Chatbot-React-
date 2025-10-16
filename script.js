
const Chatbot = {
    defaultResponses: {
    'hello hi': `Hello! How can I help you?`,
    'how are you': `I'm doing great! How can I help you?`,
    'flip a coin': function () {
        return Math.random() < 0.5 ? 'Sure! You got heads' : 'Sure! You got tails';
    },
    'roll a dice': function () {
        const dice = Math.floor(Math.random() * 6) + 1;
        return `Sure! You got ${dice}`;
    },
    'what is the date today': function () {
        const now = new Date();
        const months = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
        ];
        return `Today is ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    },
    'thank': 'No problem! Let me know if you need anything else!',
    },
    additionalResponses: {},
    unsuccessfulResponse: `Sorry, I didn't quite understand that. I can flip a coin, roll a dice, or tell today’s date.`,
    emptyMessageResponse: `Your message is empty. Please type something!`,
    addResponses(additionalResponses) {
    this.additionalResponses = { ...this.additionalResponses, ...additionalResponses };
    },
    getResponse(message) {
    if (!message) return this.emptyMessageResponse;
    const responses = { ...this.defaultResponses, ...this.additionalResponses };
    const { ratings, bestMatchIndex } = this.stringSimilarity(message.toLowerCase(), Object.keys(responses));
    const bestRating = ratings[bestMatchIndex].rating;
    if (bestRating <= 0.3) return this.unsuccessfulResponse;
    const bestKey = ratings[bestMatchIndex].target;
    const response = responses[bestKey];
    return typeof response === 'function' ? response() : response;
    },
    getResponseAsync(message) {
    return new Promise((resolve) => setTimeout(() => resolve(this.getResponse(message)), 500));
    },
    compareTwoStrings(first, second) {
    first = first.replace(/\s+/g, '');
    second = second.replace(/\s+/g, '');
    if (first === second) return 1;
    if (first.length < 2 || second.length < 2) return 0;
    const firstBigrams = new Map();
    for (let i = 0; i < first.length - 1; i++) {
        const bigram = first.substring(i, i + 2);
        firstBigrams.set(bigram, (firstBigrams.get(bigram) || 0) + 1);
    }
    let intersection = 0;
    for (let i = 0; i < second.length - 1; i++) {
        const bigram = second.substring(i, i + 2);
        const count = firstBigrams.get(bigram) || 0;
        if (count > 0) {
        firstBigrams.set(bigram, count - 1);
        intersection++;
        }
    }
    return (2.0 * intersection) / (first.length + second.length - 2);
    },
    stringSimilarity(mainString, targets) {
    const ratings = [];
    let bestMatchIndex = 0;
    for (let i = 0; i < targets.length; i++) {
        const rating = this.compareTwoStrings(mainString, targets[i]);
        ratings.push({ target: targets[i], rating });
        if (rating > ratings[bestMatchIndex]?.rating || i === 0) bestMatchIndex = i;
    }
    return { ratings, bestMatchIndex };
    }
};



function ChatMessage({ sender, text }) {
    return (
    <div className={`message ${sender}`}>
        {sender === "bot" && <img src="assets/bot.webp" alt="bot" />}
        <div className="text">{text}</div>
        {sender === "user" && <img src="assets/user.webp" alt="user" />}
    </div>
    );
}

function App() {
    const [messages, setMessages] = React.useState([
    { sender: "bot", text: "Hi there! I'm your chatbot" }
    ]);
    const [input, setInput] = React.useState("");

    async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    const botReply = await Chatbot.getResponseAsync(input);
    setMessages(prev => [...prev, { sender: "bot", text: botReply }]);
    setInput("");
    }

    React.useEffect(() => {
    const messagesDiv = document.querySelector(".messages");
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, [messages]);

    return (
    <div className="messages">
        {messages.map((msg, i) => <ChatMessage key={i} {...msg} />)}
        <div className="input-container">
        <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send your message..."
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
        </div>
    </div>
    );
}

ReactDOM.createRoot(document.querySelector('.messages').parentElement).render(<App />);
