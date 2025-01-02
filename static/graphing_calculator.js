const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

// Get plot button and make it plot
const plotButton = document.getElementById('plotButton');
plotButton.addEventListener('click', function() {
    makeFunction();
});

// Get clear button and make it clear
const clearButton = document.getElementById('clearButton');
clearButton.addEventListener('click', function() {
    clear();
})

// Get the detail slider
const detailSlider = document.getElementById('detailSlider');
let detail = detailSlider.value;
detailSlider.oninput = function() {
    detail = this.value;
}

// Get advanced div
const advanced = document.getElementById('advanced');

// Get the advanced checkbox
const advancedCheckbox = document.getElementById('advancedCheckbox');
advancedCheckbox.oninput = function() {
    if (this.checked) {advanced.style.display = 'block';}
    else {advanced.style.display = 'none';}
}

// Get the functions div
const functionsDiv = document.getElementById('functions');

// Colors for the graphs
const colors = ["red", "orange", "#8B8000", "green", "blue", "indigo", "violet"];
let colorIndex = 0

storedFunctions = [];

/*
Stores details for an inputted function
*/
function inputFunction(input, sanitized, color, detail) {
    this.input = input;
    this.sanitized = sanitized;
    this.color = color;
    this.detail = detail;
}

/*
Clears the canvas and redraws the axes
*/
function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGraph();
    colorIndex = 0;
    storedFunctions = [];
    listFunctions();
}

function makeFunction() {
    // Get and sanitize the input
    let input = document.getElementById('functionInput').value;
    input = validateInput(input); // Will return null if input is not valid
    if (!input) {
        return null;
    }
    let sanitized = input.replace(/\^/g, "**");
    sanitized = sanitized.replace(/(\d)(x)/g, "$1*$2"); // Add * between numbers and x (i.e. 5x --> 5*x)
    sanitized = sanitized.replace(/x\(/g, "x*(")
                 .replace(/\)x/g, ")*x"); // Add * between x and parentheses
    sanitized = sanitized.replace(/(\d)\(/, "$1*(")
                 .replace(/\)(\d)/, ")*$1"); // Add * between numbers and parentheses
    sanitized = sanitized.replace(/\)\(/g, ")*("); // Add * between opposing parentheses
    sanitized = sanitized.replace(/sin/g, "Math.sin")
                 .replace(/cos/g, "Math.cos")
                 .replace(/tan/g, "Math.tan")
                 .replace(/sqrt/g, "Math.sqrt")
                 .replace(/log/g, "Math.log")
                 .replace(/exp/g, "Math.exp")
                 .replace(/pi/g, "Math.PI")
                 .replace(/\be\b/g, "Math.E");
    
    let funcColor = colors[colorIndex];
    colorIndex++;
    if (colorIndex >= colors.length) {
        colorIndex = 0;
    }

    storedFunctions[storedFunctions.length] = new inputFunction(input, sanitized, funcColor, detailSlider.value);
    plot(storedFunctions[storedFunctions.length - 1]);
    listFunctions();
}

/*
Plots the function in the input field
*/
function plot(func) {
    let oldDetail = detailSlider.value;
    detail = func.detail;
    input = func.sanitized;

    // Setup the pen
    ctx.strokeStyle = func.color;
    ctx.lineWidth = 2;    

    // Evaluate the function
    const evaluate = new Function("x", `return ${input};`); // Used for evaluating the input function
    // Store the outputs
    let y = [];
    for (let i = 0; i <= canvas.width; i+=1/detail) {
        x = (i-400)/8;
        y[detail*i] = evaluate(x);
    }
    // Draw the function
    ctx.beginPath();
    ctx.moveTo(0, -(8*y[0]-200));
    for (let i = 1; i <= canvas.width; i+=1/detail) {
        if (y[detail*i] !== Infinity && !isNaN(y[detail*i])) {
            ctx.lineTo(i, -(8*y[detail*i]-200));
        }
        else {
            ctx.moveTo(i+0.01, -(8*y[detail*(i+1/detail)]-200))
        }
    }
    ctx.stroke();
    detail = oldDetail;
}

/*
Checks to make sure the input is a valid mathematical expression

Inputs: string = the string to check if it is a valid expression
Outputs: if string is valid, return string
         else return null
*/
function validateInput(string) {
    const regex = /^[0-9+\-*/()^x\s]*(\b(sin|cos|tan|log|sqrt|exp|pi|e)\b[0-9+\-*/()^x\s]*)*$/;
    if (regex.test(string)) {
        return validateParentheses(string);
    }
    else {
        alert("Invalid function!");
        return null;
    }
}

/*
Checks to make sure the input has balanced parentheses

Input: string = the string to check
Ouputs: if string has balanced parentheses, return string
        else return null
*/
function validateParentheses(string) {
    let stack = []; // Initialize the stack

    // Iterate over the characters in the input string
    for (let i = 0; i < string.length; i++) {
        let char = string[i];

        if (char === '(') {
            // Push opening parenthesis to stack
            stack.push(char);
        } else if (char === ')') {
            // If stack is empty, we have an unmatched closing parenthesis
            if (stack.length === 0) {
                alert("Parentheses are not balanced!");
                return null; // Parentheses are unbalanced
            }
            // Pop the top item (matching opening parenthesis)
            stack.pop();
        }
    }

    // After parsing, check if stack is empty (all opening parentheses had closing ones)
    if (stack.length == 0) {
        return string;
    }
    else {
        alert("Parentheses are not balanced!");
        return null;
    }
}

/*
Draws the axes and gridlines in the canvas
*/
function drawGraph() {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height/2);
    ctx.lineTo(canvas.width, canvas.height/2);
    ctx.moveTo(canvas.width/2, 0);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.stroke();

    ctx.strokeStyle = "lightgray";
    ctx.beginPath();
    for (let i = 0; i < canvas.width; i+=40) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
    }
    for (let i = 0; i < canvas.height; i+=40) {
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
    }
    ctx.stroke();
}

function listFunctions() {
    functionsDiv.innerHTML = "";
    for (let f of storedFunctions) {
        functionsDiv.innerHTML += "<p>"+f.input+"</p>";
    }
}

drawGraph();