<script setup lang="ts">
import { ref, computed, defineEmits, Ref, onMounted, watch, onUnmounted } from 'vue';
import { Clipboard } from 'lucide-vue-next';
import { AdvancedSearch } from '../interfaces/AdvancedSearch.ts';
import { useFocusTrap } from '../utilities/focusTrap.ts';
import { useCurrentlyOpenModalStore } from '../stores/openModal.ts';

const name = ref<string>("");
const exactName = ref<boolean>(false);
const description = ref<string>("");
const exactDescription = ref<boolean>(false);
const quantityMin = ref<number>(0);
const quantityMax = ref<number>(0);
const purchaseDateMin = ref<Date | string>("");
const purchaseDateMax = ref<Date | string>("");
const unknownPurchaseDate = ref<boolean>(false);
const expiryDateMin = ref<Date | string>("");
const expiryDateMax = ref<Date | string>("");
const noExpiry = ref<boolean>(false);
const costMin = ref<number>(0);
const costMax = ref<number>(0);
const currentSearch = ref<AdvancedSearch | undefined>(undefined);
const modalRef = ref<HTMLElement | null>(null);

useFocusTrap(modalRef);

const currentlyOpenModalStore = useCurrentlyOpenModalStore();

const numRefMap = { quantityMin, quantityMax, costMin, costMax };

const props = defineProps<{
    currentSearch?: AdvancedSearch
}>();

const purchaseDateMinError = computed(() =>
    getDateInputError({
        value: purchaseDateMin.value,
        pairValue: purchaseDateMax.value,
        isMin: true,
        rangeEnabled: !unknownPurchaseDate.value
    })
);

