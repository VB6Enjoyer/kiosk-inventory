<script setup lang="ts">
import { ref, computed, defineEmits } from 'vue';
import { Clipboard } from 'lucide-vue-next';
import { AdvancedSearch } from '../interfaces/AdvancedSearch.ts';

const name = ref<string>("");
const exactName = ref<boolean>(false);
const description = ref<string>("");
const exactDescription = ref<boolean>(false);
const quantityMin = ref<number>(0);
const quantityMax = ref<number>(0);
const purchaseDateMin = ref<Date | string>("");
const purchaseDateMax = ref<Date | string>("");
const expiryDateMin = ref<Date | string>("");
const expiryDateMax = ref<Date | string>("");
const noExpiry = ref<boolean>(false);
const costMin = ref<number>(0);
const costMax = ref<number>(0);

const emit = defineEmits(['close', 'advanced-search']);

// TODO Add form control
// TODO Save fields once the advanced search is closed so that they load with the modal after using it once
// TODO Add a "clear all fields" button

async function advancedSearch() {
    // TODO Give visual feedback when fields are empty
    // TODO Don't allow search with empty fields

    // @ts-ignore
    const products = await window.api.loadProducts();

    // TODO The search function for dates as ranges is... probably stupid. Should better just seek purchase-expiry ranges instead.
    const advancedSearch: AdvancedSearch = {
        name: name.value.trim(),
        exactName: exactName.value,
        description: description.value.trim(),
        exactDescription: exactDescription.value,
        quantityMin: quantityMin.value,
        quantityMax: quantityMax.value,
        purchaseDateMin: purchaseDateMin.value.toString() || "",
        purchaseDateMax: purchaseDateMax.value.toString() || "",
        expiryDateMin: expiryDateMin.value.toString() || "",
        expiryDateMax: expiryDateMax.value.toString() || "",
        noExpiry: noExpiry.value || false,
        costMin: costMin.value,
        costMax: costMax.value,
    };

    // TODO Add a toast when an item has been submitted or to show errors
    emit('advanced-search', advancedSearch); // Emit the product data
    closeModal();
}

function copyValue(e: Event, field: string) {
    e.preventDefault();
    // TODO Consider assigning the min value to the max in cost when the min surpasses the max, since it might be better than just copying
    switch (field) {
        case "quantity":
            quantityMax.value = quantityMin.value;
            break;
        case "purchaseDate":
            purchaseDateMax.value = purchaseDateMin.value;
            break;
        case "expiryDate":
            expiryDateMax.value = expiryDateMin.value;
            break;
        case "cost":
            costMax.value = costMin.value;
            break;
    }
}

// TODO Implement basic form validation here
const isFormValid = computed(() => {
    return true;
});

function closeModal() {
    emit('close');
}
</script>

