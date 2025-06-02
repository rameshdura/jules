document.addEventListener('DOMContentLoaded', () => {
    const questionTextElement = document.getElementById('question-text');
    const yesBtn = document.getElementById('yes-btn');
    const noBtn = document.getElementById('no-btn');
    const scoreElement = document.getElementById('score');
    const resultAreaElement = document.getElementById('result-area');
    const finalScoreElement = document.getElementById('final-score');
    const resultMessageElement = document.getElementById('result-message');
    const questionArea = document.getElementById('question-area');
    const answerButtons = document.getElementById('answer-buttons');
    const scoreArea = document.getElementById('score-area');


    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];

    // Function to fetch questions from questions.json
    async function fetchQuestions() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            questions = await response.json();
            if (questions.length > 0) {
                displayQuestion();
            } else {
                showError("No questions found or questions.json is empty.");
            }
        } catch (error) {
            showError(`Error fetching questions: ${error.message}. Please ensure 'questions.json' exists and is valid.`);
            console.error("Error fetching questions:", error);
        }
    }

    function showError(message) {
        questionTextElement.textContent = message;
        yesBtn.style.display = 'none';
        noBtn.style.display = 'none';
        scoreArea.style.display = 'none';
    }

    // Function to display the current question
    function displayQuestion() {
        if (currentQuestionIndex < questions.length) {
            questionTextElement.textContent = questions[currentQuestionIndex].question;
            yesBtn.style.display = 'inline-block';
            noBtn.style.display = 'inline-block';
            resultAreaElement.style.display = 'none'; // Hide result area when showing new question
        } else {
            showResults();
        }
    }

    // Function to handle the user's answer
    function handleAnswer(userAnswer) {
        if (currentQuestionIndex >= questions.length) return; // Quiz already finished

        const correctAnswer = questions[currentQuestionIndex].answer;
        if (userAnswer === correctAnswer) {
            score++;
            scoreElement.textContent = score;
        }
        currentQuestionIndex++;
        displayQuestion();
    }

    // Function to show the final results
    function showResults() {
        questionArea.style.display = 'none';
        answerButtons.style.display = 'none';
        // scoreArea.style.display = 'none'; // Keep score visible for context or hide if preferred

        finalScoreElement.textContent = score;
        resultAreaElement.style.display = 'block';

        let message = "";
        const percentage = (score / questions.length) * 100;

        if (questions.length === 0) { // Should be caught by fetchQuestions, but as a fallback
            resultMessageElement.textContent = "No questions were loaded to calculate a result.";
            return;
        }

        if (percentage >= 75) {
            message = "Excellent work! You know your stuff!";
        } else if (percentage >= 50) {
            message = "Good job! A solid performance.";
        } else {
            message = "Keep practicing! You'll get there.";
        }
        resultMessageElement.textContent = message;
    }

    // Event listeners for answer buttons
    yesBtn.addEventListener('click', () => handleAnswer(true));
    noBtn.addEventListener('click', () => handleAnswer(false));

    // Fetch questions when the script loads
    fetchQuestions();
});
