document.addEventListener("DOMContentLoaded", function() {
    const plinkoBoard = document.getElementById('plinko-board');
    const dropButton = document.getElementById('drop-button');
    const balanceElement = document.getElementById('balance');
    const multiplierRow = document.getElementById('multiplier-row');
    let balance = 1000;

    const multipliers = [
        { value: 1000, className: 'x1000' },
        { value: 10, className: 'x10' },
        { value: 2, className: 'x2' },
        { value: 0.5, className: 'x0_5' },
        { value: 0.2, className: 'x0_2' },
        { value: 0.5, className: 'x0_5' },
        { value: 2, className: 'x2' },
        { value: 10, className: 'x10' },
        { value: 1000, className: 'x1000' }
    ];

    function createMultiplierRow() {
        multiplierRow.innerHTML = "";  
        multipliers.forEach(multiplier => {
            const multiplierDiv = document.createElement('div');
            multiplierDiv.className = `multiplier ${multiplier.className}`;
            multiplierDiv.textContent = `x${multiplier.value}`;
            multiplierRow.appendChild(multiplierDiv);
        });
    }

    function createObstacles() {
        const rows = 10; // Number of rows in the triangle
        const plinkoBoardWidth = plinkoBoard.offsetWidth;
        const plinkoBoardHeight = plinkoBoard.offsetHeight;
    
        const gapMultiplier = 1; // Adjust this value to increase the gap between obstacles
        const rowHeight = plinkoBoardHeight / (rows + 1);
        
        // Calculate the width of the gap based on the multiplier
        const baseRowWidth = plinkoBoardWidth / rows;
        const rowWidth = baseRowWidth * gapMultiplier;
    
        for (let i = 0; i < rows; i++) {
            const obstaclesPerRow = i + 1;
    
            for (let j = 0; j < obstaclesPerRow; j++) {
                const obstacle = document.createElement('div');
                obstacle.className = 'obstacle';
                
                // Calculate the left position with the increased gap
                const leftPosition = (plinkoBoardWidth / 2) - ((obstaclesPerRow - 1) * rowWidth / 2) + (j * rowWidth);
                
                // Calculate the top position with the row height
                const topPosition = (i + 1) * rowHeight;
                
                obstacle.style.left = `${leftPosition}px`;
                obstacle.style.top = `${topPosition}px`;
    
                plinkoBoard.appendChild(obstacle);
            }
        }
    }
    
    
    

    function dropBall() {
        if (balance <= 0) {
            alert("No balance left! Please refresh the game.");
            return;
        }
    
        // Create a new ball element
        const ball = document.createElement('div');
        ball.className = 'ball';
    
        // Set the ball's initial position to be higher
        const startHeight = -100; // Start the ball higher by 100 pixels (adjust as needed)
        ball.style.left = `${plinkoBoard.offsetWidth / 2 - 2}px`;
        ball.style.top = `${startHeight}px`;
        plinkoBoard.appendChild(ball);
    
        // Ball movement variables
        let currentTop = parseInt(ball.style.top);
        let ballLeft = parseInt(ball.style.left);
        let velocityY = 2;
        let velocityX = 0;
        const gravity = 0.1;
        const maxBounceAngle = Math.PI / 4;
        const randomDirectionChance = 0.1; // Chance of random direction when directly on top of an obstacle
        const randomBounceFactor = 0.2; // Random variability in bounce angle
    
        // Special ball properties
        const isSpecial = Math.random() < 0.1; // 10% chance to be special
        let specialGravity = gravity;
        let specialBounceFactor = randomBounceFactor;
        let specialDirectionRange = 4;
    
        // Get positions of the 1000x multipliers
        const multiplierPositions = Array.from(document.querySelectorAll('.multiplier.x1000')).map(div => div.getBoundingClientRect());
    
        if (isSpecial) {
            // Special ball properties
            velocityY *= 1.5; // Increase initial vertical velocity
            specialGravity = gravity * 2; // Increase gravity for more volatility
            specialBounceFactor = randomBounceFactor * 2; // Increase bounce angle variability
            specialDirectionRange = 6; // Increase horizontal velocity range
    
            // Modify the ball's trajectory to ensure it lands on a 1000x multiplier
            if (multiplierPositions.length > 0) {
                // Find the center position of the first 1000x multiplier
                const target = multiplierPositions[0];
                const targetCenter = target.left + target.width / 2;
    
                // Adjust horizontal velocity to direct the ball towards the target multiplier
                const boardCenter = plinkoBoard.offsetWidth / 2;
                velocityX = (targetCenter - boardCenter) / 10; // Adjust the factor as needed for accurate targeting
            }
        }
    
        const interval = setInterval(() => {
            if (currentTop >= plinkoBoard.offsetHeight - 20) { 
                clearInterval(interval);
                determineMultiplier(ball.offsetLeft + ball.offsetWidth / 2);
                plinkoBoard.removeChild(ball);
            } else {
                velocityY += isSpecial ? specialGravity : gravity;
                currentTop += velocityY;
                ballLeft += velocityX;
    
                ball.style.top = `${currentTop}px`;
                ball.style.left = `${ballLeft}px`;
    
                const obstacles = document.querySelectorAll('.obstacle');
                let isOnTopOfObstacle = false;
    
                obstacles.forEach(obstacle => {
                    const obstacleRect = obstacle.getBoundingClientRect();
                    const ballRect = ball.getBoundingClientRect();
                    if (
                        ballRect.left < obstacleRect.right &&
                        ballRect.right > obstacleRect.left &&
                        ballRect.top < obstacleRect.bottom &&
                        ballRect.bottom > obstacleRect.top
                    ) {
                        const hitPosition = (ballRect.left + ballRect.right) / 2 - obstacleRect.left;
                        const normalizedHitPos = (hitPosition / obstacleRect.width) - 0.5;
                        const bounceAngle = normalizedHitPos * maxBounceAngle;
    
                        // Add random variability to the bounce angle
                        const randomAngle = (Math.random() - 0.5) * (isSpecial ? specialBounceFactor : randomBounceFactor);
                        const adjustedBounceAngle = bounceAngle + randomAngle;
    
                        velocityX = velocityY * Math.sin(adjustedBounceAngle);
                        velocityY = velocityY * Math.cos(adjustedBounceAngle);
    
                        if (Math.abs(normalizedHitPos) < 0.1) {
                            velocityY *= 0.8;
                        }
    
                        // Randomize direction if the ball is falling directly on top of the obstacle
                        if (Math.abs(ballRect.left + ballRect.width / 2 - (obstacleRect.left + obstacleRect.width / 2)) < 10) {
                            isOnTopOfObstacle = true;
                        }
                    }
                });
    
                if (isOnTopOfObstacle && Math.random() < randomDirectionChance) {
                    // Apply a random horizontal velocity if the ball is on top of an obstacle
                    const randomDirection = (Math.random() - 0.5) * (isSpecial ? specialDirectionRange : 4); // Adjust the range based on ball type
                    velocityX += randomDirection;
                }
    
                ballLeft = Math.max(0, Math.min(ballLeft, plinkoBoard.offsetWidth - ball.offsetWidth));
            }
        }, 20);
    
        balance -= 10;
        updateBalance();
    }
    

    
    
    
    
    

    function determineMultiplier(position) {
        const segmentWidth = plinkoBoard.offsetWidth / multipliers.length;
        const multiplierIndex = Math.floor(position / segmentWidth);
        const multiplier = multipliers[multiplierIndex].value;
        balance += 10 * multiplier;
        updateBalance();
    }

    function updateBalance() {
        balanceElement.textContent = `Balance: $${balance}`;
    }

    dropButton.addEventListener('click', dropBall);

    createMultiplierRow();
    createObstacles();
    updateBalance();
});
