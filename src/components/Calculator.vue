<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { X, Minus } from 'lucide-vue-next';
import { electronAPI } from '../utilities/electronAPI';

const display = ref<string>("0");
const currentValue = ref<string | null>(null);
const previousValue = ref<string | null>(null);
const operator = ref<string | null>(null);
const waitingForOperand = ref<boolean>(false);
const currentOperation = ref<string>("");
const justEvaluated = ref<boolean>(false);

const buttons = [
  { label: '7', value: '7', type: 'number' },
  { label: '8', value: '8', type: 'number' },
  { label: '9', value: '9', type: 'number' },
  { label: '÷', value: '/', type: 'operator', title: 'Dividir (/)' },
  { label: '4', value: '4', type: 'number' },
  { label: '5', value: '5', type: 'number' },
  { label: '6', value: '6', type: 'number' },
  { label: '×', value: '*', type: 'operator', title: "Multiplicar (*)" },
  { label: '1', value: '1', type: 'number' },
  { label: '2', value: '2', type: 'number' },
  { label: '3', value: '3', type: 'number' },
  { label: '-', value: '-', type: 'operator', title: "Restar" },
  { label: '0', value: '0', type: 'number' },
  { label: '.', value: '.', type: 'decimal', title: "Decimal" },
  { label: '=', value: '=', type: 'equals', title: "Resultado (Enter)" },
  { label: '+', value: '+', type: 'operator', title: "Sumar" },
  { label: 'C', value: 'clear', type: 'clear', title: "Borrar todo (C)" },
];

function handleButton(btn) {
  if (display.value == "Syntax error") display.value = "0";
  if (!currentOperation.value && btn.type != "number") currentOperation.value += 0; // If there is no current operation and the button pressed is not a number, start the operation with 0

  if (currentOperation.value[currentOperation.value.length - 1] == "=") {
    currentOperation.value = display.value; // If the previous operation has been completed, continue operating with the result
    justEvaluated.value = true;
  }

  // If the button pressed is a decimal point:
  if (btn.label === ".") {
    // Split the current operation by operators to get the current number segment
    const segments = currentOperation.value.split(/[\+\-\*\/]/);
    const currentSegment = segments[segments.length - 1];
    if (currentSegment.includes(".")) {
      return; // If the current segment already contains a decimal, prevent adding another
    }
  }

  if (!(currentOperation.value == "0" && btn.label == "0")) currentOperation.value += btn.label; // If the current operation is not just "0" or the button pressed is not "0", append the button label
  if (currentOperation.value[0] == "0" && currentOperation.value[1] != "." && btn.type == "number") currentOperation.value = btn.label; // If the current operation starts with "0", the next character is not a decimal, and the button pressed is a number, replace the leading zero

  switch (btn.type) {
    case 'number':
      inputDigit(btn.value);
      if (justEvaluated.value) {
        currentOperation.value = display.value;
        justEvaluated.value = false;
      }
      break;
    case 'operator':
      if (justEvaluated.value) justEvaluated.value = false;
      if (["÷", "×", "-", "+"].includes(currentOperation.value[currentOperation.value.length - 2])) {
        currentOperation.value = currentOperation.value.slice(0, currentOperation.value.length - 2) + btn.label;
      } else {
        performOperation(btn.value);
      }
      break;
    case 'equals':
      if (["÷", "×", "-", "+"].includes(currentOperation.value[currentOperation.value.length - 2])) {
        currentOperation.value = currentOperation.value.slice(0, currentOperation.value.length - 1) + "0" + "=";
      }
      calculateResult();
      break;
    case 'clear':
      clearDisplay();
      break;
    case 'decimal':
      if (["÷", "×", "-", "+"].includes(currentOperation.value[currentOperation.value.length - 2])) {
        currentOperation.value = currentOperation.value.slice(0, currentOperation.value.length - 1)
      } else {
        inputDecimal();
      }
      break;
  }
}

function inputDigit(digit) {
  if (waitingForOperand.value) {
    display.value = digit;
    waitingForOperand.value = false;
  } else {
    display.value = display.value == '0' ? digit : display.value + digit;
  }
}

function inputDecimal() {
  if (waitingForOperand.value) {
    display.value = '0.';
    waitingForOperand.value = false;
  } else if (display.value.indexOf('.') === -1) {
    display.value += '.';
  }
}

function performOperation(nextOperator) {
  const inputValue = parseFloat(display.value);

  if (previousValue.value === null) {
    previousValue.value = inputValue.toString();
  } else if (operator.value) {
    calculateResult();
    previousValue.value = display.value;
  }

  waitingForOperand.value = true;
  operator.value = nextOperator;
}

function calculateResult() {
  try {
    // Evaluate the expression
    let result = eval(
      currentOperation.value
        .slice(0, currentOperation.value.length - 1)
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
    );
    // Fix floating point precision to 10 decimal places
    if (typeof result === "number") {
      // Remove trailing zeros after decimal point
      result = parseFloat(result.toFixed(10));
    }
    display.value = result;
    waitingForOperand.value = true;
  } catch (e) {
    display.value = "Error";
    waitingForOperand.value = true;
  }
}

