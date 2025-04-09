<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import AddProductModal from '../components/AddProductModal.vue';
import ConfirmationDialog from "../components/ConfirmationDialog.vue";
import type { Product } from "../interfaces/Product.ts";
import { LucideTrash2, ArrowDownAZ, ArrowUpZA, ArrowDown01, ArrowUp10, CalendarArrowDown, CalendarArrowUp } from 'lucide-vue-next';
import { areObjectsEqual } from '../utilities/auxFunctions.ts';

// * All //@ts-ignore are to prevent a pesky error which ignores that "window" refers to the Electron window

const isModalOpen = ref(false);
const products = ref<Product[]>([]);
const isConfirmDialogVisible = ref(false);
const productIdToDelete = ref<number | null>(null);
const editingProductId = ref<number | null>(null);
const newProductValue = ref<string>("");
const editingField = ref<string | null>("");
const sortingType = ref<string | undefined>("");
let isSaving = false; // Flag to prevent multiple calls
let sortSetting = 0; // 0 = default (sort by ID), 1 = A-Z/0-9, 2 = Z-A/9-0

const sortFunctions = {
    name: (a: any, b: any, asc: boolean) => asc 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    quantity: (a: any, b: any, asc: boolean) => asc 
        ? a.quantity - b.quantity
        : b.quantity - a.quantity,
    purchaseDate: (a: any, b: any, asc: boolean) => asc 
        ? new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
        : new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
    expiryDate: (a: any, b: any, asc: boolean) => asc 
        ? new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        : new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime(),
    cost: (a: any, b: any, asc: boolean) => asc 
        ? a.cost - b.cost
        : b.cost - a.cost,
};

// TODO Implement form control for editing inputs
// TODO Implement filtering
// TODO Implement search
// TODO Do extensive testing and write down any bugs to fix

function openModal() {
    isModalOpen.value = true;
}

function closeModal() {
    isModalOpen.value = false;
}

async function loadProducts(sortBy?: string, keepSort: boolean = false) {
    // @ts-ignore
    products.value = await window.api.loadProducts();

    // Update sortingSetting and cycle sortSetting
    if (sortingType.value !== sortBy) {
        sortingType.value = sortBy;
        sortSetting = 1; // Start with ascending
    } else if (!keepSort && sortingType.value) {
        sortSetting = (sortSetting + 1) % 3;
        if (sortSetting === 0) {
            sortingType.value = undefined;
        }
    }

    // Apply sorting if a sortBy is active
    const activeSort = sortingType.value;
    if (activeSort && sortFunctions[activeSort]) {
        const ascending = sortSetting === 1;
        products.value.sort((a, b) => sortFunctions[activeSort](a, b, ascending));
    }
}

async function addProduct(product: Product) {
    // @ts-ignore
    const savedProducts = await window.api.saveProduct(product);
    closeModal();
    loadProducts(sortingType.value, true);
}

async function deleteProduct(id: number){
    // @ts-ignore
    await window.api.deleteProduct(id);
}

function showDeleteConfirmation(id: number) {
    productIdToDelete.value = id;
    isConfirmDialogVisible.value = true;
}

async function confirmDelete() {
    if (productIdToDelete.value !== null) {
        await deleteProduct(productIdToDelete.value);
        loadProducts(sortingType.value, true);
    }
    isConfirmDialogVisible.value = false;
}

function cancelDelete() {
    isConfirmDialogVisible.value = false;
}

function editField(productId: number, currentValue: string, field: string) {
    editingProductId.value = productId;
    newProductValue.value = currentValue;
    editingField.value = field;
    isSaving = false;

    document.removeEventListener('click', handleClickOutside); // Remove the listener to dela with secondary inputs

    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 0);
}

async function updateProduct(productId: number) {
        if(isSaving) return;
        isSaving = true;

        document.removeEventListener('click', handleClickOutside);

        const product = products.value.find(p => p.id === productId);
        if (product) {
            // Create a plain object with only serializable properties
            const updatedProduct: Product = {
                id: product.id,
                name: editingField.value == "name" ? newProductValue.value : product.name,
                description: editingField.value == "description" ? newProductValue.value : product.description,
                quantity: editingField.value == "quantity" ? Number(newProductValue.value) : product.quantity,
                purchaseDate: editingField.value == "purchaseDate" ? newProductValue.value : product.purchaseDate,
                expiryDate: editingField.value == "expiryDate" ? newProductValue.value : product.expiryDate,
                cost: editingField.value == "cost" ? Number(newProductValue.value) : product.cost,
            };

            // Allows to get rid of the input when clicking outside
            editingProductId.value = null;
            editingField.value = null;

            if(areObjectsEqual(product, updatedProduct)) return; // Prevents unnecessary calls to the API

            // @ts-ignore
            await window.api.updateProduct(updatedProduct);
            loadProducts(sortingType.value, true);
        }
}

