<script setup lang="ts">
import { ref, computed, reactive, defineEmits, watch, Ref, onMounted, onUnmounted } from 'vue';
import type { Product } from "../interfaces/Product.ts"
import { useFocusTrap } from '../utilities/focusTrap.ts';
import { useCurrentlyOpenModalStore } from '../stores/openModal.ts';

const name = ref<string>("");
const description = ref<string>("");
const quantity = ref<number>(0);
const purchaseDate = ref<Date | String>(new Date());
const unknownPurchaseDate = ref<boolean>(false);
const expiryDate = ref<Date | String>(new Date());
const noExpiry = ref<boolean>(false);
const cost = ref<number>(0);

const currentlyOpenModalStore = useCurrentlyOpenModalStore();

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
    if (!isFormValid.value) return;

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

function handleArrowKeys(event: KeyboardEvent, targetRef: Ref<number>) {
    if (event.key === "ArrowUp") {
        event.preventDefault();
        targetRef.value = (targetRef.value || 0) + 1;
    } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (targetRef.value > 0) {
            targetRef.value = targetRef.value - 1;
        }
    }
}

onMounted(() => {
    currentlyOpenModalStore.setModalOpen();

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            closeModal();
        }

        if (event.key === "Enter") {
            // Only submit if the modal is open and focused
            addProduct();
        }
    };
    window.addEventListener("keydown", handleKeydown);

    onUnmounted(() => {
        window.removeEventListener("keydown", handleKeydown);
        currentlyOpenModalStore.setModalClosed();
    });
});
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
                            min="0" v-model.number="quantity" @input="onQuantityInput"
                            @keydown="preventInvalidKey; handleArrowKeys" required>
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
                            @input="onCostInput" @keydown="preventInvalidKey; handleArrowKeys">
                        <div class="error-container"></div>
                    </div>
                </div>

                <div id="btn-container">
                    <button type="button" id="close-button" class="form-button btn btn-danger"
                        @click="closeModal">Cerrar</button>
                    <button type="submit" id="submit-button" class="form-button btn btn-primary"
                        :disabled="!isFormValid">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
#modal-container {
    font-family: "Roboto", Helvetica, sans-serif;
    font-size: clamp(0.9rem, 2vw, 1.125rem);
    /* Responsive font size */
    background-color: var(--modal-background-color);
    color: var(--text-color);
    text-align: center;
    padding-top: 10px;
    margin: 0 33%;
    /*margin: 0 auto;*/
    border-radius: 5px;
    width: 90%;
    max-width: 700px;
    /* Added max-width */
    min-width: 320px;
    /* Added min-width */
    max-height: 90vh;
    /* Added max-height */
    box-sizing: border-box;
    /* Include padding in width calculation */
}

#form-header {
    user-select: none;
    /*font-size: clamp(1rem, 3vw, 1.5rem);*/
}

#form-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: clamp(0.5em, 2vw, 1em);
    /* Responsive gap */
    justify-content: center;
    align-content: center;
    align-items: start;
    /* Changed from center to start */
    padding: 5px clamp(15px, 5vw, 25px) 25px;
    /* Responsive padding */
}

#product-form {
    display: contents;
}

.form-group {
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
    border: 1px solid var(--text-color);
    box-shadow: 0 0 2px 0px var(--input-focus-shadow);
}

input[type="number"] {
    font-family: "Nunito", "Roboto", Helvetica, sans-serif;
}

input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(var(--date-input-calendar-icon-value));
    cursor: pointer;
}

.text-input {
    grid-column: span 1;
    border: none;
    background-color: var(--text-input-background-color);
    color: var(--text-color);
    border: 1px solid var(--text-input-border-color);
    padding: clamp(4px, 1vw, 5px) clamp(8px, 2vw, 10px);
    border-radius: 4px;
    box-shadow: 0 0 5px var(--box-shadow-color);
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    position: relative;
    font-size: clamp(0.8rem, 2vw, 1rem);
    /* Responsive input font size */
    box-sizing: border-box;
    /* Include padding in width calculation */
}

.text-input::placeholder {
    color: var(--input-focus-shadow);
}

.form-button {
    text-align: center;
    border: none;
    margin-top: 0;
    padding: clamp(8px, 0vw, 12px) clamp(16px, 0vw, 24px);
    /* Responsive button padding */
    font-size: clamp(0.8rem, 2vw, 1rem);
    /* Responsive button font size */
}

.input-error {
    border: 1px solid var(--input-error-color) !important;
    background-color: var(--input-error-background-color);
}

.input-error:focus {
    box-shadow: 0 0 2px 0px var(--input-error-color);
}

.error-container {
    height: 12px;
}

.error-message {
    color: var(--input-error-color);
    font-size: clamp(0.7rem, 1.5vw, 0.75rem);
    /* Responsive error font size */
    user-select: none;
}

.required-field {
    color: var(--input-error-color);
    font-weight: bold;
    cursor: help;
}

.date-checkbox-container {
    height: 12px;
}

.date-checkbox-label {
    font-size: clamp(0.75rem, 1.8vw, 1rem);
    /* Responsive font size */
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
    font-size: clamp(0.75rem, 1.8vw, 1rem);
    /* Responsive font size */
}

#btn-container {
    display: flex;
    gap: 18px;
    margin: 0;
    grid-column: 1 / -1;
    /* Span all columns of the grid */
}

.form-button {
    flex: 1 1 0;
    /* Fill available space equally */
    text-align: center;
    margin-top: 0;
    padding: clamp(8px, 0vw, 12px) clamp(16px, 0vw, 24px);
    font-size: clamp(0.8rem, 2vw, 1rem);
}

#close-button,
#submit-button {
    transition: box-shadow 0.33s, background-color 0.33s;
}

#close-button:hover {
    box-shadow: 0 0 2px 0 var(--red-button-hover);
}

#submit-button:hover {
    box-shadow: 0 0 2px 0 var(--blue-button-hover);
}

/* Added responsive media queries */
@media (max-width: 768px) {
    #modal-container {
        width: 95%;
        margin: 0 auto;
    }

    #form-container {
        grid-template-columns: 1fr;
        /* Single column on mobile */
        gap: 0.33em;
        padding: 5px 15px 25px;
    }

    .form-group {
        margin: 12px auto;
    }

    .text-input {
        padding: 8px 12px;
    }
}

/* Added styles for small windows */
@media (max-height: 600px) {
    #modal-container {
        max-height: 95vh;
    }

    #form-header {
        margin-bottom: 0.5rem;
    }

    .form-group {
        margin: 8px 0;
    }

    .form-button {
        padding: 6px 16px;
    }

    .error-container,
    .date-checkbox-container {
        min-height: 8px;
    }
}

/* Added styles for very small screens */
@media (max-width: 480px) {
    #modal-container {
        width: 98%;
        padding-top: 5px;
    }

    #form-container {
        padding: 5px 10px 20px;
    }

    .text-input {
        padding: 6px 10px;
    }

    .form-button {
        padding: 8px 12px;
    }
}

/* Added styles for landscape orientation on small screens */
@media (max-height: 500px) and (orientation: landscape) {
    #modal-container {
        max-height: 98vh;
        padding-top: 2px;
    }

    #form-header {
        font-size: 1.2rem;
        margin-bottom: 0.3rem;
    }

    .form-group {
        margin: 5px 0;
    }

    .error-container,
    .date-checkbox-container {
        min-height: 6px;
    }
}
</style>