<template>
    <div id="modal-container" class="modal-sm">
        <h2 id="form-header">Búsqueda avanzada</h2>
        <div id="form-container">
            <form id="product-form" @submit.prevent="advancedSearch">
                <div class="row">
                    <div class="form-group">
                        <label id="product-name-label" for="product-name-input" class="text-label">Nombre</label>
                        <div class="input-with-checkbox">
                            <input type="text" id="product-name-input" class="text-input form-control"
                                placeholder="Coca-Cola 2L" v-model="name">
                            <label id="name-exact-search-label" class="checkbox-label form-checkbox-label"
                                for="name-exact-search">
                                <input type="checkbox" id="name-exact-search" class="checkbox" v-model="exactName" />
                                Exacto
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label id="product-description-label" for="product-description-input"
                            class="text-label">Descripción</label>
                        <div class="input-with-checkbox">
                            <input type="text" id="product-description-input" class="text-input form-control"
                                placeholder="Botella de vidrio" v-model="description">
                            <label id="description-exact-search-label" class="checkbox-label form-checkbox-label"
                                for="description-exact-search">
                                <input type="checkbox" id="description-exact-search" class="checkbox"
                                    v-model="exactDescription" />
                                Exacto
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label id="product-quantity-label" for="product-quantity-min-input product-quantity-max-input"
                            class="text-label">Unidades</label>
                        <div class="range-group">
                            <input type="number" id="product-quantity-min-input"
                                class="text-input form-control small-input" placeholder="2"
                                v-model.number="quantityMin">
                            <span class="hyphen">-</span>
                            <input type="number" id="product-quantity-max-input"
                                class="text-input form-control small-input" placeholder="15"
                                v-model.number="quantityMax">
                            <button class="btn copy-btn" @click="copyValue($event, 'quantity')">
                                <Clipboard />
                            </button>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="form-group">
                        <label id="product-purchase-label" for="product-purchase-min-input product-purchase-max-input"
                            class="text-label">Fecha de compra</label>
                        <div class="range-group">
                            <input type="date" id="product-purchase-min-input"
                                class="text-input form-control small-input" v-model="purchaseDateMin">
                            <span class="separation-letter">a</span>
                            <input type="date" id="product-purchase-max-input"
                                class="text-input form-control small-input" v-model="purchaseDateMax">
                            <button class="btn copy-btn" @click="copyValue($event, 'purchaseDate')">
                                <Clipboard />
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label id="product-expiry-label" for="product-expiry-min-input product-expiry-max-input"
                            class="text-label">Fecha de vencimiento</label>
                        <div class="range-group">
                            <input type="date" id="product-expiry-min-input" class="text-input form-control small-input"
                                v-model="expiryDateMin" :disabled="noExpiry">
                            <span class="separation-letter">a</span>
                            <input type="date" id="product-expiry-max-input" class="text-input form-control small-input"
                                v-model="expiryDateMax" :disabled="noExpiry">
                            <button class="btn copy-btn" @click="copyValue($event, 'expiryDate')" :disabled="noExpiry">
                                <Clipboard />
                            </button>
                        </div>
                        <div class="no-expiry-container">
                            <label id="no-expiry" for="no-expiry-checkbox">
                                <input type="checkbox" id="no-expiry-checkbox" v-model="noExpiry">
                                <span id="no-expiry-span">No expira</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label id="product-cost-label" for="product-cost-input" class="text-label">Costo</label>
                        <div class="range-group range-group-number">
                            <input type="number" id="product-cost-min-input" class="text-input form-control small-input"
                                placeholder="700" v-model.number="costMin">
                            <span class="hyphen">-</span>
                            <input type="number" id="product-cost-max-input" class="text-input form-control small-input"
                                placeholder="1800" v-model.number="costMax">
                            <button class="btn copy-btn" @click="copyValue($event, 'cost')">
                                <Clipboard />
                            </button>
                        </div>
                    </div>
                </div>

                <button type="button" id="close-button" class="form-button btn btn-danger"
                    @click="closeModal">Cerrar</button>
                <button type="submit" id="submit-button" class="form-button btn btn-primary" :disabled="!isFormValid"
                    @click="advancedSearch">Buscar</button>
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
    margin: 0 25%;
    border-radius: 5px;
    width: 100%;
}

.checkbox,
.checkbox-label {
    display: inline-block;
    vertical-align: middle;
}

.checkbox {
    width: 20px;
    margin: 0;
    padding: 0;
    vertical-align: middle;
}

.checkbox-label {
    width: 50%;
}

.form-checkbox-label {
    width: 20%;
}

#form-container {
    display: grid;
    grid-template-columns: repeat(2, 2fr);
    gap: 2em;
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
    background-color: #3a3a3a;
    /* Darker background for contrast */
    color: #f2f2f2;
    /* Text color */
    border: 1px solid #555;
    /* Border color for contrast */
    padding: 5px 10px;
    /* Padding for spacing */
    border-radius: 4px;
    /* Rounded corners */
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
    /* Subtle shadow for depth */
    appearance: none;
    /* Remove default styling */
    -webkit-appearance: none;
    /* Remove default styling for WebKit browsers */
    -moz-appearance: none;
    /* Remove default styling for Firefox */
    position: relative;
    /* Position relative for pseudo-element */
}

.text-input::placeholder {
    color: #b6b6b6;
}

.form-button {
    text-align: center;
    border: none;
}

.range-group {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 87.5%
}

.small-input {
    width: 42.5%;
    margin: 0;
}

.small-input[type="date"] {
    width: 37.5%;
}

.hyphen,
.separation-letter {
    align-self: center;
}

.hyphen {
    transform: scale(200%);
}

#product-name-input,
#product-description-input {
    width: 80%;
}

.input-with-checkbox {
    display: flex;
    flex-direction: row;
    vertical-align: middle;
    align-items: center;
}

.copy-btn {
    color: #c9c9c9;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
}

.copy-btn:hover {
    color: white;
}

.no-expiry-container {
    height: 12px;
}

#no-expiry {
    font-size: 16px;
    display: flex;
    padding-top: 2px;
    width: 40%;
    align-items: center;
}

#no-expiry-checkbox {
    width: 20px;
    margin: 0;
    padding: 0;
    vertical-align: middle;
}

#no-expiry-span {
    padding: 0;
    margin-top: 2px;
    white-space: nowrap;
}
</style>