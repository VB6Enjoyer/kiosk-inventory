<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import AddProductModal from '../components/AddProductModal.vue';
import ConfirmationDialog from "../components/ConfirmationDialog.vue";
import type { Product } from "../interfaces/Product.ts";
import { LucideTrash2, ArrowDownAZ, ArrowUpZA, ArrowDown01, ArrowUp10, CalendarArrowDown, CalendarArrowUp } from 'lucide-vue-next';
import { areObjectsEqual } from '../utilities/auxFunctions.ts';
import SearchBar from '../components/SearchBar.vue';
import { debounce } from 'lodash';
import AdvancedSearchModal from '../components/AdvancedSearchModal.vue';
import { AdvancedSearch } from '../interfaces/AdvancedSearch.ts';

// * All //@ts-ignore are to prevent a pesky error which ignores that "window" refers to the Electron window

const isAddProductModalOpen = ref<boolean>(false);
const isSearchModalOpen = ref<boolean>(false);
const products = ref<Product[]>([]);
const productsBackup = ref<Product[]>([]);
const isConfirmDialogVisible = ref<boolean>(false);
const productIdToDelete = ref<number | null>(null);
const editingProductId = ref<number | null>(null);
const newProductValue = ref<string>("");
const editingField = ref<string | null>("");
const sortingType = ref<string | undefined>("");
const searchQuery = ref<string>("");
let isSaving = false; // Flag to prevent multiple calls
let isSearching = searchQuery.value.trim().length > 0;
let sortSetting = 0; // 0 = default (sort by ID), 1 = A-Z/0-9, 2 = Z-A/9-0

