<!-- src/components/Calculator.vue -->
<template>
  <div class="calculator">
    <div class="display">{{ display }}</div>
    <div class="keypad">
      <button v-for="btn in buttons" :key="btn.value" @click="handleButton(btn)">
        {{ btn.label }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Calculator',
  data() {
    return {
      display: '0',
      currentValue: null,
      previousValue: null,
      operator: null,
      waitingForOperand: false,
      buttons: [
        { label: '7', value: '7', type: 'number' },
        { label: '8', value: '8', type: 'number' },
        { label: '9', value: '9', type: 'number' },
        { label: '÷', value: '/', type: 'operator' },
        { label: '4', value: '4', type: 'number' },
        { label: '5', value: '5', type: 'number' },
        { label: '6', value: '6', type: 'number' },
        { label: '×', value: '*', type: 'operator' },
        { label: '1', value: '1', type: 'number' },
        { label: '2', value: '2', type: 'number' },
        { label: '3', value: '3', type: 'number' },
        { label: '-', value: '-', type: 'operator' },
        { label: '0', value: '0', type: 'number' },
        { label: '.', value: '.', type: 'decimal' },
        { label: '=', value: '=', type: 'equals' },
        { label: '+', value: '+', type: 'operator' },
        { label: 'C', value: 'clear', type: 'clear' },
      ]
    };
  },
  methods: {
    handleButton(btn) {
      switch (btn.type) {
        case 'number':
          this.inputDigit(btn.value);
          break;
        case 'operator':
          this.performOperation(btn.value);
          break;
        case 'equals':
          this.calculateResult();
          break;
        case 'clear':
          this.clearDisplay();
          break;
        case 'decimal':
          this.inputDecimal();
          break;
      }
    },
    inputDigit(digit) {
      if (this.waitingForOperand) {
        this.display = digit;
        this.waitingForOperand = false;
      } else {
        this.display = this.display === '0' ? digit : this.display + digit;
      }
    },
    inputDecimal() {
      if (this.waitingForOperand) {
        this.display = '0.';
        this.waitingForOperand = false;
      } else if (this.display.indexOf('.') === -1) {
        this.display += '.';
      }
    },
    performOperation(nextOperator) {
      const inputValue = parseFloat(this.display);
      
      if (this.previousValue === null) {
        this.previousValue = inputValue;
      } else if (this.operator) {
        const result = this.calculate(this.previousValue, inputValue, this.operator);
        this.display = String(result);
        this.previousValue = result;
      }
      
      this.waitingForOperand = true;
      this.operator = nextOperator;
    },
    calculate(firstOperand, secondOperand, operator) {
      switch (operator) {
        case '+': return firstOperand + secondOperand;
        case '-': return firstOperand - secondOperand;
        case '*': return firstOperand * secondOperand;
        case '/': return firstOperand / secondOperand;
        default: return secondOperand;
      }
    },
    calculateResult() {
      const inputValue = parseFloat(this.display);
      
      if (this.previousValue !== null && this.operator) {
        const result = this.calculate(this.previousValue, inputValue, this.operator);
        this.display = String(result);
        this.previousValue = null;
        this.operator = null;
        this.waitingForOperand = true;
      }
    },
    clearDisplay() {
      this.display = '0';
      this.previousValue = null;
      this.operator = null;
      this.waitingForOperand = false;
    }
  }
};
</script>

<style scoped>
.calculator {
  width: 280px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.display {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  text-align: right;
  font-size: 24px;
  height: 30px;
  overflow: hidden;
}

.keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 10px;
}

button {
  padding: 15px;
  font-size: 18px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #eee;
}

button:active {
  background-color: #ddd;
}

button:nth-child(17) {
  grid-column: span 4;
  background-color: #ff6b6b;
  color: white;
}

button:nth-child(17):hover {
  background-color: #ff5252;
}
</style>