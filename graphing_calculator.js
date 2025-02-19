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
    storedFunctions = [];
    listFunctions();
    colorIndex = 0;
})

// Get reset camera button
const resetButton = document.getElementById('resetCamera');
resetButton.addEventListener('click', function() {
    offsetX = 0;
    offsetY = 0;
    zoomLevel = 1;
    drawGraph();
    for (let f of storedFunctions) {
        plot(f, offsetX, offsetY);
    }
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

// Get gridline spacing input
const gridlineSpacingInput = document.getElementById('gridlineSpacingInput');
let gridlineSpacing = 5;
gridlineSpacingInput.oninput = function() {
    if (this.value.trim() === "") {return null;}
    if (this.value < 1) {
        this.value = 1;
    }
    gridlineSpacing = this.value;
    drawGraph();
    for (let f of storedFunctions) {
        plot(f, -offsetX, -offsetY);
    }
}

// Get line width input
const lineWidthInput = document.getElementById('lineWidthInput');
let lineWidth = 1;
lineWidthInput.oninput = function() {
    if (this.value.trim() === "") {return null;}
    if (this.value < 1) {
        this.value = 1;
    }
    lineWidth = this.value;
    drawGraph();
    for (let f of storedFunctions) {
        plot(f, -offsetX, -offsetY);
    }
}

// Get the functions div
const functionsDiv = document.getElementById('functions');

// Colors for the graphs
const colors = ["Red", "Orange", "Gold", "Green", "Blue", "Indigo", "Violet"];
let colorIndex = 0

let storedFunctions = [];


/*
Mouse Vars and Events
*/
let isPanning = false;
let startX = 0;
let startY = 0;
let offsetX = 0;
let offsetY = 0;
let panX = 0;
let panY = 0;
let zoomFactor = 1.05;
let zoomLevel = 1;

// Mouse Down
canvas.addEventListener('mousedown', (event) => {
    isPanning = true;
    startX = event.clientX;
    startY = event.clientY;
})

// Mouse Move
canvas.addEventListener('mousemove', (event) => {
    if (isPanning) {
        panX = event.clientX - startX;
        panY = event.clientY - startY;
        drawGraph();
        requestAnimationFrame(() => {
            for (let f of storedFunctions) {
                plot(f, -offsetX+panX, -offsetY+panY);
            }
        });
    }
});

// Mouse Up
canvas.addEventListener('mouseup', () => {
    if (isPanning) {
        offsetX -= panX;
        offsetY -= panY;
        panX = 0;
        panY = 0;
        isPanning = false;
    }
})

// Scroll Wheel
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();

    // Zoom in or out based on the scroll direction
    if (event.deltaY < 0) { // Zooming in
        zoomLevel *= zoomFactor;
        offsetX *= zoomFactor;
        offsetY *= zoomFactor;
    } else { // Zooming out
        zoomLevel /= zoomFactor;
        offsetX /= zoomFactor;
        offsetY /= zoomFactor;
    }

    // Calculate the center of the canvas
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;

    // Clear the canvas and redraw the functions
    clear();
    for (let f of storedFunctions) {
        plot(f, -offsetX, -offsetY);
    }
});




/*
Stores details for an inputted function
*/
function inputFunction(input, sanitized, color, detail) {
    this.input = input;
    this.sanitized = sanitized;
    this.color = color;
    this.detail = detail;
    this.visible = true;
}

/*
Clears the canvas and redraws the axes
*/
function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGraph();
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
    sanitized = sanitized.replace(/x(\d)/g, "x*$1");
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
    plot(storedFunctions[storedFunctions.length - 1], -offsetX, -offsetY);
    listFunctions();
}

