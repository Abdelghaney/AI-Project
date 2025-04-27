document.addEventListener('DOMContentLoaded', () => {
    // Timer functionality
    const timerElement = document.querySelector('.timer');
    const startTime = Date.now();
    
    const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timerElement.textContent = `${minutes}:${seconds}`;
    };
    
    setInterval(updateTimer, 1000);
    
    // Input validation and navigation
    const inputs = document.querySelectorAll('.editable-cell');
    inputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);
            
            let nextInput = null;
            
            switch(e.key) {
                case 'ArrowUp':
                    if (row > 0) nextInput = document.querySelector(`input[data-row="${row-1}"][data-col="${col}"]`);
                    break;
                case 'ArrowDown':
                    if (row < 8) nextInput = document.querySelector(`input[data-row="${row+1}"][data-col="${col}"]`);
                    break;
                case 'ArrowLeft':
                    if (col > 0) nextInput = document.querySelector(`input[data-row="${row}"][data-col="${col-1}"]`);
                    break;
                case 'ArrowRight':
                    if (col < 8) nextInput = document.querySelector(`input[data-row="${row}"][data-col="${col+1}"]`);
                    break;
                case 'Backspace':
                    if (input.value === '' && col > 0) {
                        nextInput = document.querySelector(`input[data-row="${row}"][data-col="${col-1}"]`);
                    }
                    break;
            }
            
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
        });
        
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^1-9]/g, '');
            
            if (value !== '') {
                const num = parseInt(value);
                if (num < 1 || num > 9) {
                    value = '';
                    e.target.classList.add('invalid');
                    setTimeout(() => e.target.classList.remove('invalid'), 1000);
                } else {
                    value = num.toString();
                }
            }
            
            if (value.length > 1) {
                value = value.slice(0, 1);
            }
            
            e.target.value = value;
            
            if (value.length === 1) {
                const row = parseInt(input.dataset.row);
                const col = parseInt(input.dataset.col);
                
                if (col < 8) {
                    const nextInput = document.querySelector(`input[data-row="${row}"][data-col="${col+1}"]`);
                    if (nextInput) nextInput.focus();
                } else if (row < 8) {
                    const nextInput = document.querySelector(`input[data-row="${row+1}"][data-col="0"]`);
                    if (nextInput) nextInput.focus();
                }
            }
        });
        
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text');
            const numericValue = pasteData.replace(/[^1-9]/g, '');
            if (numericValue.length === 1 && parseInt(numericValue) >= 1 && parseInt(numericValue) <= 9) {
                input.value = numericValue;
                
                const row = parseInt(input.dataset.row);
                const col = parseInt(input.dataset.col);
                
                if (col < 8) {
                    const nextInput = document.querySelector(`input[data-row="${row}"][data-col="${col+1}"]`);
                    if (nextInput) nextInput.focus();
                } else if (row < 8) {
                    const nextInput = document.querySelector(`input[data-row="${row+1}"][data-col="0"]`);
                    if (nextInput) nextInput.focus();
                }
            } else {
                input.classList.add('invalid');
                setTimeout(() => input.classList.remove('invalid'), 1000);
            }
        });
    });
    
    // Hint button
    document.querySelector('.hint-btn')?.addEventListener('click', async () => {
        try {
            const response = await fetch('/hint');
            const data = await response.json();
            
            if (data.error) {
                alert(data.error);
                return;
            }
            
            const input = document.querySelector(`input[data-row="${data.row}"][data-col="${data.col}"]`);
            if (input) {
                input.value = data.value;
                input.focus();
            }
        } catch (error) {
            console.error('Error getting hint:', error);
        }
    });
    
    // Solve button
    document.querySelector('.solve-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to see the solution? This will end your current game.')) {
            document.querySelector('form').action = '/solve';
            document.querySelector('form').submit();
        }
    });
    
    // Visualize button
    document.querySelector('.visualize-btn')?.addEventListener('click', async () => {
        if (confirm('This will show step-by-step how the algorithm solves the puzzle. Continue?')) {
            try {
                const response = await fetch('/visualize');
                const steps = await response.json();
                
                const container = document.createElement('div');
                container.className = 'visualization-container';
                container.style.position = 'fixed';
                container.style.top = '0';
                container.style.left = '0';
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.backgroundColor = 'rgba(0,0,0,0.8)';
                container.style.zIndex = '1000';
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                
                const closeBtn = document.createElement('button');
                closeBtn.textContent = 'Close Visualization';
                closeBtn.className = 'btn';
                closeBtn.style.marginBottom = '20px';
                closeBtn.addEventListener('click', () => {
                    document.body.removeChild(container);
                });
                
                const boardDisplay = document.createElement('table');
                boardDisplay.className = 'sudoku-grid';
                
                for (let i = 0; i < 9; i++) {
                    const row = document.createElement('tr');
                    if (i === 2 || i === 5) {
                        row.classList.add('thick-bottom');
                    }
                    for (let j = 0; j < 9; j++) {
                        const cell = document.createElement('td');
                        if (j === 2 || j === 5) {
                            cell.classList.add('thick-right');
                        }
                        cell.textContent = '';
                        row.appendChild(cell);
                    }
                    boardDisplay.appendChild(row);
                }
                
                const controls = document.createElement('div');
                controls.style.display = 'flex';
                controls.style.gap = '10px';
                controls.style.marginTop = '20px';
                
                const prevBtn = document.createElement('button');
                prevBtn.textContent = 'Previous Step';
                prevBtn.className = 'btn';
                
                const nextBtn = document.createElement('button');
                nextBtn.textContent = 'Next Step';
                nextBtn.className = 'btn';
                
                const autoBtn = document.createElement('button');
                autoBtn.textContent = 'Auto Play';
                autoBtn.className = 'btn';
                
                controls.appendChild(prevBtn);
                controls.appendChild(nextBtn);
                controls.appendChild(autoBtn);
                
                container.appendChild(closeBtn);
                container.appendChild(boardDisplay);
                container.appendChild(controls);
                document.body.appendChild(container);
                
                let currentStep = 0;
                let autoPlayInterval = null;
                
                const updateBoard = (stepIndex) => {
                    if (stepIndex < 0 || stepIndex >= steps.steps.length) return;
                    
                    const step = steps.steps[stepIndex];
                    const cells = boardDisplay.querySelectorAll('td');
                    
                    for (let i = 0; i < 9; i++) {
                        for (let j = 0; j < 9; j++) {
                            const cellIndex = i * 9 + j;
                            cells[cellIndex].textContent = step.board[i][j] || '';
                            cells[cellIndex].style.backgroundColor = '';
                            cells[cellIndex].style.color = '';
                        }
                    }
                    
                    if (step.action === 'place') {
                        const cellIndex = step.row * 9 + step.col;
                        cells[cellIndex].style.backgroundColor = 'rgba(46, 204, 113, 0.3)';
                        cells[cellIndex].style.color = 'white';
                    } else if (step.action === 'remove') {
                        const cellIndex = step.row * 9 + step.col;
                        cells[cellIndex].style.backgroundColor = 'rgba(231, 76, 60, 0.3)';
                    }
                    
                    currentStep = stepIndex;
                };
                
                prevBtn.addEventListener('click', () => {
                    if (autoPlayInterval) {
                        clearInterval(autoPlayInterval);
                        autoPlayInterval = null;
                        autoBtn.textContent = 'Auto Play';
                    }
                    updateBoard(currentStep - 1);
                });
                
                nextBtn.addEventListener('click', () => {
                    if (autoPlayInterval) {
                        clearInterval(autoPlayInterval);
                        autoPlayInterval = null;
                        autoBtn.textContent = 'Auto Play';
                    }
                    updateBoard(currentStep + 1);
                });
                
                autoBtn.addEventListener('click', () => {
                    if (autoPlayInterval) {
                        clearInterval(autoPlayInterval);
                        autoPlayInterval = null;
                        autoBtn.textContent = 'Auto Play';
                    } else {
                        autoBtn.textContent = 'Stop';
                        autoPlayInterval = setInterval(() => {
                            if (currentStep < steps.steps.length - 1) {
                                updateBoard(currentStep + 1);
                            } else {
                                clearInterval(autoPlayInterval);
                                autoPlayInterval = null;
                                autoBtn.textContent = 'Auto Play';
                            }
                        }, 500);
                    }
                });
                
                updateBoard(0);
                
            } catch (error) {
                console.error('Error visualizing solution:', error);
                alert('Error visualizing solution');
            }
        }
    });
});

function validateForm() {
    let isValid = true;
    const inputs = document.querySelectorAll('.editable-cell');
    
    inputs.forEach(input => {
        const value = input.value;
        if (value && (isNaN(value) || value < 1 || value > 9)) {
            input.classList.add('invalid');
            isValid = false;
            setTimeout(() => {
                input.classList.remove('invalid');
            }, 1000);
        }
    });
    
    if (!isValid) {
        alert('Please enter valid numbers between 1 and 9 only');
    }
    
    return isValid;
}