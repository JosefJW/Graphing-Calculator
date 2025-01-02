const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const button = document.getElementById('plotButton');
button.addEventListener('click', function() {
    plot();
});

function plot() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGraph();
    ctx.strokeStyle = "red";

    let input = document.getElementById('functionInput').value;
    
    // Change exponentiation ^ to **
    input = input.replace("^", "**");

    // Change things such as 5x to 5*x
    input = input.replace(/(\d)(x)/g, "$1*$2");

    // Validate function input
    input = validateInput(input);

    // Change common math function to Math.function
    input = input.replace("sin", "Math.sin")
                 .replace("cos", "Math.cos")
                 .replace("tan", "Math.tan")
                 .replace("sqrt", "Math.sqrt")
                 .replace("log", "Math.log")
                 .replace("exp", "Math.exp")
                 .replace("pi", "Math.PI")
                 .replace(/\be\b/g, "Math.E");
    
    if (!input) {
        return null;
    }

    const evaluate = new Function("x", `return ${input};`)
    let y = [];
    for (let i = 0; i <= canvas.width; i++) {
        x = (i-400)/8;
        let func = input.replace("x", x);
        y[i] = evaluate(x);
        if (i == 200) {
            button.innerText = y[i];
        }
    }

    ctx.beginPath();
    ctx.moveTo(0, -(8*y[0]-200));
    for (let i = 1; i <= canvas.width; i++) {
        if (y[i] != "Infinity") {
            ctx.lineTo(i, -(8*y[i]-200));
        }
        else {
            ctx.moveTo(i+1, -(8*y[i+1]-200))
        }
    }
    ctx.stroke();
}

function validateInput(input) {
    const regex = /^[0-9+\-*/()\(sin\)\(cos\)\(tan\)\(log\)\(sqrt\)\(exp\)\(pi\)\(e\),^x\s]+$/;
    if (regex.test(input)) {
        return input;
    }
    else {
        alert("Invalid function!");
        return null;
    }
}

function drawGraph() {
    ctx.strokeStyle = "black";
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

drawGraph();