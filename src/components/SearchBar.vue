<script setup lang="ts">
import { ref, defineProps, watch, onMounted, onUnmounted } from 'vue';
import { Search, X } from 'lucide-vue-next';
import { useCurrentlyOpenModalStore } from '../stores/openModal';

const searchValue = ref<string>("");
const isModalOpen = ref<boolean>(false);

const currentlyOpenModalStore = useCurrentlyOpenModalStore();

const emit = defineEmits(['search', 'open-search-modal']);

const props = defineProps<{
    isAdvancedSearching: boolean
}>();

function simpleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    searchValue.value = target.value;
    emit('search', searchValue.value);
}

function clearSearch() {
    searchValue.value = "";
    (document.getElementById("search-input") as HTMLInputElement).value = "";
    emit('search', "");
}

function openSearchModal() {
    isModalOpen.value = true;
    emit('open-search-modal', isModalOpen.value);
}

function handleGlobalKeydown(event: KeyboardEvent) {
    if (currentlyOpenModalStore.isModalOpen) return;
    // Ignore if user is typing in an input, textarea, or contenteditable
    const tag = (event.target as HTMLElement).tagName;
    const isEditable = (event.target as HTMLElement).isContentEditable;
    if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        isEditable
    ) {
        return;
    }

    // Q: Focus search bar
    if (event.key === 'q' || event.key === 'Q') {
        const input = document.getElementById("search-input") as HTMLInputElement | null;
        if (input) {
            input.focus();
            event.preventDefault();
        }
    }
    // X: Clear search
    else if (event.key === 'x' || event.key === 'X') {
        clearSearch();
        event.preventDefault();
    }
    // B: Open advanced search modal
    else if (event.key === 'b' || event.key === 'B') {
        openSearchModal();
        event.preventDefault();
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalKeydown);
});

watch(
    () => props.isAdvancedSearching,
    (newVal) => {
        if (newVal) {
            searchValue.value = "";
            const input = document.getElementById("search-input") as HTMLInputElement | null;
            if (input) input.value = "";
        }
    }
);
</script>

<template>
    <div id="search-container">
        <input type="search" id="search-input" title="Buscar productos por nombre y descripción" placeholder="Buscar"
            autocomplete="name" @input="simpleSearch" />

        <Search v-if="searchValue.trim().length == 0 && !props.isAdvancedSearching" id="search-icon"
            class="search-bar-icon" />

        <button v-if="searchValue.trim().length > 0 || props.isAdvancedSearching" id="btn cancel-btn"
            title="Cancelar búsqueda" @click.prevent="clearSearch">
            <X id="cancel-icon" class="search-bar-icon" />
        </button>

        <button type="button" id="advanced-search-btn" class="btn btn-primary" title="Abrir menú de búsqueda avanzada"
            @click="openSearchModal">Búsqueda
            avanzada</button>
    </div>
</template>

<style scoped>
#search-container {
    float: left;
    display: flex;
    flex-direction: row;
    width: 100%;
}

#search-input {
    font-size: 18px;
    align-items: center;
    padding: 7px 10px 7px 40px;
    color: var(--text-color);
    background-color: var(--text-input-background-color);
    border: 1px solid var(--search-bar-border-color);
    transition: border 0.33s, box-shadow 0.33s, background-color 0.33s;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
}

#search-input::placeholder {
    color: var(--input-focus-shadow);
}

#search-input:focus {
    outline: none;
    border: 1px solid var(--text-color);
    box-shadow: 0 0 2px 0px var(--input-focus-shadow);
}

input[type="search"]::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
    display: none;
}

#cancel-icon {
    color: var(--copy-button-hover-color);
    transition: color 0.25s;
}

#cancel-icon:hover {
    color: var(--close-button-hover);
}

.search-bar-icon {
    z-index: 1;
    position: absolute;
    top: 22%;
    left: 10px;
    width: 26px;
    height: 26px;
}

#advanced-search-btn {
    z-index: 1;
    position: absolute;
    top: 0px;
    left: 307px;
    padding: 8.5px 10px;
}

#advanced-search-btn:hover {
    box-shadow: 0 0 2px 0 var(--blue-button-hover);
}
</style>