/*
Plots the function in the input field
*/
function plot(func, offsetX, offsetY) {
    if (!func.visible) {return null;}
    let oldDetail = detailSlider.value;
    detail = func.detail;
    input = func.sanitized;

    // Setup the pen
    ctx.strokeStyle = func.color;
    ctx.lineWidth = 3*zoomLevel*lineWidth;    

    // Evaluate the function
    const evaluate = new Function("x", `return ${input};`); // Used for evaluating the input function
    // Store the outputs
    let y = [];

    for (let i = 0; i <= canvas.width; i+=1/detail) {
        x = ((i-canvas.width/2)-offsetX)/(8*zoomLevel);
        let result = evaluate(x);
        if (result !== Infinity && !isNaN(result)) {
            y.push({x: i, y: -(8*zoomLevel*result - canvas.height/2 - offsetY)});
        }
        else {
            y.push({x: i, y: Infinity});
        }
    }
    // Draw the function
    ctx.beginPath();
    ctx.moveTo(y[0].x, y[0].y);
    for (let i = 0; i < y.length; i++) {
        if (y[i].y !== Infinity && !isNaN(y[i].y)) {
            ctx.lineTo(y[i].x, y[i].y);
        }
        else {
            ctx.moveTo(y[i+1].x, 0);
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
    const regex = /^[0-9+\.\-*/()^x\s]*(\b(sin|cos|tan|log|sqrt|exp|pi|e)\b[0-9+\-*/()^x\s]*)*$/;
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
    const gridSpacing = gridlineSpacing*8*zoomLevel;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const yAxisPos = canvas.height/2 - offsetY + panY
    const xAxisPos = canvas.width/2 - offsetX + panX

    // Draw gridlines
    ctx.strokeStyle = "lightgray";
    ctx.lineWidth = zoomLevel*lineWidth;
    //if (ctx.lineWidth < 0.5) {ctx.lineWidth = 0.5;}
    ctx.beginPath();

    
    // Vertical
    for (let i = xAxisPos; i < canvas.width; i+=gridSpacing) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
    }
    for (let i = xAxisPos - gridSpacing; i > 0; i -= gridSpacing) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
    }

    // Horizontal
    for (let i = yAxisPos; i < canvas.height; i+=gridSpacing) {
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
    }
    for (let i = yAxisPos - gridSpacing; i > 0; i -= gridSpacing) {
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
    }
    ctx.stroke();

    // Draw axes
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 5*zoomLevel*lineWidth;
    //if (ctx.lineWidth < 1) {ctx.lineWidth = 1;}
    ctx.beginPath();

    // x-axis
    ctx.moveTo(0, yAxisPos);
    ctx.lineTo(canvas.width, yAxisPos);

    // y-axis
    ctx.moveTo(xAxisPos, 0);
    ctx.lineTo(xAxisPos, canvas.height);
    
    ctx.stroke();
}

/*
Creates a list of all functions being graphed at the bottom of the page
*/
function listFunctions() {
    functionsDiv.innerHTML = "";
    for (let f of storedFunctions) {
        functionsDiv.innerHTML += "<div style=\"display: flex;\">" +
                                  "<span>"+f.input+"&nbsp;&nbsp;&nbsp;</span>" +
                                  "<span>Color:&nbsp;"+f.color+"&nbsp;&nbsp;&nbsp;</span>";
        if (f.visible) {
            functionsDiv.innerHTML += "<span>Visible:</span><input type=\"checkbox\" id=\""+f.input+f.color+"\" class=\"functionVisibility\" style=\"display: inline-flex\" checked/>";
        }
        else {
            functionsDiv.innerHTML += "<span>Visible:</span><input type=\"checkbox\" id=\""+f.input+f.color+"\" class=\"functionVisibility\" style=\"display: inline-flex\"/>";
        }
        functionsDiv.innerHTML += "</div><br><br>";
    }
    let visibilityBoxes = document.querySelectorAll('.functionVisibility');
    for (let vb of visibilityBoxes) {
        vb.oninput = function() {
            for (let f of storedFunctions) {
                if (f.input+f.color == this.id) {
                    f.visible = this.checked;
                }
            }
            clear();
            for (let f of storedFunctions) {plot(f, -offsetX, -offsetY);}
        }
    }
}

drawGraph();