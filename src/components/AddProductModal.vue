<script setup lang="ts">
import { ref, computed, defineEmits } from 'vue';
import type { Product } from "../interfaces/Product.ts"

const name = ref("");
const description = ref("");
const quantity = ref(0);
const purchaseDate = ref(new Date());
const expiryDate = ref(new Date());
const unitCost = ref(0);

const emit = defineEmits(['close', 'add-product']);

// TODO Add form control

async function addProduct() {
    if (name.value.trim() == "" || !quantity.value) {
        // TODO Give visual feedback when fields are empty
        return;
    }

    // @ts-ignore
    const products = await window.api.loadProducts();
    console.log(products);

    const product: Product = {
        id: products[products.length - 1].id + 1,
        name: name.value,
        description: description.value,
        quantity: quantity.value,
        purchaseDate: purchaseDate.value.toString(),
        expiryDate: expiryDate.value.toString(),
        cost: unitCost.value
    };

    // TODO Add a toast when an item has been submitted or to show errors
    emit('add-product', product); // Emit the product data
    closeModal();
}

const isFormValid = computed(() => {
    return name.value.trim() !== "" && quantity.value > 0
});

function closeModal() {
    emit('close');
}
</script>

<template>
    <div id="modal-container" class="modal-sm">
        <h2 id="form-header">Añadir producto</h2>
        <div id="form-container">
            <form id="product-form" @submit.prevent="addProduct">
                <div class="row">
                    <div class="form-group">
                        <label id="product-name-label" for="product-name-input" class="text-label">Nombre</label>
                        <input type="text" id="product-name-input" class="text-input form-control"
                            placeholder="Coca-Cola 2L" v-model="name">
                    </div>

                    <div class="form-group">
                        <label id="product-description-label" for="product-description-input"
                            class="text-label">Descripción</label>
                        <input type="text" id="product-description-input" class="text-input form-control"
                            placeholder="Botella de vidrio" v-model="description">
                    </div>

                    <div class="form-group">
                        <label id="product-quantity-label" for="product-quantity-input"
                            class="text-label">Unidades</label>
                        <input type="number" id="product-quantity-input" class="text-input form-control" placeholder="6"
                            v-model.number="quantity">
                    </div>
                </div>

                <div class="row">
                    <div class="form-group">
                        <label id="product-purchase-label" for="product-purchase-input" class="text-label">Fecha de
                            compra</label>
                        <input type="date" id="product-purchase-input" class="text-input form-control"
                            v-model="purchaseDate">
                    </div>

                    <div class="form-group">
                        <label id="product-expiry-label" for="product-expiry-input" class="text-label">Fecha de
                            vencimiento</label>
                        <input type="date" id="product-expiry-input" class="text-input form-control"
                            v-model="expiryDate">
                    </div>

                    <div class="form-group">
                        <label id="product-cost-label" for="product-cost-input" class="text-label">Costo</label>
                        <input type="number" id="product-cost-input" class="text-input form-control" placeholder="1500"
                            v-model.number="unitCost">
                    </div>
                </div>

                <button type="button" id="close-button" class="form-button btn btn-danger"
                    @click="closeModal">Cerrar</button>
                <button type="submit" id="submit-button" class="form-button btn btn-primary" :disabled="!isFormValid"
                    @click="addProduct">Guardar</button>
            </form>
        </div>
    </div>
</template>

<style scoped>
#modal-container {
    font-family: 'Roboto', sans-serif;
    font-size: 18px;
    background-color: #2d2d2d;
    color: #f2f2f2;
    text-align: center;
    padding-top: 10px;
    margin: 0 33%;
    border-radius: 5px;
}

#form-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1em;
    justify-content: center;
    align-content: center;
    align-items: center;
    padding: 5px 25px 25px 25px;
}

#product-form {
    display: contents;
}

.form-group,
.form-button {
    display: flex;
    flex-direction: column;
    grid-column: span 1;
    text-align: left;
    margin: 12px 0;
}

.text-label {
    margin-bottom: 2px;
}

.text-input {
    grid-column: span 1;
    border: none;
    background-color: #3a3a3a; /* Darker background for contrast */
    color: #f2f2f2; /* Text color */
    border: 1px solid #555; /* Border color for contrast */
    padding: 5px 10px; /* Padding for spacing */
    border-radius: 4px; /* Rounded corners */
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.3); /* Subtle shadow for depth */
    appearance: none; /* Remove default styling */
    -webkit-appearance: none; /* Remove default styling for WebKit browsers */
    -moz-appearance: none; /* Remove default styling for Firefox */
    position: relative; /* Position relative for pseudo-element */
}

.text-input::placeholder{
    color: #b6b6b6;
}

.form-button {
    text-align: center;
    border: none;
}
</style>
