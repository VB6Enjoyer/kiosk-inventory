<script setup lang="ts">
import { ref, defineProps } from 'vue';
import { Search, X } from 'lucide-vue-next';

const searchValue = ref<string>("");
const isModalOpen = ref<boolean>(false);

const emit = defineEmits(['search', 'open-search-modal']);

const props = defineProps<{
    isAdvancedSearching: boolean
}>();

function simpleSearch(event: Event){
    const target = event.target as HTMLInputElement;
    searchValue.value = target.value;
    emit('search', searchValue.value);
}

function clearSearch(event: Event){
    event.preventDefault();
    searchValue.value = "";
    (document.getElementById("search-input") as HTMLInputElement).value = "";
    emit('search', "");
}

function openSearchModal(){
    isModalOpen.value = true;
    emit('open-search-modal', isModalOpen.value);
}
</script>

<template>
    <div id="search-container">
        <input type="search" id="search-input" @input="simpleSearch" placeholder="Buscar" />
        <Search v-if="searchValue.trim().length == 0 && !props.isAdvancedSearching" id="search-icon" class="search-bar-icon"/>
        <button v-if="searchValue.trim().length > 0 || props.isAdvancedSearching" id="btn cancel-btn" @click="clearSearch"><X id="cancel-icon" class="search-bar-icon"/></button>
        <button type="button" id="advanced-search-btn" class="btn btn-primary" @click="openSearchModal">Búsqueda avanzada</button>
    </div>
</template>

<style scoped>
#search-container{
    float: left;
    display: flex;
    flex-direction: row;
    width: 100%;
}

#search-input{
    font-size: 18px;
    align-items: center;
    padding: 7px 10px 7px 40px;
}

input[type="search"]::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
    display: none;
}

#cancel-icon:hover{
    color: red;
}

.search-bar-icon{
    z-index: 1;
    position: absolute;
    top: 23%;
    left: 10px;
    width: 26px;
    height: 26px;
}

#advanced-search-btn{
    z-index: 1;
    position: absolute;
    top: 0px;
    left: 307px;
    padding: 10px;
}
</style>