const sortFunctions = {
    id: (a: Product, b: Product) => a.id - b.id,
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

const debouncedSearch = debounce((query: string) => {
    const fixedQuery = query.toLowerCase().trim();

    if(!fixedQuery){
        products.value = [...productsBackup.value];
    } else {
        products.value = [...productsBackup.value.filter(product => 
            product.name.toLowerCase().includes(fixedQuery) ||
            product.description.toLowerCase().includes(fixedQuery))];
        sortProducts(sortingType.value || "", true);
    }
}, 30); // This value could be changed if the app is running in a really slow computer for better performance
        // Load, delete and modify operations have delay when searching. Might want to modify the logic to change this if necessary

// TODO Implement form control for editing inputs
// TODO Implement expiry filtering
// TODO Implement advanced search
// TODO For date fields, assign existing values when editing
// TODO Do extensive testing and write down any bugs to fix
// TODO Fix advanced search to return to normal with a button; probably replace the search bar with a button for this purpose

function openAddProductModal() {
    isAddProductModalOpen.value = true;
}

function closeAddProductModal() {
    isAddProductModalOpen.value = false;
}

function openSearchModal() {
    isSearchModalOpen.value = true;
}

function closeSearchModal() {
    isSearchModalOpen.value = false;
}

function search(query: string) {
    if(searchQuery.value != query) searchQuery.value = query;
    isSearching = searchQuery.value.trim().length > 0;
    debouncedSearch(searchQuery.value);
}

function advancedSearch(search: AdvancedSearch){
    let filteredProducts: Product[] = [...productsBackup.value];

    if(search.name) {
        search.exactName
        ? filteredProducts = [...filteredProducts.filter(product => product.name.toLowerCase() == search.name)]
        : filteredProducts = [...filteredProducts.filter(product => product.name.toLowerCase().includes(search.name))];
    }

    if(search.description){
        search.exactDescription
        ? filteredProducts = [...filteredProducts.filter(product => product.name.toLowerCase() == search.description)]
        : filteredProducts = [...filteredProducts.filter(product => product.name.toLowerCase().includes(search.description))];
    }

    if(search.quantityMin != 0 && search.quantityMax != 0) filteredProducts = [...filteredProducts.filter(product => product.quantity >= search.quantityMin && product.quantity <= search.quantityMax)];

    console.log(filteredProducts)

    console.log(search.purchaseDateMin && search.purchaseDateMax)
    if (search.purchaseDateMin && search.purchaseDateMax) {
        filteredProducts = [...filteredProducts.filter(product => {
            const productDate = new Date(product.purchaseDate);
            const minDate = new Date(search.purchaseDateMin);
            const maxDate = new Date(search.purchaseDateMax);
            return productDate >= minDate && productDate <= maxDate;
        })];
    }
    console.log(filteredProducts)

    if (search.expiryDateMin && search.expiryDateMax) {
        filteredProducts = [...filteredProducts.filter(product => {
            const productDate = new Date(product.expiryDate);
            const minDate = new Date(search.expiryDateMin);
            const maxDate = new Date(search.expiryDateMax);
            return productDate >= minDate && productDate <= maxDate;
        })];
    }
    

    if(search.costMin && search.costMax) filteredProducts = [...filteredProducts.filter(product => product.cost >= search.costMin && product.cost <= search.costMax)];

    
    if(filteredProducts.length > 0) products.value = [...filteredProducts];
}

async function loadProducts(sortBy?: string, keepSort: boolean = false) {
    // @ts-ignore
    productsBackup.value = await window.api.loadProducts();

    isSearching ? debouncedSearch(searchQuery.value) : products.value = [...productsBackup.value];

    sortProducts(sortingType.value || "", keepSort);
}

function sortProducts(sortBy: string, keepSort: boolean = false){
    // Update sortingSetting and cycle sortSetting
    if (sortingType.value !== sortBy) {
        sortingType.value = sortBy;
        sortSetting = 1; // Start with ascending
    } else if (!keepSort && sortingType.value) {
        sortSetting = (sortSetting + 1) % 3;
        if (sortSetting === 0) {
            sortingType.value = undefined;
            products.value.sort((a, b) => sortFunctions["id"](a, b));
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
    closeAddProductModal();
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
        <div id="functions-container">
            <div id="search-bar-container">
                <SearchBar id="search-bar" @search="search" @openSearchModal='openSearchModal'/>
            </div>
            <button @click="openAddProductModal" id="open-modal-btn" class="btn btn-success">Añadir producto</button>
            <div v-if="isAddProductModalOpen" class="modal-overlay">
                <AddProductModal @close="closeAddProductModal" @add-product="addProduct" />
            </div>
            <div v-if="isSearchModalOpen" class="modal-overlay">
                <AdvancedSearchModal @close="closeSearchModal" @advancedSearch="advancedSearch"/>
            </div>
        </div>
        <div id="product-table-container">
        <table class="product-table">
            <thead>
                <tr>
                    <th @click="sortProducts('name')">
                        Nombre
                        <ArrowDownAZ class="float-right" v-if="sortSetting === 1 && sortingType == 'name'"/>
                        <ArrowUpZA class="float-right" v-if="sortSetting === 2 && sortingType == 'name'" />
                    </th>
                    <th @click="sortProducts('quantity')">
                        Cantidad
                        <ArrowDown01 class="float-right" v-if="sortSetting === 1 && sortingType == 'quantity'"/>
                        <ArrowUp10 class="float-right" v-if="sortSetting === 2 && sortingType == 'quantity'" />
                    </th>
                    <th @click="sortProducts('purchaseDate')">
                        Fecha de compra
                        <CalendarArrowDown class="float-right" v-if="sortSetting === 1 && sortingType == 'purchaseDate'"/>
                        <CalendarArrowUp class="float-right" v-if="sortSetting === 2 && sortingType == 'purchaseDate'"/>
                    </th>
                    <th @click="sortProducts('expiryDate')">
                        Fecha de vencimiento
                        <CalendarArrowDown class="float-right" v-if="sortSetting === 1 && sortingType == 'expiryDate'"/>
                        <CalendarArrowUp class="float-right" v-if="sortSetting === 2 && sortingType == 'expiryDate'"/>
                    </th>
                    <th @click="sortProducts('cost')">
                        Precio
                        <ArrowDown01 class="float-right" v-if="sortSetting === 1 && sortingType == 'cost'"/>
                        <ArrowUp10 class="float-right" v-if="sortSetting === 2 && sortingType == 'cost'" />
                    </th>
                    <th id="actions-header">Acciones</th>
                </tr>
            </thead>
            <tbody v-if="products.length">
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
#functions-container {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

#search-bar-container {
    max-width: 30%;
    flex-shrink: 0;
}

#open-modal-btn {
    position: absolute;
    left: 50%;
    height: 100%;
    transform: translateX(-50%);
}

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