const purchaseDateMaxError = computed(() =>
    getDateInputError({
        value: purchaseDateMax.value,
        pairValue: purchaseDateMin.value,
        isMin: false,
        rangeEnabled: !unknownPurchaseDate.value
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

async function advancedSearch() {
    if (!isFormValid.value) return;
    console.log(isFormValid.value)

    // @ts-ignore
    const products = await window.api.loadProducts();

    const advancedSearch: AdvancedSearch = {
        name: name.value.trim(),
        exactName: exactName.value,
        description: description.value.trim(),
        exactDescription: exactDescription.value,
        quantityMin: quantityMin.value,
        quantityMax: quantityMax.value,
        purchaseDateMin: purchaseDateMin.value.toString() || "",
        purchaseDateMax: purchaseDateMax.value.toString() || "",
        unknownPurchaseDate: unknownPurchaseDate.value || false,
        expiryDateMin: expiryDateMin.value.toString() || "",
        expiryDateMax: expiryDateMax.value.toString() || "",
        noExpiry: noExpiry.value || false,
        costMin: costMin.value,
        costMax: costMax.value,
    };

    emit('advanced-search', advancedSearch); // Emit the product data
    closeModal();
}

function copyValue(e: Event, field: string) {
    e.preventDefault();

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
    const purchaseDatesValid = unknownPurchaseDate.value
        ? true
        : isValidDateRange(
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

    // Allow empty value (do not force to '0')
    input.value = value;

}

function preventInvalidKey(event: KeyboardEvent) {
    // Allow: Enter, Backspace, Tab, Arrow keys, Delete, Home, End, etc.
    const allowedKeys = [
        "Enter", "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", "Home", "End"
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
    if (currentSearch) {
        // Load all saved search values
        name.value = props.currentSearch?.name || "";
        exactName.value = props.currentSearch?.exactName || false;
        description.value = props.currentSearch?.description || "";
        exactDescription.value = props.currentSearch?.exactDescription || false;
        quantityMin.value = props.currentSearch?.quantityMin || 0;
        quantityMax.value = props.currentSearch?.quantityMax || 0;
        purchaseDateMin.value = props.currentSearch?.purchaseDateMin || "";
        purchaseDateMax.value = props.currentSearch?.purchaseDateMax || "";
        unknownPurchaseDate.value = props.currentSearch?.unknownPurchaseDate || false;
        expiryDateMin.value = props.currentSearch?.expiryDateMin || "";
        expiryDateMax.value = props.currentSearch?.expiryDateMax || "";
        noExpiry.value = props.currentSearch?.noExpiry || false;
        costMin.value = props.currentSearch?.costMin || 0;
        costMax.value = props.currentSearch?.costMax || 0;
    }

    currentlyOpenModalStore.setModalOpen();

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            closeModal();
        }

        if (event.key === "Enter") {

            advancedSearch();
        }
    };
    window.addEventListener("keydown", handleKeydown);

    onUnmounted(() => {
        window.removeEventListener("keydown", handleKeydown);
        currentlyOpenModalStore.setModalClosed();
    });
});

// Quantity Min/Max Sync
watch(quantityMin, (newMin) => {
    if (quantityMax.value < newMin) {
        quantityMax.value = newMin;
    }
});
watch(quantityMax, (newMax) => {
    if (newMax < quantityMin.value) {
        quantityMin.value = newMax;
    }
});

// Cost Min/Max Sync
watch(costMin, (newMin) => {
    if (costMax.value < newMin) {
        costMax.value = newMin;
    }
});
watch(costMax, (newMax) => {
    if (newMax < costMin.value) {
        costMin.value = newMax;
    }
});
</script>

<template>
    <div id="modal-container" class="modal-sm" ref="modalRef">
        <h2 id="form-header">Búsqueda avanzada</h2>
        <div id="form-container">
            <form id="product-form" @submit="advancedSearch">
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
                                @keydown="preventInvalidKey; handleArrowKeys">
                            <span class="hyphen">-</span>
                            <input type="number" id="product-quantity-max-input"
                                class="text-input form-control small-input" title="Cantidad máxima" placeholder="15"
                                min="0" v-model.number="quantityMax" @input="event => onNumInput(event, 'quantityMax')"
                                @keydown="preventInvalidKey; handleArrowKeys">
                            <button type="button" class="btn copy-btn" title="Copiar valor mínimo al valor máximo"
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
                                v-model="purchaseDateMin" :disabled="unknownPurchaseDate"
                                :class="{ 'input-error': purchaseDateMinError }">
                            <span class=" separation-letter">a</span>
                            <input type="date" id="product-purchase-max-input"
                                class="text-input form-control small-input" title="Fecha de compra máxima"
                                v-model="purchaseDateMax" :disabled="unknownPurchaseDate"
                                :class="{ 'input-error': purchaseDateMaxError }">
                            <button type="button" class="btn copy-btn" title="Copiar fecha mínima a fecha máxima"
                                @click="copyValue($event, 'purchaseDate')" :disabled="unknownPurchaseDate">
                                <Clipboard />
                            </button>
                        </div>

                        <div class="date-checkbox-container">
                            <label id="unknown-purchase-date" class="date-checkbox-label"
                                for="unknown-purchase-date-checkbox"
                                title="Filtrar solo productos cuya fecha de compra es desconocida">
                                <input type="checkbox" id="unknown-purchase-date-checkbox" class="date-checkbox"
                                    v-model="unknownPurchaseDate">
                                <span id="unknown-purchase-date-span" class="date-checkbox-span">Desconocida</span>
                            </label>
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
                            <button type="button" class="btn copy-btn" title="Copiar fecha mínima a fecha máxima"
                                @click="copyValue($event, 'expiryDate')" :disabled="noExpiry">
                                <Clipboard />
                            </button>
                        </div>

                        <div class="date-checkbox-container">
                            <label id="no-expiry" class="date-checkbox-label" for="no-expiry-checkbox"
                                title="Filtrar solo productos que no vencen">
                                <input type="checkbox" id="no-expiry-checkbox" class="date-checkbox" v-model="noExpiry">
                                <span id="no-expiry-span" class="date-checkbox-span">No expira</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label id="product-cost-label" for="product-cost-input" class="text-label">Costo</label>
                        <div class="range-group range-group-number">
                            <input type="number" id="product-cost-min-input" class="text-input form-control small-input"
                                title="Costo mínimo en ARS" placeholder="700" min="0" v-model.number="costMin"
                                @input="event => onNumInput(event, 'costMin')"
                                @keydown="preventInvalidKey; handleArrowKeys">
                            <span class="hyphen">-</span>
                            <input type="number" id="product-cost-max-input" class="text-input form-control small-input"
                                title="Costo máximo en ARS" placeholder="1800" min="0" v-model.number="costMax"
                                @input="event => onNumInput(event, 'costMax')"
                                @keydown="preventInvalidKey; handleArrowKeys">
                            <button type="button" class="btn copy-btn" title="Copiar valor mínimo al valor máximo"
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
    font-family: "Roboto", Helvetica, sans-serif;
    font-size: 18px;
    background-color: var(--modal-background-color);
    color: var(--text-color);
    text-align: center;
    padding-top: 10px;
    margin: 0 25%;
    border-radius: 5px;
    width: 100%;
}

#form-header {
    user-select: none;
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

.form-group {
    margin: 20px 0;
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
    font-family: "Nunito", "Roboto", Arial, Helvetica, sans-serif;
}

.text-input {
    grid-column: span 1;
    border: none;
    background-color: var(--text-input-background-color);
    color: var(--text-color);
    border: 1px solid var(--text-input-border-color);
    padding: 5px 10px;
    border-radius: 4px;
    box-shadow: 0 0 5px var(--box-shadow-color);
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    position: relative;
}

.text-input::placeholder {
    color: var(--input-focus-shadow);
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

.small-input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(var(--date-input-calendar-icon-value));
    cursor: pointer;
}

.checkbox,
.checkbox-label {
    display: inline-block;
    vertical-align: middle;
    user-select: none;
}

.checkbox {
    width: 20px;
    transform: scale(1.2);
    margin: 0;
    margin-bottom: 2px;
    vertical-align: middle;
}

.checkbox-label {
    width: 30%;
    vertical-align: middle;
}

.form-checkbox-label {
    width: 20%;
}

.hyphen,
.separation-letter {
    align-self: center;
    user-select: none;
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
    color: var(--copy-button-color);
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    transition: color 0.25s;
}

.copy-btn:hover {
    color: var(--copy-button-hover-color);
}

.date-checkbox-container {
    height: 0px;
}

.date-checkbox-label {
    font-size: 16px;
    display: flex;
    padding-top: 2px;
    width: 40%;
    align-items: center;
    user-select: none;
}

.date-checkbox {
    width: 20px;
    transform: scale(1.25);
    margin: 0;
    padding: 0;
    vertical-align: middle;
}

.date-checkbox-span {
    padding: 0;
    margin-top: 2px;
    margin-left: 4px;
    font-size: 16px;
    white-space: nowrap;
}

.input-error {
    border: 1px solid var(--input-error-color);
    box-shadow: 0 0 4px var(--input-error-color);
}

#close-button,
#submit-button {
    transition: box-shadow 0.33s, background-color 0.33s;
    margin-top: 0;
}

#close-button:hover {
    box-shadow: 0 0 2px 0 var(--red-button-hover);
}

#submit-button:hover {
    box-shadow: 0 0 2px 0 var(--blue-button-hover);
}
</style>