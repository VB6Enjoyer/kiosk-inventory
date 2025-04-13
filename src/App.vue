<script lang="ts">
import ProductListView from './views/ProductListView.vue'
import { Product } from './interfaces/Product'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import DollarValue  from "./components/DollarValue.vue"

// TODO Localize fonts so they work offline
// TODO Implement a calculator?
// TODO Implement a dark/white mode button
// TODO Implement a battery-saving mode
// TODO Implement an exporter to Excel

export default {
  components:{
    ProductListView,
    DollarValue
  },
  data() {
    return {
      newProduct: {
        name: '',
        description: '',
        quantity: 0,
        purchaseDate: "", // This was previously a new Date(), in case it throws an error later
        expiryDate: "",
        cost: 0
      } as Product,
      products: [] as Product[]
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
      };
    }
  },
}
</script>

<template>
  <div id="app">
    <DollarValue />
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
