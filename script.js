
    // Calculator state
    let currentMode = 'Basic';
    let calculationHistory = [];
    let openBrackets = 0;
    let rawExpression = "";

    // DOM elements
    document.addEventListener("DOMContentLoaded", () => {
      const display = document.getElementById("display");
      const buttons = document.querySelectorAll(".buttons button");
      const sciButtons = document.querySelectorAll(".sci-btn");
      const sciContainer = document.getElementById("scientificButtons");
      const calculator = document.querySelector(".calculator");
      const equalBtn = document.querySelector('.equal');
      const historyList = document.getElementById("historyList");
      const clearHistoryBtn = document.getElementById("clearHistoryBtn");
      const hamburgerToggle = document.getElementById("hamburger-toggle");
      const themeSwitch = document.getElementById("themeSwitch");
      const themeToggle = document.getElementById("themeToggle");
      const themeIcons = document.querySelectorAll(".theme-icon");

      // Theme toggle functionality
      themeSwitch.addEventListener('change', toggleTheme);
      themeToggle.addEventListener('click', () => {
        themeSwitch.checked = !themeSwitch.checked;
        toggleTheme();
      });
      
      function toggleTheme() {
        document.body.classList.toggle('dark-mode', themeSwitch.checked);
        // Update theme icons
        themeIcons.forEach(icon => {
          icon.textContent = themeSwitch.checked ? '🌙' : '☀️';
        });
        // Save theme preference
        localStorage.setItem('theme', themeSwitch.checked ? 'dark' : 'light');
      }
      
      // Initialize theme from localStorage or system preference
      function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
          themeSwitch.checked = true;
          document.body.classList.add('dark-mode');
          themeIcons.forEach(icon => icon.textContent = '🌙');
        } else {
          themeSwitch.checked = false;
          document.body.classList.remove('dark-mode');
          themeIcons.forEach(icon => icon.textContent = '☀️');
        }
      }

      // --- Helper: factorial
      function factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
      }

      //--- Helper: format display
      function formatExpressionForDisplay(expr) {
        return expr
          .replace(/Math\.sin\(/g, 'sin(')
          .replace(/Math\.cos\(/g, 'cos(')
          .replace(/Math\.tan\(/g, 'tan(')
          .replace(/Math\.asin\(/g, 'sin⁻¹(')
          .replace(/Math\.acos\(/g, 'cos⁻¹(')
          .replace(/Math\.atan\(/g, 'tan⁻¹(')
          .replace(/Math\.log\(/g, 'ln(')
          .replace(/Math\.log10\(/g, 'log(')
          .replace(/Math\.sqrt\(/g, '√(')
          .replace(/Math\.PI/g, 'π')
          .replace(/Math\.E/g, 'e')
          .replace(/factorial\(/g, '!(')
          .replace(/\*\*/g, '^')
          .replace(/Math\.pow\(([^,]+),([^)]+)\)/g, '$1^$2');
      }

      //--- Display updater
      function updateDisplay() {
        display.value = rawExpression ? formatExpressionForDisplay(rawExpression) : '0';
        equalBtn.disabled = !rawExpression.trim();
      }

      //--- Button visual effect
      function clickEffect(btn) {
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 100);
      }

      //--- Scientific button handler
      function handleScientificInput(value) {
        // x^y | Just insert ** for caret, for user to type after
        if (value === "Math.pow(,") {
          rawExpression += "**";
          updateDisplay();
          return;
        }
        rawExpression += value;
        if (value.endsWith("(")) openBrackets++;
        updateDisplay();
      }

      //--- Add button value to expression
      function appendToExpression(value) {
        const lastChar = rawExpression.slice(-1);

        if (value.startsWith("Math.") || value === "factorial(") {
          handleScientificInput(value);
          return;
        }

        if (value === '(') {
          if (!lastChar || /[+\-*/(]/.test(lastChar)) {
            rawExpression += value;
            openBrackets++;
          }
        } else if (value === ')') {
          if (openBrackets > 0 && /[0-9)]/.test(lastChar)) {
            rawExpression += value;
            openBrackets--;
          }
        } else if (/[+\-*/]/.test(value)) {
          if (value === '-' && lastChar === '(') {
            rawExpression += value;
          } else if (/[+\-*/]/.test(lastChar)) {
            return;
          } else if (rawExpression !== '') {
            rawExpression += value;
          }
        } else {
          rawExpression += value;
        }
        updateDisplay();
      }

      //--- Evaluate/calculate
      function calculate() {
        if (!rawExpression.trim()) return;
        try {
          if (openBrackets > 0) {
            rawExpression += ')'.repeat(openBrackets);
            openBrackets = 0;
          }
          // Support 5! notation
          let evalExpression = rawExpression.replace(/(\d+)!/g, "factorial($1)").replace(/\^/g, '**');
          window.factorial = factorial; // global binding to eval

          const result = eval(evalExpression);

          let output;
          if (Number.isInteger(result)) output = result.toString();
          else output = result.toFixed(8).replace(/\.?0+$/, '');

          // Add to history (top, keep max 20)
          calculationHistory.unshift({
            expression: rawExpression,
            result: output.length > 12 ? result.toExponential(5) : output
          });
          if (calculationHistory.length > 20) calculationHistory.pop();
          updateHistoryDisplay();

          rawExpression = output.length > 12 ? result.toExponential(5) : output;
          updateDisplay();
        } catch {
          rawExpression = '';
          display.value = 'Error';
        }
      }

      //--- Backspace/delete
      function backspace() {
        // Remove a whole function or just a char
        const patterns = [
          { pattern: /Math\.sin\($/, length: 9 },
          { pattern: /Math\.cos\($/, length: 9 },
          { pattern: /Math\.tan\($/, length: 9 },
          { pattern: /Math\.asin\($/, length: 10 },
          { pattern: /Math\.acos\($/, length: 10 },
          { pattern: /Math\.atan\($/, length: 10 },
          { pattern: /Math\.log\($/, length: 9 },
          { pattern: /Math\.log10\($/, length: 11 },
          { pattern: /Math\.sqrt\($/, length: 10 },
          { pattern: /Math\.PI$/, length: 7 },
          { pattern: /Math\.E$/, length: 5 },
          { pattern: /factorial\($/, length: 11 }
        ];
        let matched = false;
        for (const { pattern, length } of patterns) {
          if (pattern.test(rawExpression)) {
            rawExpression = rawExpression.slice(0, -length);
            matched = true;
            if (pattern.source.endsWith('\\($')) openBrackets--;
            break;
          }
        }
        if (!matched) {
          const lastChar = rawExpression.slice(-1);
          if (lastChar === '(') openBrackets--;
          if (lastChar === ')') openBrackets++;
          rawExpression = rawExpression.slice(0, -1);
        }
        updateDisplay();
      }

      //--- C button
      function clearDisplay() {
        rawExpression = '';
        openBrackets = 0;
        updateDisplay();
      }

      //--- Scientific mode
      function toggleScientificMode(show) {
        if (show) {
          sciContainer.classList.add('visible');
          calculator.style.width = '400px';
          currentMode = 'Scientific';
        } else {
          sciContainer.classList.remove('visible');
          calculator.style.width = '340px';
          currentMode = 'Basic';
        }
      }

      //--- Mode dropdown
      window.setMode = function(mode) {
        document.getElementById("dropdownText").textContent = mode;
        document.getElementById("modeDropdown").classList.remove("show");
        document.getElementById("dropdownArrow").classList.remove("rotate");
        toggleScientificMode(mode === 'Scientific');
      };
      window.toggleDropdown = function() {
        const menu = document.getElementById("modeDropdown");
        const arrow = document.getElementById("dropdownArrow");
        menu.classList.toggle("show");
        arrow.classList.toggle("rotate");
      };
      // Close dropdown when clicking outside
      document.addEventListener("click", function(event) {
        const dropdown = document.querySelector(".mode-toggle");
        const menu = document.getElementById("modeDropdown");
        const arrow = document.getElementById("dropdownArrow");
        if (dropdown && !dropdown.contains(event.target)) {
          menu.classList.remove("show");
          arrow.classList.remove("rotate");
        }
      });
      // --- END dropdown logic ---

      //--- History sidebar panel
      function updateHistoryDisplay() {
        historyList.innerHTML = '';
        calculationHistory.forEach((item) => {
          const li = document.createElement('li');
          li.innerHTML = `
            <div>${formatExpressionForDisplay(item.expression)}</div>
            <div><strong>= ${item.result}</strong></div>
          `;
          li.addEventListener('click', () => {
            rawExpression = item.expression;
            updateDisplay();
            hamburgerToggle.checked = false; // close sidebar
          });
          historyList.appendChild(li);
        });
      }

      // Clear history button
      clearHistoryBtn.addEventListener('click', () => {
        calculationHistory = [];
        updateHistoryDisplay();
      });

      //--- Main button events
      buttons.forEach(button => {
        button.addEventListener('click', () => {
          clickEffect(button);
          const value = button.dataset.value;
          if (value === 'C') clearDisplay();
          else if (value === '=') calculate();
          else if (value === 'Backspace') backspace();
          else appendToExpression(value);
        });
      });
      sciButtons.forEach(button => {
        button.addEventListener('click', () => {
          if (currentMode !== 'Scientific') return;
          clickEffect(button);
          const value = button.dataset.value;
          appendToExpression(value);
        });
      });

      //--- Keyboard support
      document.addEventListener('keydown', (e) => {
        const key = e.key;
        const btn = [...buttons].find(b => b.dataset.value === key || 
          (key === 'Backspace' && b.dataset.value === 'Backspace'));
        const sciKeys = {
          's': 'Math.sin(',
          'c': 'Math.cos(',
          't': 'Math.tan(',
          'S': 'Math.asin(',
          'C': 'Math.acos(',
          'T': 'Math.atan(',
          'l': 'Math.log(',
          'L': 'Math.log10(',
          'q': 'Math.sqrt(',
          'p': 'Math.PI',
          'e': 'Math.E',
          '!': 'factorial('
        };
        // History shortcut
        if (key === 'h' || key === 'H') {
          hamburgerToggle.checked = !hamburgerToggle.checked;
          return;
        }
        // Theme toggle shortcut (Ctrl+T)
        if (e.ctrlKey && key.toLowerCase() === 't') {
          e.preventDefault();
          themeSwitch.checked = !themeSwitch.checked;
          toggleTheme();
          return;
        }
        // Sci keys
        if (sciKeys[key] && currentMode === 'Scientific') {
          e.preventDefault();
          appendToExpression(sciKeys[key]);
          return;
        }
        if (btn) clickEffect(btn);

        if (/[0-9+\-*/().]/.test(key)) {
          appendToExpression(key);
        } else if (key === 'Enter') {
          e.preventDefault();
          clickEffect(equalBtn);
          calculate();
        } else if (key === 'Backspace') {
          backspace();
        } else if (key.toLowerCase() === 'c') {
          clearDisplay();
        } else if (key === '^') {
          appendToExpression('**');
        }
      });

      //--- Initialize
      toggleScientificMode(false); // Default: Basic mode
      initTheme(); // Initialize theme
      updateDisplay();
      updateHistoryDisplay();
    });
    let isDegToRad = true;

const convertAngleBtn = document.getElementById("convertAngle");
const display = document.getElementById("display");

convertAngleBtn.addEventListener("click", () => {
  let value = parseFloat(display.value);
  if (isNaN(value)) return;

  if (isDegToRad) {
    // Convert Degrees → Radians
    display.value = (value * Math.PI / 180).toFixed(6);
    convertAngleBtn.value = "Rad → Deg";
  } else {
    // Convert Radians → Degrees
    display.value = (value * 180 / Math.PI).toFixed(6);
    convertAngleBtn.value = "Deg → Rad";
  }

  isDegToRad = !isDegToRad;
});
function degToRad() {
  const val = parseFloat(display.value);
  if (!isNaN(val)) {
    display.value = (val * Math.PI / 180).toFixed(6);
  }
}
