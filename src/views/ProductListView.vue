<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import AddProductModal from '../components/AddProductModal.vue';
import ConfirmationDialog from "../components/ConfirmationDialog.vue";
import type { Product } from "../interfaces/Product.ts";
import { LucideTrash2, ArrowDownAZ, ArrowUpZA, ArrowDown01, ArrowUp10, CalendarArrowDown, CalendarArrowUp, Ban, TriangleAlert, Grip } from 'lucide-vue-next';
import { areObjectsEqual } from '../utilities/auxFunctions.ts';
import SearchBar from '../components/SearchBar.vue';
import AdvancedSearchModal from '../components/AdvancedSearchModal.vue';
import { AdvancedSearch } from '../interfaces/AdvancedSearch.ts';
import OptionsMenu from '../components/OptionsMenu.vue';
import DollarValue from "../components/DollarValue.vue"
import html2pdf from 'html2pdf.js';
import { useToast } from 'vue-toastification';
// @ts-ignore
import { debounce } from 'lodash';
import { exportToExcel, importFromExcel } from '../utilities/excelHandler.ts';
import "../style.css"
import { useEcoModeStore } from '../stores/ecoMode.ts';
import { useCurrentlyOpenModalStore } from '../stores/openModal.ts';

// All //@ts-ignore are to prevent a pesky error which ignores that "window" refers to the Electron window
// TODO Do extensive testing and write down any bugs to fix
// TODO Optionally, permit normal searching while expiry-filtering, although the logic might be problematic
// TODO Maybe offer the possibility to choose page size when exporting to PDF
// TODO Add a currency converter?
// TODO Add keyboard listeners for shortcurts and better QOL

const isAddProductModalOpen = ref<boolean>(false);
const isSearchModalOpen = ref<boolean>(false);
const isMenuOpen = ref<boolean>(false);
const products = ref<Product[]>([]);
const productsBackup = ref<Product[]>([]);
const searchedProducts = ref<Product[]>([]);
const isDeleting = ref<boolean>(false);
const productIdToDelete = ref<number | null>(null);
const editingProductId = ref<number | null>(null);
const newProductValue = ref<string>("");
const editingField = ref<string | null>("");
const sortingType = ref<string | undefined>("");
const searchQuery = ref<string>("");
const advancedSearchBackup = ref<AdvancedSearch | undefined>(undefined);
const pdfContent = ref<HTMLElement | null>(null);
const isImporting = ref<boolean>(false);
const importedProducts = ref<any[]>([]);
const importedFailedCount = ref(0);
const importConfirmationMessage = ref('');
const debouncedSearch = ref<(query: string) => void>(() => { });

let isSaving: boolean = false; // Flag to prevent multiple calls
let isSearching: boolean = searchQuery.value.trim().length > 0;
let isAdvancedSearching: boolean = false;
let filterSetting: number = 0; // 0 = no, 1 = two weeks to expiry, 2 = one week to expiry, 3 = expired
let isFiltering: boolean = false;
let sortSetting = 0; // 0 = default (sort by ID), 1 = A-Z/0-9, 2 = Z-A/9-0
let keydownListener: ((event: KeyboardEvent) => void) | undefined;

const toast = useToast();
const ecoModeStore = useEcoModeStore();
const currentlyOpenModalStore = useCurrentlyOpenModalStore();

const sortFunctions = {
    id: (a: Product, b: Product) => a.id - b.id,
    name: (a: any, b: any, asc: boolean) => asc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    quantity: (a: any, b: any, asc: boolean) => asc
        ? a.quantity - b.quantity
        : b.quantity - a.quantity,
    purchaseDate: (a: any, b: any, asc: boolean) => {
        const UNKNOWN_DATE = "N/A";
        const aUnknownDate = typeof a.purchaseDate === "string" && a.purchaseDate.trim().toLowerCase() === UNKNOWN_DATE;
        const bUnknownDate = typeof b.purchaseDate === "string" && b.purchaseDate.trim().toLowerCase() === UNKNOWN_DATE;

        if (aUnknownDate && bUnknownDate) return 0;
        if (aUnknownDate) return asc ? 1 : -1;
        if (bUnknownDate) return asc ? -1 : 1;

        const aTime = new Date(a.purchaseDate).getTime();
        const bTime = new Date(b.purchaseDate).getTime();
        return asc ? aTime - bTime : bTime - aTime;
    },
    expiryDate: (a: any, b: any, asc: boolean) => {
        const NO_EXPIRA = "no expira";
        const aNoExpira = typeof a.expiryDate === "string" && a.expiryDate.trim().toLowerCase() === NO_EXPIRA;
        const bNoExpira = typeof b.expiryDate === "string" && b.expiryDate.trim().toLowerCase() === NO_EXPIRA;

        if (aNoExpira && bNoExpira) return 0;
        if (aNoExpira) return asc ? 1 : -1; // "no expira" goes last in ascending, first in descending
        if (bNoExpira) return asc ? -1 : 1;

        const aTime = new Date(a.expiryDate).getTime();
        const bTime = new Date(b.expiryDate).getTime();
        return asc ? aTime - bTime : bTime - aTime;
    },
    cost: (a: any, b: any, asc: boolean) => asc
        ? a.cost - b.cost
        : b.cost - a.cost,
};

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

