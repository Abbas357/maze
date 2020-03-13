const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const startGameBtn = document.querySelector('.start_game_btn');
const mainMenu = document.querySelector('.main-menu');
const gameBlock = document.querySelector('#game-block');
const gameArea = document.querySelector('#game-area');
const range = document.querySelector('#range');
const result = document.querySelector('#result');
const elapsedTime = document.querySelector('.elapsed-time');
const highScoreSpan = document.querySelector('.highscore-span');

const engine = Engine.create();
const { world } = engine;
engine.world.gravity.y = 0;

let startGame = false;
let startTime, endTime;
let cellsHorizontal = 10;
let cellsVertical = 7;

let timer = {
    start() {
        startTime = new Date();
    },
    end() {
        endTime = new Date();
        let timeDiff = endTime - startTime;
        timeDiff /= 1000;
        let seconds = Math.round(timeDiff);
        return seconds;
    }
}

range.addEventListener('change', event => {
    startGameBtn.classList.remove('hide')
    cellsHorizontal = parseInt(range.value);
    cellsVertical = parseInt(range.value - ((range.value / 100) * 40));

    const width = window.innerWidth;
    const height = window.innerHeight;

    const unitLengthX = width / cellsHorizontal;
    const unitLengthY = height / cellsVertical;

    const render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            wireframes: false,
            width,
            height
        }
    });
    Render.run(render);
    Runner.run(Runner.create(), engine);

    const walls = [
        Bodies.rectangle(width / 2, 0, width , 10, { isStatic: true, render: { fillStyle: 'red'} }),
        Bodies.rectangle(width / 2, height, width, 10, { isStatic: true, render: { fillStyle: 'red'} }),
        Bodies.rectangle(0, height / 2, 10, height, { isStatic: true, render: { fillStyle: 'red'} }),
        Bodies.rectangle(width, height / 2, 10, height, { isStatic: true, render: { fillStyle: 'red'} }),
    ];
    World.add(world, walls);

    const shuffle = arr => {
        let counter = arr.length;    
        while(counter > 0) {
            const index = Math.floor(Math.random() * counter);
            counter--;
            const temp = arr[counter];
            arr[counter] = arr[index];
            arr[index] = temp;
        }
        return arr;
    }

    const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

    const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));

    const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

    const startRow = Math.floor(Math.random() * cellsVertical);
    const startColumn = Math.floor(Math.random() * cellsHorizontal);

    const stepThroughCell = (row, column) => {
        // If I have visted the cell at [row, column], then return

        if(grid[row][column]){
            return;
        }

        // Mark thsi cell as being visited

        grid[row][column] = true;

        // Assemble randomly-ordered list of neighbours

        const neighbours = shuffle([
            [row - 1, column, 'up'],
            [row, column + 1, 'right'],
            [row + 1, column, 'down'],
            [row, column - 1, 'left']
        ]);
        
        // For each neighbour ... 

        for (let neighbour of neighbours) {
            const [nextRow, nextColumn, direction] = neighbour;

            // See if that neighour is out of bounds

            if(nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
                continue;
            }

            // If we have visited that neighbour, continue to next neighbour

            if(grid[nextRow][nextColumn]) {
                continue;
            }

            // Remove a wall from either horizontals or verticals

            if(direction === 'left'){
                verticals[row][column - 1] = true;
            }else if(direction === 'right'){
                verticals[row][column] = true;
            }else if(direction === 'up'){
                horizontals[row - 1][column] = true;
            }else if(direction === 'down'){
                horizontals[row][column] = true;
            }

            // Visit the next cell

            stepThroughCell(nextRow, nextColumn);
        }

    };

    stepThroughCell(startRow, startColumn);

    horizontals.forEach((row, rowIndex) => {
        row.forEach((open,columnIndex) => {
            if(open) {
                return;
            }
            const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX / 2,
                rowIndex * unitLengthY + unitLengthY,
                unitLengthX,
                (unitLengthX / 100) * 10,
                {
                    label: 'wall',
                    isStatic: true,
                    // chamfer: { radius: 10 },
                    render: {
                        fillStyle: 'red'
                    }
                }
            );
            World.add(world, wall)
        });
    });

    verticals.forEach((row, rowIndex) => {
        row.forEach((open,columnIndex) => {
            if(open) {
                return;
            }
            const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX,
                rowIndex * unitLengthY + unitLengthY / 2,
                (unitLengthX / 100) * 10,
                unitLengthY,
                {
                    label: 'wall',
                    isStatic: true,
                    // chamfer: { radius: 10 },
                    render: {
                        fillStyle: 'red',
                    }
                }
            );
            World.add(world, wall)
        });
    });

    // Goal

    const goal = Bodies.rectangle(
        width - unitLengthX / 2,
        height - unitLengthY / 2,
        unitLengthX * .8,
        unitLengthY * .8,
        {
            label: 'goal',
            isStatic: true,
            render: {
                fillStyle: 'green'
            }
        }
    )

    World.add(world, goal);

    // Ball 

    const ballRadius = Math.min(unitLengthX, unitLengthY) / 3;
    const ball = Bodies.circle(
        unitLengthX / 2,
        unitLengthY / 2,
        ballRadius,
        {
            label: 'ball',
            render: {
                fillStyle: 'blue'
            }
        }
    );

    World.add(world, ball);

    document.addEventListener('keydown', event => {
        const { x, y} = ball.velocity;
        if(!startGame) return;

        if(event.keyCode === 87){
            Body.setVelocity(ball, { x, y: y - (unitLengthX / 100) * 5 });
        }
        if(event.keyCode === 68){
            Body.setVelocity(ball, { x: x + (unitLengthX / 100) * 5, y });
        }
        if(event.keyCode === 83){
            Body.setVelocity(ball, { x, y: y + (unitLengthX / 100) * 5 });
        }
        if(event.keyCode === 65){
            Body.setVelocity(ball, { x: x - (unitLengthX / 100) * 5, y });
        }
    });

    // Win Condition

    Events.on(engine, 'collisionStart', event => {
        event.pairs.forEach(collision => {
            const labels = ['goal','ball'];
            if(labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)){
                world.gravity.y = 1;
                world.bodies.forEach(body => {
                    if(body.label === 'wall'){
                        Body.setStatic(body, false);
                        result.open();
                        if(localStorage.getItem('highscore') > timer.end()){
                            localStorage.setItem('highscore', timer.end());
                        }
                        elapsedTime.innerHTML = timer.end();
                        startGame = false;
                    }
                })
            }
        });
    });
    startGameBtn.addEventListener('click', event => {
        gameBlock.style.opacity = 0;
        gameArea.style.display = 'none';
        startGame = true;
        timer.start();
    });    
    mainMenu.addEventListener('click', event => {
        document.location.reload();
    });

    const highScore = localStorage.getItem('highscore');
    if(highScore) {
        highScoreSpan.innerHTML = highScore;        
    }else {
        highScoreSpan.innerHTML = "No score available";
    }
    
});