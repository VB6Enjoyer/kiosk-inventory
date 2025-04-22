<!-- src/pages/CalculatorPage.vue -->
<template>
  <div class="calculator-view">
    <Calculator />
  </div>
</template>

<script>
import Calculator from '../components/Calculator.vue';

export default {
  name: 'CalculatorView',
  components: {
    Calculator
  }
}
</script>

<style scoped>
.calculator-view {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f0f0;
}
</style>