function openMenu() {
    isMenuOpen.value = true;
}

function closeMenu() {
    isMenuOpen.value = false;
}

function search(query: string) {
    if (searchQuery.value != query) searchQuery.value = query;
    isSearching = searchQuery.value.trim().length > 0;
    isAdvancedSearching = false;
    debouncedSearch.value(searchQuery.value);
    if (query == "") advancedSearchBackup.value = undefined;
}

function setupDebouncedSearch() {
    const interval = ecoModeStore.ecoMode ? 600 : 30; // Adjust as needed
    debouncedSearch.value = debounce((query: string) => {
        const fixedQuery = query.toLowerCase().trim();
        clearFilters();

        if (!fixedQuery) {
            loadProducts();
        } else {
            products.value = [...productsBackup.value.filter(product =>
                product.name.toLowerCase().includes(fixedQuery) ||
                product.description.toLowerCase().includes(fixedQuery))];
            sortProducts(sortingType.value || "", true);
        }

        searchedProducts.value = [...products.value];
    }, interval);
}

function advancedSearch(search: AdvancedSearch) {
    let filteredProducts: Product[] = [...productsBackup.value];
    advancedSearchBackup.value = search;
    searchQuery.value = "";

    if (search.name) {
        search.exactName
            ? filteredProducts = [...filteredProducts.filter(product => product.name.toLowerCase() == search.name.toLowerCase())]
            : filteredProducts = [...filteredProducts.filter(product => product.name.toLowerCase().includes(search.name.toLowerCase()))];
    }

    if (search.description) {
        search.exactDescription
            ? filteredProducts = [...filteredProducts.filter(product => product.description.toLowerCase() == search.description.toLowerCase())]
            : filteredProducts = [...filteredProducts.filter(product => product.description.toLowerCase().includes(search.description.toLowerCase()))];
    }

    if (search.quantityMin >= 0 && search.quantityMax != 0) filteredProducts = [...filteredProducts.filter(product => product.quantity >= search.quantityMin && product.quantity <= search.quantityMax)];

    if (search.purchaseDateMin && search.purchaseDateMax && !search.unknownPurchaseDate) {
        filteredProducts = [...filteredProducts.filter(product => {
            const productDate = new Date(product.purchaseDate);
            const minDate = new Date(search.purchaseDateMin);
            const maxDate = new Date(search.purchaseDateMax);
            return productDate >= minDate && productDate <= maxDate;
        })];
    }

    if (search.unknownPurchaseDate) {
        filteredProducts = [...filteredProducts.filter(product => {
            return product.purchaseDate == "N/A";
        })];
    }

    if (search.expiryDateMin && search.expiryDateMax && !search.noExpiry) {
        filteredProducts = [...filteredProducts.filter(product => {
            const productDate = new Date(product.expiryDate);
            const minDate = new Date(search.expiryDateMin);
            const maxDate = new Date(search.expiryDateMax);
            return productDate >= minDate && productDate <= maxDate;
        })];
    }

    if (search.noExpiry) {
        filteredProducts = [...filteredProducts.filter(product => {
            return product.expiryDate == "No expira";
        })];
    }

    if (search.costMin >= 0 && search.costMax) filteredProducts = [...filteredProducts.filter(product => product.cost >= search.costMin && product.cost <= search.costMax)];

    products.value = [...filteredProducts];
    searchedProducts.value = [...products.value]

    sortProducts(sortingType.value || "", true);
    if (products.value.length == productsBackup.value.length) {
        isAdvancedSearching = false
    } else {
        isAdvancedSearching = true;
        searchedProducts.value.length > 0
            ? toast(`Se encontraron ${searchedProducts.value.length} resultados.`)
            : toast.error("No se encontraron resultados.")
    }

    if (filterSetting != 0) {
        if (filterSetting == 1) filterProductsByExpiry("two-weeks");
        if (filterSetting == 2) filterProductsByExpiry("one-week");
        if (filterSetting == 3) filterProductsByExpiry("expired");
    }
}