function handleClickOutside(event: MouseEvent) {
    const inputElement = document.querySelector('.edit-input');

    if (inputElement && !inputElement.contains(event.target as Node)) {
        if (editingProductId.value !== null) {
            updateProduct(editingProductId.value);
        }
        document.removeEventListener('click', handleClickOutside);
    }
}

function closeToExpiry(expiryDate: string): string {
    if (!expiryDate) return "";

    const today = new Date();
    const expiry = new Date(expiryDate);
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (daysDiff < 0){
        return "expired"
    } else if(daysDiff <= 7){
        return "red";
    } else if (daysDiff <= 14){
        return "yellow";
    } else{
        return "";
    }
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
}

onMounted(() => {
    loadProducts(sortingType.value);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
    <div>
        <button @click="openModal" class="open-modal-button btn btn-success">Añadir producto</button>
        <div v-if="isModalOpen" class="modal-overlay">
            <AddProductModal @close="closeModal" @add-product="addProduct"/>
        </div>
        <div id="product-table-container">
        <table v-if="products.length" class="product-table">
            <thead>
                <tr>
                    <th @click="loadProducts('name')">
                        Nombre
                        <ArrowDownAZ class="float-right" v-if="sortSetting === 1 && sortingType == 'name'"/>
                        <ArrowUpZA class="float-right" v-if="sortSetting === 2 && sortingType == 'name'" />
                    </th>
                    <th @click="loadProducts('quantity')">
                        Cantidad
                        <ArrowDown01 class="float-right" v-if="sortSetting === 1 && sortingType == 'quantity'"/>
                        <ArrowUp10 class="float-right" v-if="sortSetting === 2 && sortingType == 'quantity'" />
                    </th>
                    <th @click="loadProducts('purchaseDate')">
                        Fecha de compra
                        <CalendarArrowDown class="float-right" v-if="sortSetting === 1 && sortingType == 'purchaseDate'"/>
                        <CalendarArrowUp class="float-right" v-if="sortSetting === 2 && sortingType == 'purchaseDate'"/>
                    </th>
                    <th @click="loadProducts('expiryDate')">
                        Fecha de vencimiento
                        <CalendarArrowDown class="float-right" v-if="sortSetting === 1 && sortingType == 'expiryDate'"/>
                        <CalendarArrowUp class="float-right" v-if="sortSetting === 2 && sortingType == 'expiryDate'"/>
                    </th>
                    <th @click="loadProducts('cost')">
                        Precio
                        <ArrowDown01 class="float-right" v-if="sortSetting === 1 && sortingType == 'cost'"/>
                        <ArrowUp10 class="float-right" v-if="sortSetting === 2 && sortingType == 'cost'" />
                    </th>
                    <th id="actions-header">Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(product, index) in products" :key="index" :class="{
                    'close-to-expiry-red': closeToExpiry(product.expiryDate.toString()) === 'red',
                    'close-to-expiry-yellow': closeToExpiry(product.expiryDate.toString()) === 'yellow',
                    'expired-product': closeToExpiry(product.expiryDate.toString()) === 'expired'}">

                    <td class="product-name">
                        <span v-if="closeToExpiry(product.expiryDate.toString()) === 'expired'" class="expired-icon">⚠️ </span>
                        <span v-if="editingProductId !== product.id || editingField !== 'name'" @click="editField(product.id, product.name, 'name')" :class="{ 'strikethrough': closeToExpiry(product.expiryDate.toString()) === 'expired' }">{{ product.name }}</span>
                        <input v-else-if="editingField == 'name'" type="text" class="edit-input edit-input-primary" v-model="newProductValue" @keyup.enter="updateProduct(product.id)" /> <!-- This originally had a @blur but that caused issues with the keyup, so it was replaced with an eventHandler-->
                        
                        <span v-if="editingProductId !== product.id || editingField !== 'description'" class="product-description" @click="editField(product.id, product.description, 'description')"> ({{ product.description }})</span>
                        <input v-else-if="editingField == 'description'" type="text" class="edit-input edit-input-secondary" v-model="newProductValue" @keyup.enter="updateProduct(product.id)" />
                    </td>

                    <td class="product-quantity">
                        <span v-if="editingProductId !== product.id || editingField !== 'quantity'" @click="editField(product.id, String(product.quantity), 'quantity')">{{ product.quantity }}</span>
                        <input v-else-if="editingField == 'quantity'" type="number" class="edit-input edit-input-primary edit-input-quantity" v-model="newProductValue" @keyup.enter="updateProduct(product.id)"/>
                    </td>

                    <td class="product-purchase-date product-date-cell">
                        <span v-if="editingProductId !== product.id || editingField !== 'purchaseDate'" @click="editField(product.id, product.purchaseDate, 'purchaseDate')">{{ formatDate(product.purchaseDate) }}</span>
                        <input v-else-if="editingField == 'purchaseDate'" type="date" class="edit-input edit-input-primary edit-input-date" v-model="newProductValue" @keyup.enter="updateProduct(product.id)"/>
                    </td>

                    <td class="product-expiry-date product-date-cell">
                        <span v-if="editingProductId !== product.id || editingField !== 'expiryDate'" @click="editField(product.id, product.expiryDate, 'expiryDate')">{{ formatDate(product.expiryDate) }}</span>
                        <input v-else-if="editingField == 'expiryDate'" type="date" class="edit-input edit-input-primary edit-input-date" v-model="newProductValue" @keyup.enter="updateProduct(product.id)"/>
                    </td>

                    <td class="product-cost">
                        $<span v-if="editingProductId !== product.id || editingField !== 'cost'" @click="editField(product.id, String(product.cost), 'cost')">{{ product.cost }}</span> 
                        <input v-else-if="editingField == 'cost'" type="number" class="edit-input edit-input-primary edit-input-cost" v-model="newProductValue" @keyup.enter="updateProduct(product.id)"/>
                        <span class="product-unit-cost"> (${{ product.cost / product.quantity }} c/u)</span>
                    </td>

                    <td class="actions"><button class="btn btn-danger delete-btn" @click="showDeleteConfirmation(product.id)"><LucideTrash2 class="small"/></button></td>
                </tr>
            </tbody>
        </table>
        </div>
        <ConfirmationDialog class="modal-ov" v-if="isConfirmDialogVisible"
        :message="'¿Estás seguro que querés eliminar este producto?'"
        :isVisible="isConfirmDialogVisible"
        @confirm="confirmDelete"
        @cancel="cancelDelete"/>
    </div>
</template>

<style scoped>
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

.product-table {
    width: 100%;
    margin-top: 20px;
    border-collapse: collapse;
}

th {
    cursor: pointer;
    position: relative;
    user-select: none;
}

#actions-header{
    cursor: default;
}

.float-right{
    position: absolute;
    right: 0;
    margin-right: 3%;
    top: 50%;
    transform: translateY(-50%);
}

.close-to-expiry-red{
    background-color: rgba(255, 0, 0, 0.33);
}

.close-to-expiry-yellow{
    background-color: rgba(255, 251, 0, 0.33);
}

.expired-product {
    background-color: rgba(170, 170, 170, 0.33); /* Gray background */
    color: rgba(255, 0, 0, 0.8);
}

.strikethrough {
    text-decoration: line-through;
}

.expired-icon {
    margin-right: 5px;
    color: rgba(255, 0, 0, 0.8); /* Red color for icon */
}

.product-table th, .product-table td {
    border: 1px solid #ddd;
    padding: 8px;
    font-size: 18px;
}

.product-table th {
    background-color: #f2f2f2;
    color: #202020;
    text-align: center;
}

.product-description,
.product-unit-cost {
    color: #acacac;
    font-size: 16px;
}

.product-name{
    width: 25%;
}

.product-quantity {
    width: 12%;
}

.product-purchase-date {
    width: 17.5%
}

.product-expiry-date {
    width: 20%;
}

.product-cost{
    width: 13.5%;
}

.actions {
    width: 7.5%;
}

.small {
    width: 20px;
    height: 20px;
}

.edit-input {
    text-align: center;
    width: 50%;
    height: 38px;
    max-height: 38px;
    max-width: 50%;
}

.edit-input-primary {
    font-size: 18px;
}

.edit-input-secondary {
    font-size: 16px;
    margin-left: 10px;
}

.edit-input-quantity {
    min-width: 70px;
    margin-left: 10px;
}

.edit-input-date {
    display: inline-block;
    width: 100%;
    min-width: 150px;
    box-sizing: border-box;
    margin-left: 11px;
}

.edit-input-cost{
    min-width: 50px;
    max-width: 100px;
    padding: 0;
    margin: 0;
}
</style>