function clearDisplay() {
  display.value = '0';
  previousValue.value = null;
  operator.value = null;
  waitingForOperand.value = false;
  currentOperation.value = "";
}

function hide() {
  electronAPI.minimizeCalculator();
}

function close() {
  electronAPI.closeCalculator();
}

function handleKeyboardEvent(e: KeyboardEvent) {
  // Map keyboard keys to calculator buttons
  const key = e.key;

  // Find the corresponding button object
  let btn: typeof buttons[number] | undefined = undefined;

  // Handle numbers
  if (/^[0-9]$/.test(key)) {
    btn = buttons.find(b => b.value === key && b.type === 'number');
  }
  // Handle operators
  else if (['+', '-', '*', '/', '÷', '×'].includes(key)) {
    // Accept both * and ×, / and ÷
    let op = key;
    if (key === '*') op = '×';
    if (key === '/') op = '÷';
    btn = buttons.find(b => b.label === op && b.type === 'operator');
  }
  // Handle decimal
  else if (key === '.' || key === ',') {
    btn = buttons.find(b => b.type === 'decimal');
  }
  // Handle Enter or = for equals
  else if (key === 'Enter' || key === '=') {
    btn = buttons.find(b => b.type === 'equals');
  }
  // Handle Backspace or Delete for clear
  else if (key === 'Backspace' || key === 'Delete' || key.toLowerCase() === 'c') {
    btn = buttons.find(b => b.type === 'clear');
  }

  if (btn) {
    e.preventDefault();
    handleButton(btn);
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyboardEvent);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboardEvent);
});

</script>

<template>
  <div class="calculator-container">
    <div id="button-container">
      <button id="hide-btn" class="btn window-btn" title="Minimizar" @click="hide">
        <Minus id="hide-icon" class="window-icon" />
      </button>
      <button id="close-btn" class="btn window-btn" title="Cerrar" @click="close">
        <X id="close-icon" class="window-icon" />
      </button>
    </div>

    <div class="display-container">
      <span id="current-operation">{{ currentOperation }}</span>
      <input type="text" id="calculator-input" :value="display" disabled>
    </div>

    <div class="keypad">
      <button v-for="btn in buttons" :key="btn.value" :title="btn.title || ''" @click="handleButton(btn)">{{ btn.label
      }}</button>
    </div>
  </div>
</template>

<style scoped>
.calculator-container {
  width: 330px;
  height: 545px;
  padding: 38px 25px;
  background-color: #23272f;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
  -webkit-app-region: drag;
  font-family: "JetBrains Mono", "Roboto", Helvetica, sans-serif;
}

button {
  cursor: pointer;
  -webkit-app-region: no-drag;
  color: #f1f1f1;
  transition: background-color 0.33s, color 0.33s;
}

button:hover {
  transition: background-color 0.33s, color 0.33s, border-color 0.33s;
}

#button-container {
  width: 100%;
  height: 30.5px;
  position: absolute;
  top: 0;
  right: 0;
  background-color: #1c2028;
}

.window-btn {
  position: absolute;
  top: 0;
  padding: 0;
  margin: 3px;
  background-color: transparent;
  height: 25px;
  width: 25px;
  border: none;
}

#close-btn {
  right: 0;
}

#close-btn:hover {
  background-color: #e3002c;
  color: #ffffff;
}

#hide-btn {
  right: 33px;
}

#hide-btn:hover {
  background-color: #3a3f48;
  color: #ffffff
}

.window-icon {
  color: #f1f1f1;
  width: 23px;
  height: 23px;
  float: inline-end;
  /* This centers the icon in the button, for some reason */
}

.display-container {
  margin-bottom: 15px;
  overflow: hidden;
  -webkit-app-region: no-drag;
}

#current-operation {
  display: block;
  min-height: 27px;
  font-size: 18px;
  color: #aaaaaa;
  text-align: right;
  user-select: none;
  -webkit-app-region: drag;
}

#calculator-input {
  color: #f1f1f1;
  background-color: #181c22;
  border: 1px solid #333a44;
  border-radius: 4px;
  padding: 20px 10px;
  text-align: right;
  font-size: 30px;
  height: 35px;
  -webkit-app-region: no-drag;
  margin: 0;
  width: 100%
}

.keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 10px;
}

.keypad>button {
  padding: 15px;
  font-size: 22px;
  border: 1px solid #333a44;
  border-radius: 4px;
  background-color: #2c313a;
}

.keypad>button:hover {
  background-color: #3a3f48;
}

button:active {
  background-color: #23272f;
}

button:nth-child(4):hover {
  /* ÷ button */
  border-color: #64b5f6;
}

button:nth-child(8):hover {
  /* X button */
  border-color: #ff9800;
}

button:nth-child(12):hover {
  /* - button */
  border-color: #e57373;
}

button:nth-child(15):hover {
  /* = button */
  border-color: #e9db5e;
}

button:nth-child(16):hover {
  /* + button */
  border-color: #81c784;
}

button:nth-child(17) {
  /* Clear button */
  grid-column: span 4;
  background-color: #ff6b6b;
  color: #fff;
  padding: 14.5px 15px;
  /* This line exists to have perfect distance between vertical edges and because I'm autistic as fuck */
}

button:nth-child(17):hover {
  background-color: #ff5252;
}
</style>