function filterProductsByExpiry(filterType: string) {
    const now: Date = new Date();
    let daysFromNow: number = 0;
    let filteredProducts: Product[] = [];
    let productsList: Product[] = [];

    const twoWeeksBtn = document.getElementById("two-weeks-btn") as HTMLInputElement;
    const oneWeekBtn = document.getElementById("one-week-btn") as HTMLInputElement;
    const expiredBtn = document.getElementById("expired-btn") as HTMLInputElement;

    if (filterType == "two-weeks") {
        daysFromNow = 14;
        filterSetting == 1 ? filterSetting = 0 : filterSetting = 1;

        twoWeeksBtn.style.backgroundColor = "rgb(190, 160, 0)";
        oneWeekBtn.style.backgroundColor = "rgb(255, 0, 0)";
        expiredBtn.style.backgroundColor = "#505050";
    }

    if (filterType == "one-week") {
        daysFromNow = 7
        filterSetting == 2 ? filterSetting = 0 : filterSetting = 2;

        twoWeeksBtn.style.backgroundColor = "rgb(250, 220, 0)";
        oneWeekBtn.style.backgroundColor = "rgb(145, 0, 0)";
        expiredBtn.style.backgroundColor = "#505050";
    }

    if (filterType == "expired") {
        filterSetting == 3 ? filterSetting = 0 : filterSetting = 3;

        twoWeeksBtn.style.backgroundColor = "rgb(250, 220, 0)";
        oneWeekBtn.style.backgroundColor = "rgb(255, 0, 0)";
        expiredBtn.style.backgroundColor = "#303030";
    }

    if (filterSetting == 0) {
        clearFilters();

        if (isAdvancedSearching && advancedSearchBackup.value) {
            advancedSearch(advancedSearchBackup.value);
            return;
        } else if (isSearching) {
            search(searchQuery.value);
            return;
        } else {
            loadProducts();
            return;
        }
    }

    const futureDate: Date = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);

    isFiltering ?
        isSearching || isAdvancedSearching
            ? productsList = [...searchedProducts.value]
            : productsList = [...productsBackup.value]
        : productsList = [...products.value]

    filteredProducts = productsList.filter(product => {
        const expiryDate = new Date(product.expiryDate);
        if (filterType != "expired") {
            return expiryDate >= now && expiryDate <= futureDate;
        } else {
            return expiryDate <= now;
        }
    });

    products.value = filteredProducts;
    isFiltering = true;
    sortProducts(sortingType.value || "", true);
}

function clearFilters() {
    isFiltering = false;
    filterSetting = 0;

    (document.getElementById("two-weeks-btn") as HTMLInputElement).style.backgroundColor = "rgb(250, 220, 0)";
    (document.getElementById("one-week-btn") as HTMLInputElement).style.backgroundColor = "rgb(255, 0, 0)";
    (document.getElementById("expired-btn") as HTMLInputElement).style.backgroundColor = "#505050";
}

async function loadProducts(keepSort: boolean = false) {
    // @ts-ignore
    productsBackup.value = await window.api.loadProducts();

    isSearching ? debouncedSearch.value(searchQuery.value) : products.value = [...productsBackup.value];

    sortProducts(sortingType.value || "", keepSort);
}

function sortProducts(sortBy: string, keepSort: boolean = false) {
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
    loadProducts(true);
    isAdvancedSearching = false;

    let toastMessage = "Se añadió " + product.name + (product.description ? ` (${product.description})` : "") + " a la base de datos."

    toast.success(toastMessage)
}

async function deleteProduct(id: number) {
    const deletedProduct = productsBackup.value.find(product => product.id == id);
    // @ts-ignore
    await window.api.deleteProduct(id);
    isAdvancedSearching = false;
    let toastMessage = "Se eliminó " + deletedProduct?.name + (deletedProduct?.description ? ` (${deletedProduct?.description})` : "") + " de la base de datos."
    toast.success(toastMessage);
}

function showDeleteConfirmation(id: number) {
    productIdToDelete.value = id;
    isDeleting.value = true;
}

async function confirmDelete() {
    if (productIdToDelete.value !== null) {
        await deleteProduct(productIdToDelete.value);
        loadProducts(true);
    }
    isDeleting.value = false;
}

function cancelDelete() {
    isDeleting.value = false;
}

function editField(productId: number, currentValue: string, field: string) {
    editingProductId.value = productId;
    if (currentValue.length > 0) newProductValue.value = currentValue.trim();
    editingField.value = field;
    isSaving = false;

    document.removeEventListener('mousedown', handleClickOutside); // Remove the listener to dela with secondary inputs

    setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
    }, 0);
}

async function updateProduct(productId: number) {
    if (isSaving) return;
    isSaving = true;

    document.removeEventListener('mousedown', handleClickOutside);

    const product = products.value.find(p => p.id === productId);
    if (product) {
        if ((editingField.value === "quantity" || editingField.value === "cost") && Number(newProductValue.value) < 0) {
            isSaving = false;
            return;
        }

        // Date validation
        if ((editingField.value === "purchaseDate" || editingField.value === "expiryDate") && !isValidDate(newProductValue.value)) {
            isSaving = false;
            return;
        }

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

        if (areObjectsEqual(product, updatedProduct)) return; // Prevents unnecessary calls to the API

        // @ts-ignore
        await window.api.updateProduct(updatedProduct);
        loadProducts(true);
    }
}

