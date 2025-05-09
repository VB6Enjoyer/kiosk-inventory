<script setup lang="ts">
import { ref, computed, defineEmits, Ref } from 'vue';
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

const numRefMap = { quantityMin, quantityMax, costMin, costMax };

const purchaseDateMinError = computed(() =>
    getDateInputError({
        value: purchaseDateMin.value,
        pairValue: purchaseDateMax.value,
        isMin: true
    })
);
const purchaseDateMaxError = computed(() =>
    getDateInputError({
        value: purchaseDateMax.value,
        pairValue: purchaseDateMin.value,
        isMin: false
    })
);
const expiryDateMinError = computed(() =>
    getDateInputError({
        value: expiryDateMin.value,
        pairValue: expiryDateMax.value,
        isMin: true,
        rangeEnabled: !noExpiry.value
    })
);
const expiryDateMaxError = computed(() =>
    getDateInputError({
        value: expiryDateMax.value,
        pairValue: expiryDateMin.value,
        isMin: false,
        rangeEnabled: !noExpiry.value
    })
);

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

function isValidDate(dateString: string): boolean {
    if (!dateString) return true; // Allow empty (optional)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
    const [year, month, day] = dateString.split('-').map(Number);
    // Use Date.UTC to avoid timezone issues
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() + 1 === month &&
        date.getUTCDate() === day
    );
}

function isValidDateRange(min: string, max: string): boolean {
    // Both empty is valid (no filter)
    if (!min && !max) return true;
    // If only one is filled, invalid
    if (!min || !max) return false;
    // Both must be valid dates
    if (!isValidDate(min) || !isValidDate(max)) return false;
    // Max must be >= min
    return new Date(max) >= new Date(min);
}

function getDateInputError({
    value,
    pairValue,
    isMin,
    rangeEnabled = true
}: {
    value: string | Date,
    pairValue: string | Date,
    isMin: boolean,
    rangeEnabled?: boolean
}) {
    if (!rangeEnabled) return false;
    const v = value as string;
    const p = pairValue as string;
    // If this field is empty and the pair is filled, error
    if (!v && p) return true;
    // If this field is filled and invalid, error
    if (v && !isValidDate(v)) return true;
    // If both are filled and valid, and the range is invalid, error for both
    if (v && p && isValidDate(v) && isValidDate(p)) {
        if (isMin) return new Date(p) < new Date(v);
        else return new Date(value as string) < new Date(pairValue as string);
    }
    return false;
}

const isFormValid = computed(() => {
    // Purchase date range
    const purchaseDatesValid = isValidDateRange(
        purchaseDateMin.value as string,
        purchaseDateMax.value as string
    );

    // Expiry date range (only if noExpiry is false)
    const expiryDatesValid = noExpiry.value
        ? true
        : isValidDateRange(
            expiryDateMin.value as string,
            expiryDateMax.value as string
        );

    // Add other field validations as needed
    return purchaseDatesValid && expiryDatesValid;
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

function onNumInput(event: Event, field: string) {
    preventNegative(event, numRefMap[field]);
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
                                title="Nombre del producto" placeholder="Coca-Cola 2L" v-model="name">
                            <label id="name-exact-search-label" class="checkbox-label form-checkbox-label"
                                for="name-exact-search" title="Filtro para resultados exactos">
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
                                title="Descripción del producto" placeholder="Botella de vidrio" v-model="description">
                            <label id="description-exact-search-label" class="checkbox-label form-checkbox-label"
                                for="description-exact-search" title="Filtro para resultados exactos">
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
                                class="text-input form-control small-input" title="Cantidad mínima" placeholder="2"
                                min="0" v-model.number="quantityMin" @input="event => onNumInput(event, 'quantityMin')"
                                @keydown="preventInvalidKey">
                            <span class="hyphen">-</span>
                            <input type="number" id="product-quantity-max-input"
                                class="text-input form-control small-input" title="Cantidad máxima" placeholder="15"
                                min="0" v-model.number="quantityMax" @input="event => onNumInput(event, 'quantityMax')"
                                @keydown="preventInvalidKey">
                            <button class="btn copy-btn" title="Copiar valor mínimo al valor máximo"
                                @click="copyValue($event, 'quantity')">
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
                                class="text-input form-control small-input" title="Fecha de compra mínima"
                                v-model="purchaseDateMin" :class="{ 'input-error': purchaseDateMinError }">
                            <span class=" separation-letter">a</span>
                            <input type="date" id="product-purchase-max-input"
                                class="text-input form-control small-input" title="Fecha de compra máxima"
                                v-model="purchaseDateMax" :class="{ 'input-error': purchaseDateMaxError }">
                            <button class="btn copy-btn" title="Copiar fecha mínima a fecha máxima"
                                @click="copyValue($event, 'purchaseDate')">
                                <Clipboard />
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label id="product-expiry-label" for="product-expiry-min-input product-expiry-max-input"
                            class="text-label">Fecha de vencimiento</label>
                        <div class="range-group">
                            <input type="date" id="product-expiry-min-input" class="text-input form-control small-input"
                                title="Fecha de vencimiento mínima" v-model="expiryDateMin" :disabled="noExpiry"
                                :class="{ 'input-error': expiryDateMinError }">
                            <span class="separation-letter">a</span>
                            <input type="date" id="product-expiry-max-input" class="text-input form-control small-input"
                                title="Fecha de vencimiento máxima" v-model="expiryDateMax" :disabled="noExpiry"
                                :class="{ 'input-error': expiryDateMaxError }">
                            <button class="btn copy-btn" title="Copiar fecha mínima a fecha máxima"
                                @click="copyValue($event, 'expiryDate')" :disabled="noExpiry">
                                <Clipboard />
                            </button>
                        </div>
                        <div class="no-expiry-container">
                            <label id="no-expiry" for="no-expiry-checkbox" title="Filtrar solo productos que no vencen">
                                <input type="checkbox" id="no-expiry-checkbox" v-model="noExpiry">
                                <span id="no-expiry-span">No expira</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label id="product-cost-label" for="product-cost-input" class="text-label">Costo</label>
                        <div class="range-group range-group-number">
                            <input type="number" id="product-cost-min-input" class="text-input form-control small-input"
                                title="Costo mínimo en ARS" placeholder="700" min="0" v-model.number="costMin"
                                @input="event => onNumInput(event, 'costMin')" @keydown="preventInvalidKey">
                            <span class="hyphen">-</span>
                            <input type="number" id="product-cost-max-input" class="text-input form-control small-input"
                                title="Costo máximo en ARS" placeholder="1800" min="0" v-model.number="costMax"
                                @input="event => onNumInput(event, 'costMax')" @keydown="preventInvalidKey">
                            <button class="btn copy-btn" title="Copiar valor mínimo al valor máximo"
                                @click="copyValue($event, 'cost')">
                                <Clipboard />
                            </button>
                        </div>
                    </div>
                </div>

                <button type="button" id="close-button" class="form-button btn btn-danger"
                    @click="closeModal">Cerrar</button>
                <button type="submit" id="submit-button" class="form-button btn btn-primary"
                    :disabled="!isFormValid">Buscar</button>
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

.input-error {
    border: 2px solid #ff5252 !important;
    box-shadow: 0 0 4px #ff5252;
}
</style>