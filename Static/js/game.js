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
                validateCell(input, value);
                
                // Auto-advance
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
                validateCell(input, numericValue);
                
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
    
    // Enhanced validation function
    async function validateCell(input, value) {
        const row = input.dataset.row;
        const col = input.dataset.col;
        
        try {
            const response = await fetch('/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    row: row,
                    col: col,
                    value: value
                })
            });
            
            const data = await response.json();
            
            if (data.valid) {
                input.classList.remove('error-cell');
                input.classList.add('valid-cell');
                setTimeout(() => input.classList.remove('valid-cell'), 1000);
            } else {
                input.classList.add('error-cell');
                
                // Update mistake count
                const mistakeCountElement = document.getElementById('mistake-count');
                const newMistakeCount = parseInt(mistakeCountElement.textContent) + 1;
                mistakeCountElement.textContent = newMistakeCount;
                
                // Check mistake limit (5 mistakes max)
                if (newMistakeCount >= 5) {
                    if (confirm('You have made too many mistakes! Would you like to see the solution?')) {
                        window.location.href = '/solve';
                    }
                }
                
                setTimeout(() => {
                    input.classList.remove('error-cell');
                    if (data.correct_value) {
                        input.value = '';
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Validation error:', error);
        }
    }
    
    // Hint button functionality with limit (3 hints max)
    document.querySelector('.hint-btn')?.addEventListener('click', async () => {
        const activeInput = document.querySelector('.editable-cell:focus');
        if (!activeInput) {
            alert('Please select an empty cell first by clicking on it!');
            return;
        }

        if (activeInput.value !== '') {
            alert('Selected cell already has a value. Please choose an empty cell.');
            return;
        }

        const hintCountElement = document.getElementById('hint-count');
        const hintCount = parseInt(hintCountElement.textContent);
        
        if (hintCount >= 3) {
            alert('You have used all available hints (maximum 3 hints per game).');
            return;
        }

        try {
            const row = activeInput.dataset.row;
            const col = activeInput.dataset.col;
            
            const response = await fetch(`/hint?row=${row}&col=${col}`);
            const data = await response.json();
            
            if (data.error) {
                alert(data.error);
            } else {
                activeInput.value = data.value;
                activeInput.classList.add('hint-cell');
                hintCountElement.textContent = hintCount + 1;
                validateCell(activeInput, data.value);
            }
        } catch (error) {
            console.error('Error getting hint:', error);
            alert('Error getting hint. Please try again.');
        }
    });
    
    // Solve button
    document.querySelector('.solve-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to see the solution? This will end your current game.')) {
            window.location.href = '/solve';
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
                container.style.backgroundColor = 'rgba(0,0,0,0.9)';
                container.style.zIndex = '1000';
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                
                const closeBtn = document.createElement('button');
                closeBtn.textContent = '✕ Close';
                closeBtn.style.position = 'absolute';
                closeBtn.style.top = '20px';
                closeBtn.style.right = '20px';
                closeBtn.style.padding = '10px 15px';
                closeBtn.style.backgroundColor = '#e74c3c';
                closeBtn.style.color = 'white';
                closeBtn.style.border = 'none';
                closeBtn.style.borderRadius = '5px';
                closeBtn.style.cursor = 'pointer';
                closeBtn.addEventListener('click', () => {
                    document.body.removeChild(container);
                });
                
                const title = document.createElement('h2');
                title.textContent = 'Solving Visualization';
                title.style.color = 'white';
                title.style.marginBottom = '20px';
                
                const boardDisplay = document.createElement('table');
                boardDisplay.className = 'sudoku-grid';
                boardDisplay.style.backgroundColor = 'white';
                boardDisplay.style.border = '2px solid #2c3e50';
                
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
                        cell.style.width = '40px';
                        cell.style.height = '40px';
                        cell.style.border = '1px solid #ddd';
                        cell.style.textAlign = 'center';
                        row.appendChild(cell);
                    }
                    boardDisplay.appendChild(row);
                }
                
                const controls = document.createElement('div');
                controls.style.display = 'flex';
                controls.style.gap = '10px';
                controls.style.marginTop = '20px';
                
                const prevBtn = document.createElement('button');
                prevBtn.textContent = '◄ Previous';
                prevBtn.className = 'btn';
                prevBtn.style.backgroundColor = '#3498db';
                prevBtn.style.color = 'white';
                
                const nextBtn = document.createElement('button');
                nextBtn.textContent = 'Next ►';
                nextBtn.className = 'btn';
                nextBtn.style.backgroundColor = '#2ecc71';
                nextBtn.style.color = 'white';
                
                const autoBtn = document.createElement('button');
                autoBtn.textContent = '▶ Auto Play';
                autoBtn.className = 'btn';
                autoBtn.style.backgroundColor = '#f39c12';
                autoBtn.style.color = 'white';
                
                const speedControl = document.createElement('div');
                speedControl.style.display = 'flex';
                speedControl.style.alignItems = 'center';
                speedControl.style.gap = '10px';
                speedControl.style.marginTop = '10px';
                speedControl.style.color = 'white';
                
                const speedLabel = document.createElement('span');
                speedLabel.textContent = 'Speed:';
                
                const speedSlider = document.createElement('input');
                speedSlider.type = 'range';
                speedSlider.min = '100';
                speedSlider.max = '2000';
                speedSlider.value = '500';
                speedSlider.style.width = '150px';
                
                speedControl.appendChild(speedLabel);
                speedControl.appendChild(speedSlider);
                
                controls.appendChild(prevBtn);
                controls.appendChild(nextBtn);
                controls.appendChild(autoBtn);
                
                container.appendChild(closeBtn);
                container.appendChild(title);
                container.appendChild(boardDisplay);
                container.appendChild(controls);
                container.appendChild(speedControl);
                document.body.appendChild(container);
                
                let currentStep = 0;
                let autoPlayInterval = null;
                let playSpeed = 500;
                
                speedSlider.addEventListener('input', (e) => {
                    playSpeed = 2100 - e.target.value;
                    if (autoPlayInterval) {
                        clearInterval(autoPlayInterval);
                        autoPlayInterval = setInterval(playNextStep, playSpeed);
                    }
                });
                
                const updateBoard = (stepIndex) => {
                    if (stepIndex < 0 || stepIndex >= steps.steps.length) return;
                    
                    const step = steps.steps[stepIndex];
                    const cells = boardDisplay.querySelectorAll('td');
                    
                    // Update all cells
                    for (let i = 0; i < 9; i++) {
                        for (let j = 0; j < 9; j++) {
                            const cellIndex = i * 9 + j;
                            cells[cellIndex].textContent = step.board[i][j] || '';
                            cells[cellIndex].style.backgroundColor = '';
                            cells[cellIndex].style.color = 'black';
                        }
                    }
                    
                    // Highlight current cell
                    if (step.action === 'place') {
                        const cellIndex = step.row * 9 + step.col;
                        cells[cellIndex].style.backgroundColor = 'rgba(46, 204, 113, 0.7)';
                        cells[cellIndex].style.color = 'white';
                    } else if (step.action === 'remove') {
                        const cellIndex = step.row * 9 + step.col;
                        cells[cellIndex].style.backgroundColor = 'rgba(231, 76, 60, 0.7)';
                    }
                    
                    currentStep = stepIndex;
                };
                
                const playNextStep = () => {
                    if (currentStep < steps.steps.length - 1) {
                        updateBoard(currentStep + 1);
                    } else {
                        clearInterval(autoPlayInterval);
                        autoPlayInterval = null;
                        autoBtn.textContent = '▶ Auto Play';
                    }
                };
                
                prevBtn.addEventListener('click', () => {
                    if (autoPlayInterval) {
                        clearInterval(autoPlayInterval);
                        autoPlayInterval = null;
                        autoBtn.textContent = '▶ Auto Play';
                    }
                    updateBoard(currentStep - 1);
                });
                
                nextBtn.addEventListener('click', () => {
                    if (autoPlayInterval) {
                        clearInterval(autoPlayInterval);
                        autoPlayInterval = null;
                        autoBtn.textContent = '▶ Auto Play';
                    }
                    updateBoard(currentStep + 1);
                });
                
                autoBtn.addEventListener('click', () => {
                    if (autoPlayInterval) {
                        clearInterval(autoPlayInterval);
                        autoPlayInterval = null;
                        autoBtn.textContent = '▶ Auto Play';
                    } else {
                        autoBtn.textContent = '⏸ Stop';
                        autoPlayInterval = setInterval(playNextStep, playSpeed);
                    }
                });
                
                updateBoard(0);
                
            } catch (error) {
                console.error('Error visualizing solution:', error);
                alert('Error visualizing solution. Please try again.');
            }
        }
    });
});