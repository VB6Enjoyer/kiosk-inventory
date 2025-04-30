<script setup lang="ts">
import Calculator from '../components/Calculator.vue';
</script>

<template>
  <div class="calculator-view">
    <Calculator />
  </div>
</template>

<style scoped>
.calculator-view {
  display: flex;
  position: absolute;
  left: 0;
  top: 0;
  height: 100vh;
  background-color: transparent;
  padding: 0;
  margin: 0;
  overflow: hidden !important;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
</style>