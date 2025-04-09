<script lang="ts">
import ProductListView from './views/ProductListView.vue'
import { Product } from './interfaces/Product'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

export default {
  components:{
    ProductListView
  },
  data() {
    return {
      newProduct: {
        name: '',
        description: '',
        quantity: 0,
        purchaseDate: new Date(),
        expiryDate: new Date(),
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