function handleClickOutside(event: MouseEvent) {
    const inputElement = document.querySelector('.edit-input');

    if (inputElement && !inputElement.contains(event.target as Node)) {
        if (editingProductId.value !== null && newProductValue.value) {
            updateProduct(editingProductId.value);
        } else {
            loadProducts(true);
            editingProductId.value = null;
            editingField.value = null;
        }
        document.removeEventListener('mousedown', handleClickOutside);
    }
    currentlyOpenModalStore.setModalClosed();
}

function closeToExpiry(expiryDate: string): string {
    if (!expiryDate) return "";

    const today = new Date();
    const expiry = new Date(expiryDate);
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (daysDiff < 0) {
        return "expired"
    } else if (daysDiff <= 7) {
        return "red";
    } else if (daysDiff <= 14) {
        return "yellow";
    } else {
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

function isValidDate(dateString: string): boolean {
    // Check for empty, "N/A" or "No expira"
    if (dateString === "No expira" || dateString === "N/A") return true;
    if (!dateString) return false;

    // Try to parse the date
    const date = new Date(dateString);

    if (date.getFullYear() < 1900) return false;

    // Check if the date is valid and matches the input (prevents 3/5-digit years)
    return (
        !isNaN(date.getTime()) &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    );
}

function preventNegative(event: Event) {
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
    newProductValue.value = value;
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

function formatUnitCost(cost: number, quantity: number): string {
    if (!quantity) return '0';
    const value = cost / quantity;
    // Check if value has more than 2 decimal places
    if (Number.isInteger(value)) return value.toString();
    const decimals = value.toString().split('.')[1];
    if (decimals && decimals.length > 2) {
        return value.toFixed(2);
    }
    return value.toString();
}

function exportPDF() {
    if (productsBackup.value.length == 0) {
        toast.error("Error a exportar a PDF: La base de datos está vacía");
        return;
    }

    if (!pdfContent.value) return;

    const currentDate = document.getElementById("current-date");

    // Add the class for PDF export
    document.body.classList.add('pdf-export');
    if (currentDate) currentDate.innerText = (new Date()).toISOString().slice(0, 10);

    html2pdf()
        .set({
            margin: 0.3,
            filename: 'Productos.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: [11, 8.5], orientation: 'landscape' }
        })
        .from(pdfContent.value)
        .save()
        .then(() => {
            // Remove the class after the export is done
            document.body.classList.remove('pdf-export');
            if (currentDate) currentDate.innerHTML = "";
            toast.success("Se exportó la base de datos a PDF con éxito.");
        });
}

async function exportExcel() {
    try {
        await exportToExcel(productsBackup.value);
        toast.success("Se exportó la base de datos a Excel con éxito.");
    } catch (error) {
        toast.error("No se pudo exportar a Excel:", error);
    }
}

async function importExcel() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.onchange = async (event) => {
        const target = event.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) {
            document.body.removeChild(fileInput);
            return;
        }

        const file = target.files[0];
        try {
            const loadingToast = toast.info("Importando productos desde Excel...", {
                timeout: false,
                closeButton: false
            });

            const { products: imported, failedCount } = await importFromExcel(file);

            toast.dismiss(loadingToast);

            // Store imported products and failed count in state
            importedProducts.value = imported;
            importedFailedCount.value = failedCount;

            if (imported.length === 0) {
                toast.error("No se pudieron importar productos desde el archivo Excel.");
                document.body.removeChild(fileInput);
                return;
            }

            // Show confirmation modal
            importConfirmationMessage.value = `Se encontraron ${imported.length} productos para importar. ¿Desea reemplazar el inventario actual o agregar los productos?`;
            showImportConfirmation();
        } catch (error) {
            console.error("Error importing Excel file:", error);
            toast.error(`Error al importar el archivo Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            document.body.removeChild(fileInput);
        }
    };

    fileInput.click();
}

function showImportConfirmation() {
    closeMenu();
    isImporting.value = true;
}

async function replaceFromImport() {
    isImporting.value = false;
    try {
        // Wipe the database
        for (const product of productsBackup.value) {
            //@ts-ignore
            await window.api.deleteProduct(product.id);
        }

        // Add imported products
        for (const product of importedProducts.value) {
            //@ts-ignore
            await window.api.saveProduct(JSON.parse(JSON.stringify(product)));
        }

        await loadProducts(false);
        isAdvancedSearching = false;

        let successMessage = `Se reemplazó el inventario con ${importedProducts.value.length} productos.`;
        const failedImports = importedFailedCount.value;
        if (failedImports > 0) {
            toast.error(`${failedImports} producto${failedImports == 1 ? '' : 's'} no ${failedImports == 1 ? 'pudo' : 'pudieron'} ser importado${failedImports == 1 ? '' : 's'}.`)
        }
        toast.success(successMessage);
    } catch (error) {
        toast.error("Error al reemplazar el inventario:", error.message);
    }

    // Clear state
    importedProducts.value = [];
    importedFailedCount.value = 0;
}

async function addFromImport() {
    isImporting.value = false;

    try {
        for (const product of importedProducts.value) {

            //@ts-ignore
            await window.api.saveProduct(JSON.parse(JSON.stringify(product)));
        }

        await loadProducts(false);
        isAdvancedSearching = false;

        let successMessage = `Se agregaron ${importedProducts.value.length} productos al inventario.`;
        if (importedFailedCount.value > 0) {
            successMessage += ` ${importedFailedCount.value} productos no pudieron ser importados debido a errores en el formato.`;
        }
        toast.success(successMessage);
    } catch (error) {
        console.error(error);
        toast.error("Error al agregar productos al inventario:", error.message);
    }
    // Clear state
    importedProducts.value = [];
    importedFailedCount.value = 0;
}

function cancelImport() {
    isImporting.value = false;
    importedProducts.value = [];
    importedFailedCount.value = 0;
}

onMounted(() => {
    loadProducts();
    localStorage.setItem('theme', "dark");
    localStorage.setItem('eco', "false");
    setupDebouncedSearch();

    keydownListener = (event: KeyboardEvent) => {
        // Prevent shortcuts if a modal is open
        if (currentlyOpenModalStore.isModalOpen || editingField.value) return;

        // Always use lower case for letter keys
        const key = event.key.toLowerCase();

        // Sorting shortcuts
        if (key === "1") {
            event.preventDefault();
            sortProducts('name');
            return;
        }
        if (key === "2") {
            event.preventDefault();
            sortProducts('quantity');
            return;
        }
        if (key === "3") {
            event.preventDefault();
            sortProducts('purchaseDate');
            return;
        }
        if (key === "4") {
            event.preventDefault();
            sortProducts('expiryDate');
            return;
        }
        if (key === "5") {
            event.preventDefault();
            sortProducts('cost');
            return;
        }

        // Open add product modal: +, a
        // + is Shift + = on most keyboards
        if (
            (event.key === "+" || (event.key === "=" && event.shiftKey)) ||
            key === "a"
        ) {
            event.preventDefault();
            openAddProductModal();
            return;
        }

        // Filter by expiry date
        if (event.key === "F1") {
            event.preventDefault();
            filterProductsByExpiry('two-weeks');
            return;
        }
        if (event.key === "F2") {
            event.preventDefault();
            filterProductsByExpiry('one-week');
            return;
        }
        if (event.key === "F3") {
            event.preventDefault();
            filterProductsByExpiry('expired');
            return;
        }

        // Open options menu with Escape (existing)
        if (event.key === "Escape") {
            openMenu();
        }
    };
    window.addEventListener("keydown", keydownListener);
});

onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleClickOutside);

    if (keydownListener) {
        window.removeEventListener("keydown", keydownListener);
        keydownListener = undefined;
    }
});

watch(() => ecoModeStore.ecoMode, () => {
    setupDebouncedSearch();
});
</script>

<template>
    <div id="list-view-container">
        <div id="upper-bar">
            <DollarValue />

            <button id="option-modal-btn" class="btn" title="Menú de opciones" @click.prevent="openMenu()">
                <Grip id="grip-icon" />
            </button>

            <div v-if="isMenuOpen" class="modal-overlay">
                <OptionsMenu @close="closeMenu" @export-pdf="exportPDF" @export-excel="exportExcel"
                    @import-excel="importExcel" />
            </div>
        </div>

        <div id="product-list-container">
            <h1 id="inventory-header">Inventario</h1>

            <div id="functions-container">
                <div id="search-bar-container">
                    <SearchBar id="search-bar" @search="search" @openSearchModal='openSearchModal'
                        :isAdvancedSearching="isAdvancedSearching" />
                </div>

                <div v-if="isSearchModalOpen" class="modal-overlay">
                    <AdvancedSearchModal :currentSearch="advancedSearchBackup" @close="closeSearchModal"
                        @advancedSearch="advancedSearch" />
                </div>

                <button @click="openAddProductModal" id="open-modal-btn" class="btn btn-success">Añadir
                    producto</button>

                <div v-if="isAddProductModalOpen" class="modal-overlay">
                    <AddProductModal @close="closeAddProductModal" @add-product="addProduct" />
                </div>

                <div id="filter-button-container">
                    <button id="two-weeks-btn" class="btn filter-btn" title="Mostrar productos a vencer en 2 semanas"
                        @click="filterProductsByExpiry('two-weeks')">
                        <TriangleAlert />
                    </button>

                    <button id="one-week-btn" class="btn filter-btn" title="Mostrar productos a vencer en una semana"
                        @click="filterProductsByExpiry('one-week')">
                        <TriangleAlert />
                    </button>

                    <button id="expired-btn" class="btn filter-btn" title="Mostrar productos vencidos"
                        @click="filterProductsByExpiry('expired')">
                        <Ban />
                    </button>
                </div>
            </div>

            <div id="product-table-container" ref="pdfContent">
                <h4 id="current-date"></h4> <!-- Used for PDF exports, otherwise invisible -->

                <div id="table-container">
                    <table class="product-table">
                        <thead>
                            <tr>
                                <th id="name-header" title="Ordenar por nombre" @click="sortProducts('name')">
                                    Nombre
                                    <ArrowDownAZ class="float-right"
                                        v-if="sortSetting === 1 && sortingType === 'name'" />
                                    <ArrowUpZA class="float-right" v-if="sortSetting === 2 && sortingType === 'name'" />
                                </th>

                                <th id="quantity-header" title="Ordenar por cantidad" @click="sortProducts('quantity')">
                                    Cantidad
                                    <ArrowDown01 class="float-right"
                                        v-if="sortSetting === 1 && sortingType === 'quantity'" />
                                    <ArrowUp10 class="float-right"
                                        v-if="sortSetting === 2 && sortingType === 'quantity'" />
                                </th>

                                <th id="purchase-date-header" title="Ordenar por fecha de compra"
                                    @click="sortProducts('purchaseDate')">
                                    Fecha de compra
                                    <CalendarArrowDown class="float-right"
                                        v-if="sortSetting === 1 && sortingType === 'purchaseDate'" />
                                    <CalendarArrowUp class="float-right"
                                        v-if="sortSetting === 2 && sortingType === 'purchaseDate'" />
                                </th>

                                <th id="expiry-date-header" title="Ordenar por fecha de vencimiento"
                                    @click="sortProducts('expiryDate')">
                                    Fecha de vencimiento
                                    <CalendarArrowDown class="float-right"
                                        v-if="sortSetting === 1 && sortingType === 'expiryDate'" />
                                    <CalendarArrowUp class="float-right"
                                        v-if="sortSetting === 2 && sortingType === 'expiryDate'" />
                                </th>

                                <th id="cost-header" title="Ordenar por costo" @click="sortProducts('cost')">
                                    Costo
                                    <ArrowDown01 class="float-right"
                                        v-if="sortSetting === 1 && sortingType === 'cost'" />
                                    <ArrowUp10 class="float-right" v-if="sortSetting === 2 && sortingType === 'cost'" />
                                </th>

                                <th id="actions-header">Acciones</th>
                            </tr>
                        </thead>

                        <tbody v-if="products.length">
                            <tr v-for="(product, index) in products" :key="index" :class="{
                                'close-to-expiry-red': closeToExpiry(product.expiryDate.toString()) === 'red',
                                'close-to-expiry-yellow': closeToExpiry(product.expiryDate.toString()) === 'yellow',
                                'expired-product': closeToExpiry(product.expiryDate.toString()) === 'expired'
                            }">

                                <td class="product-name">
                                    <span v-if="closeToExpiry(product.expiryDate.toString()) === 'red'"
                                        class="expired-icon" title="Vence en menos de una semana">⚠️</span>

                                    <span v-if="closeToExpiry(product.expiryDate.toString()) === 'expired'"
                                        class="expired-icon" title="Vencido">🚫</span>

                                    <span v-if="editingProductId !== product.id || editingField !== 'name'"
                                        @click="editField(product.id, product.name, 'name')"
                                        :class="{ 'strikethrough': closeToExpiry(product.expiryDate.toString()) === 'expired' }">
                                        {{ product.name }}
                                    </span>

                                    <input v-else-if="editingField == 'name'" type="text" minlength="0"
                                        class="edit-input edit-input-primary" v-model="newProductValue"
                                        @keyup.enter="updateProduct(product.id)" />

                                    <span v-if="editingProductId !== product.id || editingField !== 'description'"
                                        class="product-description"
                                        @click="editField(product.id, product.description, 'description')">
                                        ({{ product.description }})
                                    </span>

                                    <input v-else-if="editingField == 'description'" type="text" minlength="0"
                                        class="edit-input edit-input-secondary" v-model="newProductValue"
                                        @keyup.enter="updateProduct(product.id)" />
                                </td>

                                <td class="product-quantity">
                                    <span v-if="editingProductId !== product.id || editingField !== 'quantity'"
                                        @click="editField(product.id, String(product.quantity), 'quantity')">
                                        {{ product.quantity }}
                                    </span>

                                    <input v-else-if="editingField == 'quantity'" type="number" min="0"
                                        class="edit-input edit-input-primary edit-input-quantity"
                                        v-model="newProductValue" @keyup.enter="updateProduct(product.id)"
                                        @input="preventNegative" @keydown="preventInvalidKey" />
                                </td>

                                <td class="product-purchase-date product-date-cell">
                                    <span v-if="editingProductId !== product.id || editingField !== 'purchaseDate'"
                                        @click="editField(product.id, product.purchaseDate, 'purchaseDate')">
                                        {{ product.purchaseDate === 'N/A'
                                            ? "N/A"
                                            : formatDate(product.purchaseDate) }}
                                    </span>

                                    <input v-else-if="editingField == 'purchaseDate'" type="date"
                                        class="edit-input edit-input-primary edit-input-date" v-model="newProductValue"
                                        @keyup.enter="updateProduct(product.id)" />
                                </td>

                                <td class="product-expiry-date product-date-cell">
                                    <span v-if="editingProductId !== product.id || editingField !== 'expiryDate'"
                                        @click="editField(product.id, product.expiryDate, 'expiryDate')">
                                        {{ product.expiryDate === 'No expira'
                                            ? 'No expira'
                                            : formatDate(product.expiryDate)
                                        }}
                                    </span>

                                    <input v-else-if="editingField == 'expiryDate'" type="date"
                                        class="edit-input edit-input-primary edit-input-date" v-model="newProductValue"
                                        @keyup.enter="updateProduct(product.id)" />
                                </td>

                                <td class="product-cost">
                                    $<span v-if="editingProductId !== product.id || editingField !== 'cost'"
                                        @click="editField(product.id, String(product.cost), 'cost')">
                                        {{ product.cost }}
                                    </span>

                                    <input v-else-if="editingField == 'cost'" type="number" min="0"
                                        class="edit-input edit-input-primary edit-input-cost" v-model="newProductValue"
                                        @keyup.enter="updateProduct(product.id)" @input="preventNegative"
                                        @keydown="preventInvalidKey" />

                                    <span class="product-unit-cost"> (${{ formatUnitCost(product.cost, product.quantity)
                                    }} c/u)</span>
                                </td>

                                <td class="actions">
                                    <button class="btn btn-danger delete-btn" title="Borrar producto"
                                        @click="showDeleteConfirmation(product.id)">
                                        <LucideTrash2 class="small" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationDialog class="modal-ov" v-if="isDeleting"
                :message="'¿Estás seguro que querés eliminar este producto?'" :isVisible="isDeleting" blueText="Si"
                :isImporting="false" @confirm="confirmDelete" @cancel="cancelDelete" />

            <ConfirmationDialog class="modal-ov" v-if="isImporting" :message="importConfirmationMessage"
                :isVisible="isImporting" blueText="Agregar" redText="Reemplazar" :isImporting="true"
                @confirm="addFromImport" @cancel="cancelImport" @replace="replaceFromImport" />
        </div>
    </div>
</template>

<style>
#option-modal-btn {
    color: var(--options-modal-button);
    border: none;
    position: absolute;
    right: 5px;
    top: 5px;
}

#grip-icon {
    width: 40px;
    height: 40px;
    transition: color 0.2s;
}

#grip-icon:hover {
    color: var(--options-modal-icon-hover-color);
}

#inventory-header {
    user-select: none;
}

#functions-container {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

#product-list-container {
    margin-top: 20px;
    font-family: "Roboto", Helvetica, sans-serif;
}

#search-bar-container {
    max-width: 30%;
    flex-shrink: 0;
}

#checkbox-container {
    display: flex;
    flex-direction: row;
    width: 40%;
    height: 10%;
}

.table-checkbox {
    height: 15px;
    width: 15px;
}

button {
    transition: background-color 0.33s, box-shadow 0.33s;
}

#open-modal-btn {
    position: absolute;
    left: 50%;
    height: 100%;
    transform: translateX(-50%);
}

#open-modal-btn:hover {
    box-shadow: 0 0 2px 0 #207349;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--confirmation-dialog-background-color);
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(5px);
    z-index: 3;
}

#filter-button-container {
    display: flex;
    flex-direction: row;
}

.filter-btn {
    margin: 0 10px;
}

#two-weeks-btn {
    color: #000000;
    background-color: #fadc00;
}

#two-weeks-btn:hover {
    color: #000000 !important;
    background-color: #d2b400;
    box-shadow: 0 0 2px 0 #d2b400;
}

#one-week-btn {
    color: #ffffff !important;
    background-color: #ff0000;
}

#one-week-btn:hover {
    color: #ffffff !important;
    background-color: #af0000;
    box-shadow: 0 0 2px 0 #af0000;
}

#expired-btn {
    color: #ffffff;
    background-color: #505050;
}

#expired-btn:hover {
    color: #ffffff !important;
    background-color: #404040;
    box-shadow: 0 0 2px 0 #404040;
}

#current-date {
    color: #000000;
    font-family: "Roboto", Helvetica, sans-serif;
}

#table-container {
    max-height: 78vh;
    overflow-y: auto;
    width: 100%;
    border: 1px ridge var(--table-container-border-color);
    font-family: "Roboto", Helvetica, sans-serif;
    scrollbar-width: thin;
    scrollbar-color: var(--expired-product-color) var(--body-background-color);
}

.product-table {
    width: 100%;
}

thead {
    background-color: #f2f2f2;
    border: 1px solid var(--options-modal-button);
    border-top: none;
}

.product-table th {
    position: sticky;
    top: 0;
    background-color: #f2f2f2;
    color: #202020;
    text-align: center;
    padding: 8px 7px 8px 7px;
    font-size: 18px;
    z-index: 2;
}

.product-table td {
    border: 1px solid var(--options-modal-button);
    padding: 8px 7px 8px 7px;
    font-size: 18px;
    font-family: "Roboto", Helvetica, sans-serif;
}

th {
    position: relative;
    user-select: none;
    cursor: pointer;
}

#actions-header {
    cursor: default;
}

.float-right {
    position: absolute;
    right: 0;
    margin-right: 3%;
    top: 50%;
    transform: translateY(-50%);
}

.close-to-expiry-red {
    background-color: rgba(255, 0, 0, 0.33);
}

.close-to-expiry-yellow {
    background-color: rgba(255, 251, 0, 0.33);
}

.expired-product {
    background-color: var(--expired-product-color);
    color: rgba(255, 0, 0, 0.8);
}

.expired-product>.actions {
    color: #f2f2f2;
}

.strikethrough {
    text-decoration: line-through;
}

.expired-icon {
    margin-right: 5px;
    color: rgba(255, 0, 0, 0.8);
    user-select: none;
    cursor: help;
}

.product-description,
.product-unit-cost {
    color: var(--description-color);
    font-size: 16px;
}

.product-name {
    width: 25%;
}

.product-quantity {
    width: 12%;
    font-family: "Nunito", Arial, Helvetica, sans-serif !important;
}

.product-purchase-date {
    width: 17.5%;
}

.product-expiry-date {
    width: 20%;
}

.product-cost {
    width: 13.5%;
    font-family: "Nunito", Arial, Helvetica, sans-serif !important;
}

.actions {
    width: 7.5%;
}

.small {
    width: 20px;
    height: 20px;
}

.edit-input {
    background-color: var(--table-text-input-background-color);
    color: var(--text-color);
    border: 1px solid var(--text-color);
    text-align: center;
    width: 50%;
    height: 38px;
    max-height: 38px;
    max-width: 50%;
}

.edit-input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(var(--date-input-calendar-icon-value));
    cursor: pointer;
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

.edit-input-cost {
    min-width: 50px;
    max-width: 100px;
    padding: 0;
    margin: 0;
}

.delete-btn:hover {
    box-shadow: 0 0 2px 0 #b8293e;
}

.pdf-export #table-container {
    scrollbar-width: none;
    scrollbar-color: transparent;
}

.pdf-export .product-name {
    color: rgb(0, 0, 0) !important;
    /* Adjust font color for table rows */
}

.pdf-export .product-description {
    color: rgb(66, 66, 66) !important;
}

.pdf-export .product-quantity {
    color: rgb(0, 0, 0) !important;
    /* Adjust font color for quantity column */
}

.pdf-export .product-purchase-date {
    color: rgb(0, 0, 0) !important;
    /* Adjust font color for purchase date */
}

.pdf-export .product-expiry-date {
    color: rgb(0, 0, 0) !important;
    /* Adjust font color for expiry date */
}

.pdf-export .product-cost {
    color: rgb(0, 0, 0) !important;
    /* Adjust font color for cost */
}

.pdf-export .product-unit-cost {
    color: rgb(66, 66, 66) !important;
    /* Adjust font color for cost */
}

/* Exclude delete button from PDF */
.pdf-export .actions,
.pdf-export #actions-header {
    display: none;
    /* Hide delete button column */
}

.pdf-export .close-to-expiry-red {
    background-color: rgb(255, 175, 175);
    /* Soft pastel red */
}

.pdf-export .close-to-expiry-yellow {
    background-color: rgb(235, 240, 180);
    /* Soft pastel yellow */
}

.pdf-export .expired-product {
    background-color: #dddddd;
    /* Light gray */
    color: #222;
    /* Dark gray/black for readability */
}

.pdf-export #current-date {
    visibility: visible;
}
</style>