<script setup lang="ts">
import { ref, computed, reactive, defineEmits, watch, Ref } from 'vue';
import type { Product } from "../interfaces/Product.ts"
import { useFocusTrap } from '../utilities/focusTrap.ts';

const name = ref<string>("");
const description = ref<string>("");
const quantity = ref<number>(0);
const purchaseDate = ref<Date | String>(new Date());
const unknownPurchaseDate = ref<boolean>(false);
const expiryDate = ref<Date | String>(new Date());
const noExpiry = ref<boolean>(false);
const cost = ref<number>(0);

const modalRef = ref<HTMLElement | null>(null);
useFocusTrap(modalRef);

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

    if (unknownPurchaseDate) {
        purchaseDate.value = "N/A";
    }

    if (noExpiry) {
        expiryDate.value = "No expira";
    }

    // @ts-ignore
    const products = await window.api.loadProducts();

    const product: Product = {
        id: products.length + Date.now(),
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
    const purchaseValid = unknownPurchaseDate.value
        ? true
        : isValidDate(purchaseDate.value.toString(), false); // purchase date can be empty
    const expiryValid = noExpiry.value
        ? true
        : isValidDate(expiryDate.value.toString(), false); // must be non-empty and valid if not "No expira"
    return nameValid && quantityValid && purchaseValid && expiryValid;
});

function closeModal() {
    emit('close');
}

function preventNegative(event: Event, targetRef: Ref<number>) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove all non-digit and non-decimal point characters
    value = value.replace(/[^0-9.]/g, '');

    // Prevent multiple decimal points
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }

    // Remove leading zeros (unless it's "0" or "0.xxx")
    value = value.replace(/^0+(\d)/, '$1');

    // Prevent negative values (shouldn't be possible, but just in case)
    if (value && Number(value) < 0) {
        value = '0';
    }

    // If empty, set to '0'
    if (value === '' || isNaN(Number(value))) {
        value = '0';
    }

    input.value = value;
    targetRef.value = Number(value);
}

function preventInvalidKey(event: KeyboardEvent) {
    // Allow: Backspace, Tab, Arrow keys, Delete, Home, End, etc.
    const allowedKeys = [
        "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", "Home", "End"
    ];
    // Allow: period (for decimals), but only if not already present
    if (
        allowedKeys.includes(event.key) ||
        (event.key === "." && !(event.target as HTMLInputElement).value.includes("."))
    ) {
        return;
    }
    // Block: e, E, +, -, and anything that's not a digit
    if (
        event.key === "e" ||
        event.key === "E" ||
        event.key === "+" ||
        event.key === "-" ||
        !/^\d$/.test(event.key)
    ) {
        event.preventDefault();
    }
}

function onQuantityInput(event: Event) {
    preventNegative(event, quantity);
}

function onCostInput(event: Event) {
    preventNegative(event, cost);
}
</script>

