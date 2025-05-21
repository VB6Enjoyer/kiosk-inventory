<script lang="ts">
import { Product } from './interfaces/Product'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { ref } from 'vue';
import './style.css'

const isMenuOpen = ref<boolean>(false);

export default {
  data() {
    return {
      isMenuOpen: false,
      newProduct: {
        name: '',
        description: '',
        quantity: 0,
        purchaseDate: "", // This was previously a new Date(), in case it throws an error later
        expiryDate: "",
        cost: 0
      } as Product,
      products: [] as Product[],
    }
  },
  methods: {
    resetNewProduct() {
      this.newProduct = {
        name: '',
        description: '',
        quantity: 0,
        purchaseDate: '',
        expiryDate: '',
        unitCost: 0
      }
    },
    openMenu(e: Event) {
      e.preventDefault();
      this.isMenuOpen = true;;
    },
    closeMenu() {
      this.isMenuOpen = false;
    }
  }
}
</script>

<template>
  <div id="app">
    <router-view id="view" />
  </div>
</template>

<style>
/* Basic styling */
#app {
  font-family: Arial, sans-serif;
  text-align: center;
  margin-top: 0px;
  width: 100%;
  min-width: 92.5%;
  height: 100%;
  min-height: 92.5%;
  overflow: visible !important;
  scrollbar-width: thin !important;
  -ms-overflow-style: thin !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
  z-index: 1000;
}

input {
  padding: 8px;
  width: 300px;
  margin-right: 10px;
}

button {
  padding: 8px 12px;
}

ul {
  list-style: none;
  padding: 0;
}
</style>
