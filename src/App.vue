<script lang="ts">
import ProductListView from './views/ProductListView.vue'
import { Product } from './interfaces/Product'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import DollarValue  from "./components/DollarValue.vue"
import OptionsMenu from './components/OptionsMenu.vue';
import { ref } from 'vue';
import { Grip } from 'lucide-vue-next';

// TODO Localize fonts so they work offline
// TODO Implement a calculator?
// TODO Implement a dark/white mode button
// TODO Implement a battery-saving mode
// TODO Implement an exporter to Excel
// TODO Add CSS animations and the capacity to turn them off if necessary
// TODO Add keyboard shortcuts for different functions (esc to close modals and undo searches, for instance)

const isMenuOpen = ref<boolean>(false);

export default {
  components:{
    ProductListView,
    DollarValue,
    OptionsMenu,
    Grip
  },
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
    openMenu(e: Event){
      e.preventDefault();
      this.isMenuOpen = !this.isMenuOpen;
      console.log("chico")
    }
  }
}
</script>

<template>
  <div id="app">
    <div id="upper-bar">
      <DollarValue />
      <button id="option-modal-btn" class="btn" @click="openMenu($event)"><Grip id="grip-icon"/></button>
      <div v-if="isMenuOpen" class="modal-overlay">
        <OptionsMenu  />
      </div>
    </div>
    <h1>Inventario</h1>
    <ProductListView />
  </div>
</template>

<style>
/* Basic styling */
#app {
  font-family: Arial, sans-serif;
  text-align: center;
  margin-top: 40px;
  width: 100%;
  min-width: 90%;
  height: 100%;
  min-height: 90%;
}

#option-modal-btn{
    color: #ffffff;
    border: none;
    position: absolute;
    right: 5px;
    top: 5px;
}

#grip-icon {
    width: 40px;
    height: 40px;
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