<template>
    <div id="modal-container" class="modal-sm" ref="modalRef">
        <h2 id="form-header">Añadir producto</h2>

        <div id="form-container">
            <form id="product-form" @submit.prevent="addProduct">
                <div class="row">
                    <div class="form-group">
                        <label id="product-name-label" for="product-name-input" class="text-label">
                            Nombre
                            <span class="required-field" title="Requerido">*</span>
                        </label>

                        <input type="text" id="product-name-input" class="text-input form-control"
                            title="Nombre del producto" :class="{ 'input-error': errors.name }"
                            placeholder="Coca-Cola 2L" v-model="name" required>

                        <div class="error-container">
                            <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label id="product-description-label" for="product-description-input"
                            class="text-label">Descripción</label>

                        <input type="text" id="product-description-input" class="text-input form-control"
                            title="Descripción del producto" placeholder="Botella de vidrio" v-model="description">

                        <div class="error-container"></div>
                    </div>

                    <div class="form-group">
                        <label id="product-quantity-label" for="product-quantity-input" class="text-label">
                            Unidades <span class="required-field" title="Requerido">*</span>
                        </label>
                        <input type="number" id="product-quantity-input" class="text-input form-control"
                            :class="{ 'input-error': errors.quantity }" title="Unidades del producto" placeholder="6"
                            min="0" v-model.number="quantity" @input="onQuantityInput" @keydown="preventInvalidKey"
                            required>
                        <div class="error-container">
                            <span v-if="errors.quantity" class="error-message">{{ errors.quantity }}</span>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="form-group">
                        <label id="product-purchase-label" for="product-purchase-input" class="text-label">Fecha de
                            compra
                            <span class="required-field" title="Requerido">*</span>
                        </label>
                        <input type="date" id="product-purchase-input" class="text-input form-control"
                            title="Fecha de compra del producto" v-model="purchaseDate" :disabled="unknownPurchaseDate"
                            required>

                        <div class="date-checkbox-container">
                            <label id="unknown-purchase-date" class="date-checkbox-label"
                                for="unknown-purchase-date-checkbox"
                                title="La fecha de compra del producto es desconocida">
                                <input type="checkbox" id="unknown-purchase-date-checkbox" class="date-checkbox"
                                    v-model="unknownPurchaseDate">
                                <span id="unknown-purchase-date-span" class="date-checkbox-span">Desconocida</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label id="product-expiry-label" for="product-expiry-input" class="text-label">Fecha de
                            vencimiento
                            <span class="required-field" title="Requerido">*</span>
                        </label>
                        <input type="date" id="product-expiry-input" class="text-input form-control"
                            title="Fecha de vencimiento del producto" v-model="expiryDate" :disabled="noExpiry"
                            required>

                        <div class="date-checkbox-container">
                            <label id="no-expiry" class="date-checkbox-label" for="no-expiry-checkbox"
                                title="El producto no se vence">
                                <input type="checkbox" id="no-expiry-checkbox" class="date-checkbox" v-model="noExpiry">
                                <span id="no-expiry-span" class="date-checkbox-span">No expira</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label id="product-cost-label" for="product-cost-input" class="text-label">Costo</label>
                        <input type="number" id="product-cost-input" class="text-input form-control"
                            title="Costo del producto en ARS" placeholder="1500" min="0" v-model.number="cost"
                            @input="onCostInput" @keydown="preventInvalidKey">
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
    font-family: "Roboto", Helvetica, sans-serif;
    font-size: 18px;
    background-color: #2d2d2d;
    color: #f2f2f2;
    text-align: center;
    padding-top: 10px;
    margin: 0 33%;
    border-radius: 5px;
}

#form-header {
    user-select: none;
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
    user-select: none;
}

input {
    transition: border 0.33s, box-shadow 0.33s, background-color 0.33s;
}

input:focus {
    border: 1px solid #f2f2f2;
    box-shadow: 0 0 2px 0px #b6b6b6;
}

input[type="number"] {
    font-family: "Nunito", "Roboto", Helvetica, sans-serif;
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

.input-error {
    border: 1px solid #ff5252 !important;
    background-color: rgba(255, 82, 82, 0.1);
}

.input-error:focus {
    box-shadow: 0 0 2px 0px #ff5252;
}

.error-container {
    height: 12px;
}

.error-message {
    color: #ff5252;
    font-size: 12px;
    user-select: none;
}

.required-field {
    color: #ff5252;
    font-weight: bold;
    cursor: help;
}

.date-checkbox-container {
    height: 12px;
}

.date-checkbox-label {
    font-size: 16px;
    display: flex;
    padding-top: 2px;
    width: 40%;
    align-items: center;
}

.date-checkbox {
    width: 16px;
    margin-right: 5px;
    transform: scale(1.2);
    border: none;
    box-shadow: none;
}

.date-checkbox-span {
    padding: 0;
    margin-top: 2px;
    white-space: nowrap;
    user-select: none;
    -webkit-user-drag: none;
}

#close-button,
#submit-button {
    transition: box-shadow 0.33s, background-color 0.33s;
}

#close-button:hover {
    box-shadow: 0 0 2px 0 #ad263b;
}

#submit-button:hover {
    box-shadow: 0 0 2px 0 #195dca;
}
</style>