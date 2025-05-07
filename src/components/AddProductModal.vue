<script setup lang="ts">
import { ref, computed, reactive, defineEmits, watch } from 'vue';
import type { Product } from "../interfaces/Product.ts"

const name = ref<string>("");
const description = ref<string>("");
const quantity = ref<number>(0);
const purchaseDate = ref<Date>(new Date());
const expiryDate = ref<Date | String>(new Date());
const noExpiry = ref<boolean>(false);
const cost = ref<number>(0);

// TODO Implement no expiry to products

// Form validation state
const errors = reactive({
    name: "",
    quantity: ""
});

// Update validation in real-time
watch(name, (newValue) => {
    if (newValue.trim() === "") {
        errors.name = "El nombre es requerido";
    } else {
        errors.name = "";
    }
});

watch(quantity, (newValue) => {
    if (!newValue || newValue <= 0) {
        errors.quantity = "La cantidad debe ser mayor que 0";
    } else {
        errors.quantity = "";
    }
});

const emit = defineEmits(['close', 'add-product']);

async function addProduct() {
    // Final validation check before submission
    if (name.value.trim() === "") {
        errors.name = "El nombre es requerido";
    }

    if (!quantity.value || quantity.value <= 0) {
        errors.quantity = "La cantidad debe ser mayor que 0";
    }

    if (name.value.trim() === "" || !quantity.value || quantity.value <= 0) {
        return;
    }

    if (noExpiry) {
        expiryDate.value = "No expira";
    }

    // @ts-ignore
    const products = await window.api.loadProducts();

    const product: Product = {
        id: products[products.length - 1].id + 1,
        name: name.value.trim(),
        description: description.value.trim(),
        quantity: quantity.value,
        purchaseDate: purchaseDate.value.toString(),
        expiryDate: expiryDate.value.toString(),
        cost: cost.value
    };

    emit('add-product', product); // Emit the product data
    closeModal();
}

function isValidDate(dateValue: string | Date | null, allowEmpty = false): boolean {
    if ((!dateValue || dateValue === "") && allowEmpty) return true;
    if (!dateValue || dateValue === "No expira") return allowEmpty;
    let dateStr = typeof dateValue === "string" ? dateValue : dateValue?.toISOString().slice(0, 10);
    if (!dateStr) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() + 1 === month &&
        date.getUTCDate() === day
    );
}

const isFormValid = computed(() => {
    const nameValid = name.value.trim() !== "";
    const quantityValid = quantity.value > 0;
    const purchaseValid = isValidDate(purchaseDate.value, true); // purchase date can be empty
    const expiryValid = noExpiry.value
        ? true
        : isValidDate(expiryDate.value.toString(), false); // must be non-empty and valid if not "No expira"
    return nameValid && quantityValid && purchaseValid && expiryValid;
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
                        <label id="product-name-label" for="product-name-input" class="text-label">
                            Nombre <span class="required-field">*</span>
                        </label>
                        <input type="text" id="product-name-input" class="text-input form-control"
                            :class="{ 'input-error': errors.name }" placeholder="Coca-Cola 2L" v-model="name" required>
                        <div class="error-container">
                            <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label id="product-description-label" for="product-description-input"
                            class="text-label">Descripción</label>
                        <input type="text" id="product-description-input" class="text-input form-control"
                            placeholder="Botella de vidrio" v-model="description">
                        <div class="error-container"></div>
                    </div>

                    <div class="form-group">
                        <label id="product-quantity-label" for="product-quantity-input" class="text-label">
                            Unidades <span class="required-field">*</span>
                        </label>
                        <input type="number" id="product-quantity-input" class="text-input form-control"
                            :class="{ 'input-error': errors.quantity }" placeholder="6" v-model.number="quantity"
                            required>
                        <div class="error-container">
                            <span v-if="errors.quantity" class="error-message">{{ errors.quantity }}</span>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="form-group">
                        <label id="product-purchase-label" for="product-purchase-input" class="text-label">Fecha de
                            compra</label>
                        <input type="date" id="product-purchase-input" class="text-input form-control"
                            v-model="purchaseDate">
                        <div class="error-container"></div>
                    </div>

                    <div class="form-group">
                        <label id="product-expiry-label" for="product-expiry-input" class="text-label">Fecha de
                            vencimiento <span class="required-field">*</span></label>
                        <input type="date" id="product-expiry-input" class="text-input form-control"
                            v-model="expiryDate" :disabled="noExpiry" required>
                        <div class="no-expiry-container">
                            <label id="no-expiry" for="no-expiry-checkbox">
                                <input type="checkbox" id="no-expiry-checkbox" v-model="noExpiry">
                                <span id="no-expiry-span">No expira</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label id="product-cost-label" for="product-cost-input" class="text-label">Costo</label>
                        <input type="number" id="product-cost-input" class="text-input form-control" placeholder="1500"
                            v-model.number="cost">
                        <div class="error-container"></div>
                    </div>
                </div>

                <button type="button" id="close-button" class="form-button btn btn-danger"
                    @click="closeModal">Cerrar</button>
                <button type="submit" id="submit-button" class="form-button btn btn-primary"
                    :disabled="!isFormValid">Guardar</button>
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
    background-color: #3a3a3a;
    color: #f2f2f2;
    border: 1px solid #555;
    padding: 5px 10px;
    border-radius: 4px;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    position: relative;
}

.text-input::placeholder {
    color: #b6b6b6;
}

.form-button {
    text-align: center;
    border: none;
    margin-top: 0;
}

/* Form validation styles */
.input-error {
    border: 1px solid #ff5252 !important;
    background-color: rgba(255, 82, 82, 0.1);
}

.error-container {
    height: 12px;
}

.error-message {
    color: #ff5252;
    font-size: 12px;
}

.required-field {
    color: #ff5252;
    font-weight: bold;
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
    width: 16px;
    margin-right: 5px;
    transform: scale(1.2);
}

#no-expiry-span {
    padding: 0;
    margin-top: 2px;
    white-space: nowrap;
}
</style>