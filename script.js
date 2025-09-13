function addStudentRow() {
    const tbody = document.getElementById('inputTableBody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="text" placeholder="Enter student name" class="student-name"></td>
        <td><input type="number" placeholder="Enter raw score" class="raw-score" min="0" max="100"></td>
        <td><button class="btn btn-danger" onclick="removeRow(this)">Remove</button></td>
    `;
    tbody.appendChild(newRow);
}

function removeRow(button) {
    const tbody = document.getElementById('inputTableBody');
    if (tbody.children.length > 1) {
        button.closest('tr').remove();
    } else {
        alert('You must have at least one student row.');
    }
}

function clearAll() {
    if (confirm('Are you sure you want to clear all data?')) {
        const tbody = document.getElementById('inputTableBody');
        tbody.innerHTML = `
            <tr>
                <td><input type="text" placeholder="Enter student name" class="student-name"></td>
                <td><input type="number" placeholder="Enter raw score" class="raw-score" min="0" max="100"></td>
                <td><button class="btn btn-danger" onclick="removeRow(this)">Remove</button></td>
            </tr>
        `;
        document.getElementById('resultsSection').classList.add('hidden');
    }
}

function calculateKennedyCurve() {
    const students = [];
    const nameInputs = document.querySelectorAll('.student-name');
    const scoreInputs = document.querySelectorAll('.raw-score');

    // Validate inputs
    for (let i = 0; i < nameInputs.length; i++) {
        const name = nameInputs[i].value.trim();
        const score = parseFloat(scoreInputs[i].value);

        if (!name) {
            alert(`Please enter a name for student ${i + 1}.`);
            return;
        }

        if (isNaN(score) || score < 0 || score > 100) {
            alert(`Please enter a valid score (0-100) for ${name}.`);
            return;
        }

        students.push({ name, rawScore: score, originalIndex: i });
    }

    if (students.length === 0) {
        alert('Please enter at least one student.');
        return;
    }

    // Get target mean
    let targetMean;
    const customRadio = document.getElementById('customTarget');
    if (customRadio && customRadio.checked) {
        const customValue = parseFloat(document.getElementById('customTargetValue').value);
        if (isNaN(customValue) || customValue < 0 || customValue > 100) {
            alert('Please enter a valid custom target mean (0-100).');
            return;
        }
        targetMean = customValue;
    } else {
        targetMean = parseInt(document.querySelector('input[name="targetMean"]:checked').value);
    }

    // Get maximum scaled score
    const maxScaledScore = parseFloat(document.getElementById('maxScaledScore').value);
    if (isNaN(maxScaledScore) || maxScaledScore < 0 || maxScaledScore > 100) {
        alert('Please enter a valid maximum scaled score (0-100).');
        return;
    }

    // Validate that max scaled score is >= highest raw score
    const highestRawScore = Math.max(...students.map(s => s.rawScore));
    if (maxScaledScore < highestRawScore) {
        alert(`Maximum scaled score (${maxScaledScore}%) must be equal to or higher than the highest raw score (${highestRawScore}%).`);
        return;
    }

    // Calculate Kennedy Curve
    const results = applyKennedyCurve(students, targetMean, maxScaledScore);
    displayResults(results);
}

function applyKennedyCurve(students, targetMean, maxScaledScore) {
    // Calculate current class mean
    const sum = students.reduce((total, student) => total + student.rawScore, 0);
    const currentMean = sum / students.length;

    // Find the highest raw score
    const highestRawScore = Math.max(...students.map(s => s.rawScore));

    // Compute scaling factor: k = (max scaled score - 10) / highest raw score
    // This ensures the highest score gets scaled to the maximum scaled score
    const scalingFactor = (maxScaledScore - 10) / highestRawScore;

    // Transform each raw score and maintain original order
    const results = students.map((student, index) => {
        // Calculate curved score: y = k * x + 10
        // The +10 ensures the lowest possible score is 10
        let scaledScore = (scalingFactor * student.rawScore) + 10;

        // Cap at 100% if needed
        if (scaledScore > 100) {
            scaledScore = 100;
        }

        // Round to 1 decimal place
        scaledScore = Math.round(scaledScore * 10) / 10;

        // Determine letter grade
        const grade = getLetterGrade(scaledScore);

        return {
            name: student.name,
            rawScore: student.rawScore,
            scaledScore: scaledScore,
            grade: grade,
            originalIndex: student.originalIndex
        };
    });

    return results;
}

function getLetterGrade(score) {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 67) return 'D+';
    if (score >= 63) return 'D';
    if (score >= 60) return 'D-';
    return 'F';
}

function displayResults(results) {
    // Calculate statistics
    const rawScores = results.map(r => r.rawScore);
    const scaledScores = results.map(r => r.scaledScore);
    
    const rawAvg = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
    const scaledAvg = scaledScores.reduce((a, b) => a + b, 0) / scaledScores.length;
    const rawMax = Math.max(...rawScores);
    const rawMin = Math.min(...rawScores);
    const scaledMax = Math.max(...scaledScores);
    const scaledMin = Math.min(...scaledScores);

    // Get target mean for display
    let targetMean;
    const customRadio = document.getElementById('customTarget');
    if (customRadio && customRadio.checked) {
        targetMean = parseFloat(document.getElementById('customTargetValue').value);
    } else {
        targetMean = parseInt(document.querySelector('input[name="targetMean"]:checked').value);
    }

    // Get max scaled score for display
    const maxScaledScore = parseFloat(document.getElementById('maxScaledScore').value);

    // Display statistics
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${results.length}</div>
            <div class="stat-label">Total Students</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${rawAvg.toFixed(1)}</div>
            <div class="stat-label">Raw Score Average</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${scaledAvg.toFixed(1)}</div>
            <div class="stat-label">Scaled Score Average</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${targetMean}</div>
            <div class="stat-label">Target Mean</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${maxScaledScore}</div>
            <div class="stat-label">Max Scaled Score</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${rawMax}</div>
            <div class="stat-label">Highest Raw Score</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${rawMin}</div>
            <div class="stat-label">Lowest Raw Score</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${scaledMax.toFixed(1)}</div>
            <div class="stat-label">Highest Scaled Score</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${scaledMin.toFixed(1)}</div>
            <div class="stat-label">Lowest Scaled Score</div>
        </div>
    `;

    // Display results table in original order
    const resultsTableBody = document.getElementById('resultsTableBody');
    resultsTableBody.innerHTML = '';

    // Sort by original index to maintain entry order
    const sortedResults = [...results].sort((a, b) => a.originalIndex - b.originalIndex);

    sortedResults.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.name}</td>
            <td>${result.rawScore}</td>
            <td>${result.scaledScore}</td>
            <td><strong>${result.grade}</strong></td>
        `;
        resultsTableBody.appendChild(row);
    });

    // Show results section
    document.getElementById('resultsSection').classList.remove('hidden');
    
    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

function exportToCSV() {
    const resultsTableBody = document.getElementById('resultsTableBody');
    if (!resultsTableBody || resultsTableBody.children.length === 0) {
        alert('No results to export. Please calculate the Kennedy Curve first.');
        return;
    }

    let csvContent = 'Student Name,Raw Score,Scaled Score,Grade\n';
    
    // Get all rows from results table
    const rows = resultsTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const name = cells[0].textContent;
        const rawScore = cells[1].textContent;
        const scaledScore = cells[2].textContent;
        const grade = cells[3].textContent.trim();
        
        csvContent += `"${name}",${rawScore},${scaledScore},"${grade}"\n`;
    });

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'kennedy_curve_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function toggleCustomTarget() {
    const customInput = document.getElementById('customTargetValue');
    const customRadio = document.getElementById('customTarget');
    
    if (customRadio.checked) {
        customInput.parentElement.classList.add('active');
        customInput.focus();
    } else {
        customInput.parentElement.classList.remove('active');
    }
}

function updateMaxScaledScore() {
    const nameInputs = document.querySelectorAll('.student-name');
    const scoreInputs = document.querySelectorAll('.raw-score');
    const maxScaledInput = document.getElementById('maxScaledScore');
    
    // Find the highest raw score
    let highestScore = 0;
    for (let i = 0; i < scoreInputs.length; i++) {
        const score = parseFloat(scoreInputs[i].value);
        if (!isNaN(score) && score > highestScore) {
            highestScore = score;
        }
    }
    
    // Update the max scaled score input with the highest score or 100, whichever is higher
    if (highestScore > 0) {
        maxScaledInput.value = Math.max(highestScore, 100);
    }
}

// Allow Enter key to add new row
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.classList.contains('raw-score')) {
        e.preventDefault();
        addStudentRow();
        // Focus on the new name input
        const newRow = document.querySelector('#inputTableBody tr:last-child');
        const nameInput = newRow.querySelector('.student-name');
        nameInput.focus();
    }
});

// Initialize custom target input as hidden and set up event listeners
document.addEventListener('DOMContentLoaded', function() {
    const customInput = document.getElementById('customTargetValue');
    if (customInput) {
        customInput.parentElement.classList.remove('active');
    }
    
    // Add event listeners to raw score inputs to update max scaled score
    const scoreInputs = document.querySelectorAll('.raw-score');
    scoreInputs.forEach(input => {
        input.addEventListener('input', updateMaxScaledScore);
    });
});
