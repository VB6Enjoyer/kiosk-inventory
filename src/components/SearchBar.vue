<script setup lang="ts">
import { ref, defineProps, watch, onMounted, onUnmounted } from 'vue';
import { Search, X } from 'lucide-vue-next';
import { useCurrentlyOpenModalStore } from '../stores/openModal';

const searchValue = ref<string>("");
const isModalOpen = ref<boolean>(false);

const currentlyOpenModalStore = useCurrentlyOpenModalStore();

const emit = defineEmits(['search', 'open-search-modal', 'focus-change']);

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

function handleFocus() {
    emit('focus-change', true);
}

function handleBlur() {
    emit('focus-change', false);
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
        <div class="input-wrapper">
            <input type="search" id="search-input" title="Buscar productos por nombre y descripción (Q)"
                placeholder="Buscar" autocomplete="name" @input="simpleSearch" @focus="handleFocus"
                @blur="handleBlur" />

            <Search v-if="searchValue.trim().length == 0 && !props.isAdvancedSearching" id="search-icon"
                class="search-bar-icon" />

            <button v-if="searchValue.trim().length > 0 || props.isAdvancedSearching" id="cancel-btn" class="btn"
                title="Cancelar búsqueda (X)" @click.prevent="clearSearch">
                <X id="cancel-icon" class="search-bar-icon" />
            </button>
        </div>

        <button type="button" id="advanced-search-btn" class="btn btn-primary"
            title="Abrir menú de búsqueda avanzada (B)" @click="openSearchModal">Búsqueda
            avanzada</button>
    </div>
</template>

<style scoped>
#search-container {
    float: left;
    display: flex;
    flex-direction: row;
    width: 100%;
    position: relative;
    align-items: center;
    box-sizing: border-box;
}

.input-wrapper {
    position: relative;
    display: inline-block;
    width: clamp(10px, 15vw, 260px);
    min-width: 0;
}

#search-input {
    width: 100%;
    min-width: 0;
    font-size: clamp(0.8rem, 1vw, 1.125rem);
    align-items: center;
    padding: clamp(3.5px, 1.5vw, 6px) clamp(8px, 2vw, 10px) clamp(5px, 1.5vw, 10px) clamp(35px, 8vw, 40px);
    color: var(--text-color);
    background-color: var(--text-input-background-color);
    border: 1px solid var(--search-bar-border-color);
    transition: border 0.33s, box-shadow 0.33s, background-color 0.33s;
    appearance: none;
    border-radius: 4px;
    box-sizing: border-box;
    min-height: 24px;
    max-height: 43px;
    height: 43px;
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

#cancel-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    padding: 0;
    width: clamp(24px, 6vw, 28px);
    height: clamp(24px, 6vw, 28px);
    left: 1vh;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s;
    border-radius: 2px;
}

#cancel-btn:hover #cancel-icon {
    color: var(--close-button-hover);
}

#cancel-btn[aria-hidden="true"] {
    opacity: 0;
    pointer-events: none;
}

#cancel-icon {
    left: 0;
    color: var(--copy-button-hover-color);
    transition: color 0.25s;
    width: clamp(16px, 4vw, 26px);
    height: clamp(16px, 4vw, 26px);
}

.search-bar-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: clamp(8px, 2vw, 10px);
    width: clamp(20px, 5vw, 26px);
    height: clamp(20px, 5vw, 26px);
    pointer-events: none;
}

#advanced-search-btn {
    flex: 1 1 0;
    width: clamp(90px, 15vw, 165px);
    min-width: 0;
    max-width: 220px;
    padding: clamp(6px, 1.5vw, 8.5px) clamp(8px, 2vw, 10px) clamp(6px, 1.5vw, 8.5px);
    font-size: clamp(0.75rem, 1vw, 1rem);
    white-space: nowrap;
    text-overflow: ellipsis;
    box-sizing: border-box;
    height: auto;
    min-height: clamp(32px, 8vw, 36px);
    margin-left: 7px;
    flex-shrink: 1;
}

#advanced-search-btn:hover {
    box-shadow: 0 0 2px 0 var(--blue-button-hover);
}

@media (max-width: 786px) {
    #search-input {
        padding: 0px;
        padding-left: 40px;
    }

    .search-bar-icon,
    #cancel-icon {
        width: 22px;
        height: 22px;
    }

    #cancel-btn {
        width: 22px;
        height: 22px;
    }

    #advanced-search-btn {
        font-size: clamp(0.6rem, 1vw, 1rem);
        padding: 0;
        margin-left: 4px;
    }
}

@media (max-height: 600px) {
    #search-input {
        padding: 0px;
        padding-left: 30px;
    }

    .search-bar-icon {
        width: 18px;
        height: 18px;
        left: 6px;
    }

    #cancel-btn {
        width: 20px;
        height: 20px;
    }

    #cancel-icon {
        width: 18px;
        height: 18px;
    }

    #advanced-search-btn {
        font-size: clamp(0.7rem, 1vw, 1rem);
        min-height: 32px;
        padding: 0 auto;
    }
}

@media (max-width: 600px) {
    #search-input {
        padding: 0px;
        padding-left: 27px;
    }

    .search-bar-icon {
        width: 18px;
        height: 18px;
        left: 5px;
    }

    #cancel-btn {
        width: 20px;
        height: 20px;
    }

    #cancel-icon {
        width: 18px;
        height: 18px;
    }

    #advanced-search-btn {
        position: absolute;
        top: 3px;
        width: clamp(5%, 15vw, 15%);
        font-size: 0.6rem;
        text-wrap: wrap;
    }
}

@media (max-height: 500px) and (orientation: landscape) {
    #search-input {
        padding: 0 0 0 28px;
        font-size: 0.85rem;
        min-height: 28px;
    }

    .search-bar-icon {
        width: 16px;
        height: 16px;
    }

    #cancel-btn {
        width: 18px;
        height: 18px;
    }

    #cancel-icon {
        width: 16px;
        height: 16px;
    }

    #advanced-search-btn {
        padding: 0 auto;
        font-size: 0.75rem;
        white-space: nowrap;
        flex-shrink: 0;
    }
}
</style>